# How to add a page

1. **Duplicate an existing page** (e.g., `about.html`) and rename it.
2. Update the `<title>`, meta description, and content.
3. Ensure the page includes these lines:
   ```html
   <link rel="stylesheet" href="css/styles.css">
   <script>document.documentElement.classList.remove('no-js');</script>
   <script defer src="nav.js"></script>
   <script defer src="site-config.js"></script>
   <script defer src="analytics.js"></script>
   ```
4. Update `aria-current="page"` on the corresponding link in the header **for this page** (or keep client-side fallback).
5. Upload to the same S3 bucket location. Invalidate CloudFront if needed.
