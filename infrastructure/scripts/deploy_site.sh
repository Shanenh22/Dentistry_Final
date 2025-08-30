#!/usr/bin/env bash
# deploy_site.sh - Sync local folder to S3 and invalidate CloudFront
# Usage: ./deploy_site.sh -b bucket-name -d DISTRIBUTION_ID [-p path]
set -euo pipefail
while getopts "b:d:p:" opt; do
  case $opt in
    b) BUCKET="$OPTARG";;
    d) DIST_ID="$OPTARG";;
    p) PATHROOT="$OPTARG";;
    *) echo "Usage: $0 -b bucket -d distId [-p localPath]"; exit 1;;
  esac
done
if [[ -z "${BUCKET:-}" || -z "${DIST_ID:-}" ]]; then
  echo "Usage: $0 -b bucket -d distId [-p localPath]"
  exit 1
fi
PATHROOT="${PATHROOT:-.}"
aws s3 sync "$PATHROOT" "s3://$BUCKET" --delete --exclude ".git/*" --exclude ".github/*" --cache-control max-age=60
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"
echo "Deployed to s3://$BUCKET and invalidated CloudFront $DIST_ID"
