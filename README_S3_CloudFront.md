# Spring Valley Dental Associates — S3 + CloudFront Deployment (Architecture A)

This folder is ready for **S3 (private)** behind **CloudFront (OAC)** with **API Gateway + Lambda + SES** for forms.

## Contents
- Static site (HTML/CSS/JS/images)
- `nav.js` (accessible navigation)
- `anti-spam.js` (honeypot + timer + token)
- `site-config.js` (API endpoint, analytics toggles)
- `analytics.js` (Plausible loader, optional)
- `form-submit.js` (sends form data to API)
- `404.html` (for CloudFront custom error responses)
- `/infrastructure/sam-contact-api` (API Gateway + Lambda + SES via AWS SAM)
- `/infrastructure/cloudfront-headers-policy.json` (security headers policy)
- `.github/workflows/deploy-s3-cloudfront.yml` (CI sample)

## Quick Start
1. **Create S3 bucket** (name matches your domain or subdomain). **Do NOT enable static website hosting.**
2. **Upload all files** in this folder to the bucket root (e.g., `index.html`, `nav.js`, `css/`, etc.).
3. **Create OAC CloudFront distribution** (Origin Access Control) to the bucket (private origin).  
   - Default root: `index.html`  
   - Add **Custom Error Responses** mapping 403/404 → `/404.html` (HTTP 200 or 404).
   - Attach the provided **Response Headers Policy** (CSP/HSTS/etc.) or create a new one from `infrastructure/cloudfront-headers-policy.json`.
4. **ACM certificate** in `us-east-1` for your domain (and `www` if used).
5. **Route 53**: point your domain to the CloudFront distribution (A/AAAA alias).
6. **(Optional) WAF**: attach AWS WAF managed rules to the distribution.
7. **Contact API** (serverless):
   - Deploy `/infrastructure/sam-contact-api` (see its README). This creates the API endpoint and Lambda that sends emails via SES.
   - Put the **API invoke URL** into `site-config.js` (`CONTACT_API_URL`).
   - (Optional) enable Turnstile (set `ENABLE_TURNSTILE: true` and `TURNSTILE_SITE_KEY`).
8. **Plausible (optional):** set `ANALYTICS.DOMAIN` to your domain in `site-config.js` to enable analytics.
9. **Invalidate** CloudFront to pick up new files.

## CI/CD (optional)
Use `.github/workflows/deploy-s3-cloudfront.yml` to sync the bucket and invalidate CloudFront on every push.

See **HOW_TO_ADD_PAGE.md** for content changes and page creation.


## One-command Provisioning (AWS CLI)
Run from `infrastructure/scripts` after setting up AWS CLI and Route53 zone:

```bash
cd infrastructure/scripts
bash provision_s3_cloudfront.sh -d yourdomain.com -z Z123456ABCDEF -a www.yourdomain.com -b yourdomain-site -r us-east-1
```

This will:
- create the S3 bucket (private, blocked public access)
- create OAC, Response Headers Policy, ACM cert (with DNS validation in your zone)
- create the CloudFront distribution using that cert and headers
- attach the bucket policy allowing CloudFront access
- create Route53 alias records pointing to CloudFront

## Deploy site files
```bash
bash deploy_site.sh -b yourdomain-site -d CLOUDFRONT_DISTRIBUTION_ID -p /path/to/site/root
```

## Deploy the Contact API (SAM) via GitHub Actions
Add secrets to your repo:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `FROM_EMAIL` (SES-verified), `TO_EMAIL`

Push to `main` to build & deploy `infrastructure/sam-contact-api` automatically.
