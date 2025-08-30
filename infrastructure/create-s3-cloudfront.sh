#!/bin/bash
# create-s3-cloudfront.sh
# One-command setup of S3 bucket, CloudFront distribution (with OAC), headers policy, and Route 53 records.
# REQUIREMENTS: AWS CLI v2, jq, hosted zone already created in Route 53.

set -euo pipefail

DOMAIN=$1
BUCKET=${DOMAIN//./-}-site

echo "Creating private S3 bucket: $BUCKET"
aws s3api create-bucket --bucket $BUCKET --create-bucket-configuration LocationConstraint=$(aws configure get region)
aws s3api put-bucket-encryption --bucket $BUCKET --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

echo "Creating OAC"
OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config '{
  "Name": "SVD-OAC",
  "Description": "Access control for '$BUCKET'",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}' | jq -r '.OriginAccessControl.Id')

echo "Attaching Response Headers Policy from JSON"
POLICY_ID=$(aws cloudfront create-response-headers-policy --response-headers-policy-config file://cloudfront-headers-policy.json | jq -r '.ResponseHeadersPolicy.Id')

echo "Requesting ACM cert in us-east-1"
CERT_ARN=$(aws acm request-certificate --domain-name $DOMAIN --validation-method DNS --region us-east-1 | jq -r '.CertificateArn')
echo "Remember to create DNS validation CNAME in Route 53."

echo "Creating CloudFront distribution"
DIST_ID=$(aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "'$(date +%s)'",
  "Origins": [{
    "Id": "S3Origin",
    "DomainName": "'$BUCKET'.s3.amazonaws.com",
    "S3OriginConfig": {},
    "OriginAccessControlId": "'$OAC_ID'"
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": ["GET","HEAD"],
    "CachedMethods": ["GET","HEAD"],
    "Compress": true,
    "ForwardedValues": {"QueryString": false, "Cookies":{"Forward":"none"}},
    "ResponseHeadersPolicyId": "'$POLICY_ID'"
  },
  "DefaultRootObject": "index.html",
  "Enabled": true,
  "Comment": "SVD site",
  "ViewerCertificate": {"ACMCertificateArn": "'$CERT_ARN'", "SSLSupportMethod":"sni-only","MinimumProtocolVersion":"TLSv1.2_2021"}
}' | jq -r '.Distribution.Id')

echo "Distribution $DIST_ID created. Waiting for deployment..."
aws cloudfront wait distribution-deployed --id $DIST_ID
echo "CloudFront distribution deployed."

echo "Creating Route 53 alias record"
HZ_ID=$(aws route53 list-hosted-zones-by-name --dns-name $DOMAIN --query "HostedZones[0].Id" --output text)
CF_DOMAIN=$(aws cloudfront get-distribution --id $DIST_ID | jq -r '.Distribution.DomainName')

aws route53 change-resource-record-sets --hosted-zone-id $HZ_ID --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "'$DOMAIN'",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "'$CF_DOMAIN'",
        "EvaluateTargetHealth": false
      }
    }
  }]
}'
echo "Setup complete. Validate certificate in ACM, then site will be live."
