#!/bin/bash
# deploy-contact-api.sh
# Wrapper for SAM build & deploy with parameters for contact API

set -euo pipefail

STACK=svd-contact-api
REGION=$(aws configure get region)

echo "Building SAM"
sam build -t template.yaml

echo "Deploying stack: $STACK"
sam deploy --stack-name $STACK --resolve-s3 --capabilities CAPABILITY_IAM --region $REGION --parameter-overrides FromEmail=$1 ToEmail=$2
