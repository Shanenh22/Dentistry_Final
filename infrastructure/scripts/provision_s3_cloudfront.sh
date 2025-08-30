#!/usr/bin/env bash
# provision_s3_cloudfront.sh - Create S3 bucket, OAC CloudFront, Response Headers Policy, ACM cert, and Route53 records
# Usage: ./provision_s3_cloudfront.sh -d example.com -z ZONEID [-a www.example.com] [-b bucket-name] [-r us-east-1]
set -euo pipefail

CF_ZONE_ID="Z2FDTNDATAQYW2" # CloudFront hosted zone id for Alias
ALT_DOMAIN=""
BUCKET=""
AWS_REGION="us-east-1"  # S3 bucket region (and default CLI region)
while getopts "d:z:a:b:r:" opt; do
  case $opt in
    d) DOMAIN="$OPTARG";;
    z) HOSTED_ZONE_ID="$OPTARG";;
    a) ALT_DOMAIN="$OPTARG";;
    b) BUCKET="$OPTARG";;
    r) AWS_REGION="$OPTARG";;
    *) echo "Usage: $0 -d domain -z hostedZoneId [-a altDomain] [-b bucketName] [-r region]"; exit 1;;
  esac
done

if [[ -z "${DOMAIN:-}" || -z "${HOSTED_ZONE_ID:-}" ]]; then
  echo "Missing required flags. Usage: $0 -d domain -z hostedZoneId [-a altDomain] [-b bucketName] [-r region]"
  exit 1
fi

if [[ -z "$BUCKET" ]]; then
  BUCKET="${DOMAIN//./-}-site"
fi

echo "==> Using domain: $DOMAIN"
[[ -n "$ALT_DOMAIN" ]] && echo "==> Alt domain: $ALT_DOMAIN"
echo "==> Bucket: $BUCKET (region: $AWS_REGION)"
echo "==> Hosted Zone: $HOSTED_ZONE_ID"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
EMAIL="admin@$DOMAIN"

# 1) Create S3 bucket (private) + block public access
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "-- S3 bucket exists: $BUCKET"
else
  echo "-- Creating S3 bucket: $BUCKET"
  if [[ "$AWS_REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$BUCKET"
  else
    aws s3api create-bucket --bucket "$BUCKET" --create-bucket-configuration LocationConstraint="$AWS_REGION"
  fi
fi
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# 2) Create Origin Access Control (OAC)
OAC_ID=$(aws cloudfront list-origin-access-controls --query "OriginAccessControls.Items[?Name=='${DOMAIN}-oac'].Id" --output text)
if [[ "$OAC_ID" == "None" || -z "$OAC_ID" ]]; then
  echo "-- Creating OAC"
  OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config "$(cat <<JSON
{
  "Name": "${DOMAIN}-oac",
  "Description": "OAC for ${DOMAIN}",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}
JSON
)" --query 'OriginAccessControl.Id' --output text)
else
  echo "-- Found existing OAC: $OAC_ID"
fi

# 3) Create Response Headers Policy (security headers) if not exists
RHP_ID=$(aws cloudfront list-response-headers-policies --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='SVD-Policy'].ResponseHeadersPolicy.Id" --output text 2>/dev/null || echo "")
if [[ -z "$RHP_ID" || "$RHP_ID" == "None" ]]; then
  echo "-- Creating Response Headers Policy"
  RHP_ID=$(aws cloudfront create-response-headers-policy --response-headers-policy-config "$(cat <<'JSON'
{
  "Name": "SVD-Policy",
  "Comment": "Security headers for SVD",
  "SecurityHeadersConfig": {
    "ContentSecurityPolicy": { "Override": true, "ContentSecurityPolicy": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' https://plausible.io; connect-src 'self' https://plausible.io; frame-ancestors 'self'" },
    "StrictTransportSecurity": { "Override": true, "AccessControlMaxAgeSec": 31536000, "IncludeSubdomains": true, "Preload": true },
    "XContentTypeOptions": { "Override": true },
    "FrameOptions": { "Override": true, "FrameOption": "SAMEORIGIN" },
    "ReferrerPolicy": { "Override": true, "ReferrerPolicy": "strict-origin-when-cross-origin" },
    "PermissionsPolicy": { "Override": true, "PermissionsPolicy": "geolocation=(), microphone=(), camera=()" }
  }
}
JSON
)" --query 'ResponseHeadersPolicy.Id' --output text)
else
  echo "-- Found existing Response Headers Policy: $RHP_ID"
fi

# 4) ACM certificate in us-east-1 (required by CloudFront)
CERT_ARN=$(aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn" --output text)
if [[ -z "$CERT_ARN" || "$CERT_ARN" == "None" ]]; then
  echo "-- Requesting ACM certificate"
  ALT_ARG=""; [[ -n "$ALT_DOMAIN" ]] && ALT_ARG="--subject-alternative-names $ALT_DOMAIN"
  CERT_ARN=$(aws acm request-certificate --region us-east-1 --domain-name "$DOMAIN" $ALT_ARG --validation-method DNS --query CertificateArn --output text)
  echo "-- Certificate ARN: $CERT_ARN"

  echo "-- Creating DNS validation records in Route53"
  VALS=$(aws acm describe-certificate --region us-east-1 --certificate-arn "$CERT_ARN" --query "Certificate.DomainValidationOptions" --output json)
  python3 - "$VALS" "$HOSTED_ZONE_ID" <<'PY'
import json, sys, subprocess, tempfile
vals=json.loads(sys.argv[1])
hz=sys.argv[2]
changes={"Changes":[]}
for v in vals:
    rr=v["ResourceRecord"]
    changes["Changes"].append({"Action":"UPSERT","ResourceRecordSet":{"Name":rr["Name"],"Type":rr["Type"],"TTL":300,"ResourceRecords":[{"Value":rr["Value"]}]}})
with tempfile.NamedTemporaryFile('w', delete=False) as f:
    json.dump(changes, f)
    fname=f.name
subprocess.check_call(["aws","route53","change-resource-record-sets","--hosted-zone-id",hz,"--change-batch",f"file://{fname}"])
PY
  echo "-- Waiting for certificate validation..."
  aws acm wait certificate-validated --region us-east-1 --certificate-arn "$CERT_ARN"
else
  echo "-- Using existing ACM certificate: $CERT_ARN"
fi

# 5) Create CloudFront distribution
EXISTING_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items, '$DOMAIN')].Id" --output text 2>/dev/null || echo "")
if [[ -z "$EXISTING_DIST_ID" || "$EXISTING_DIST_ID" == "None" ]]; then
  echo "-- Creating CloudFront distribution"
  ALIASES_ITEMS=""$DOMAIN""
  QUANTITY=1
  if [[ -n "$ALT_DOMAIN" ]]; then ALIASES_ITEMS=""$DOMAIN","$ALT_DOMAIN""; QUANTITY=2; fi
  cat > /tmp/distribution.json <<JSON
{
  "CallerReference": "$(date +%s)",
  "Aliases": {"Quantity": $QUANTITY, "Items": [ $ALIASES_ITEMS ]},
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "s3-$BUCKET",
      "DomainName": "$BUCKET.s3.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" },
      "OriginAccessControlId": "$OAC_ID"
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-$BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] },
    "Compress": true,
    "ForwardedValues": { "QueryString": true, "Cookies": { "Forward": "none" } },
    "TrustedSigners": { "Enabled": false, "Quantity": 0 },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "ResponseHeadersPolicyId": "$RHP_ID"
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 403, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 0 },
      { "ErrorCode": 404, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 0 }
    ]
  },
  "Comment": "SVD site",
  "Enabled": true,
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_100"
}
JSON
  CREATE_OUT=$(aws cloudfront create-distribution --distribution-config file:///tmp/distribution.json)
  DIST_ID=$(echo "$CREATE_OUT" | jq -r '.Distribution.Id')
  CF_DOMAIN=$(echo "$CREATE_OUT" | jq -r '.Distribution.DomainName')
  echo "-- Distribution ID: $DIST_ID"
else
  echo "-- Using existing distribution: $EXISTING_DIST_ID"
  DIST_ID="$EXISTING_DIST_ID"
  CF_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query "Distribution.DomainName" --output text)
fi

# 6) Update S3 bucket policy to allow CloudFront OAC
echo "-- Applying S3 bucket policy for CloudFront distribution"
cat > /tmp/policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::$BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DIST_ID"
        }
      }
    }
  ]
}
JSON
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/policy.json

# 7) Route 53 alias records
echo "-- Creating Route53 alias records to CloudFront"
cat > /tmp/alias.json <<JSON
{
  "Comment": "Alias records for CloudFront",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$CF_ZONE_ID",
          "DNSName": "$CF_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }$( [[ -n "$ALT_DOMAIN" ]] && echo ",
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$ALT_DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$CF_ZONE_ID",
          "DNSName": "$CF_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }" )
  ]
}
JSON
aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" --change-batch file:///tmp/alias.json >/dev/null

echo "==> Done."
echo "CloudFront Domain: $CF_DOMAIN"
echo "Distribution ID:   $DIST_ID"
echo "S3 Bucket:         s3://$BUCKET"
