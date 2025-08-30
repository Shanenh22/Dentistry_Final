# How to Add a New Blog Post

This guide explains how to create a new blog post for the Spring Valley Dental Associates website.

## 1. Duplicate an Existing Post

Pick an existing blog post file in the root of the project (for example `blog-toothbrush-toothpaste.html`) and copy it. Rename the copy using a descriptive slug, such as `blog-new-topic.html`. Use lowercase letters and dashes in the filename; avoid spaces or special characters.

## 2. Edit the New HTML File

Open your new post in a text editor and make the following changes:

1. **Title & Metadata** – Update the `<title>` tag and the `<meta name="description">` tag in the `<head>` section. Keep the description under 155 characters and include local keywords like **Dallas**, **Addison**, **Farmers Branch** and **North Dallas** along with a call‑to‑action.
2. **Hero Section** – After the line `<div id="header"></div>` insert a hero section similar to other posts. Customize the `<h1>` heading, `<p>` tagline and buttons to fit your topic. For example:

   ```html
   <section class="hero" style="background-image: url('images/hero-background.png');">
     <h1>Descriptive Blog Title</h1>
     <p>Your short teaser sentence that entices visitors to read more.</p>
     <div class="button-group">
       <a href="contact.html" class="button-primary">Schedule Consultation</a>
       <a href="blog.html" class="button-secondary">Back to Blog</a>
     </div>
   </section>
   ```

3. **Article Content** – Write your content inside the `<main>` element using headings (`<h2>`, `<h3>`) to structure the article. Add internal links to related service pages where appropriate (e.g., link to `services.html` if the post discusses dental implants). Include images with descriptive `alt` text and the `loading="lazy"` attribute to improve performance and accessibility.
4. **Footer Placeholder** – Ensure there is a `<div id="footer"></div>` before the closing `</body>` tag to allow the shared footer to be injected by `scripts.js`.

## 3. Add Your Post to the Blog Listing

1. Open `js/scripts.js` and scroll to the `blogPosts` array.
2. Add a new object at the end of the array with these fields:

   ```js
   {
     slug: 'blog-new-topic.html',        // the filename you created
     title: 'Descriptive Blog Title',     // displayed on the card
     excerpt: 'A short summary of your post that entices users to click.',
     category: 'General Care',            // or Cosmetic, Restorative, Orthodontics
     readingTime: '3 min read',           // estimate the reading time
     publishDate: 'Month Day, Year',      // e.g., 'October 15, 2025'
     image: 'images/path-to-image.jpg'    // path to a representative image in the images folder
   }
   ```

3. Save `scripts.js`. The blog listing on `blog.html` will automatically display your new post.

## 4. Preview and Test Locally

* Open `blog.html` in a browser to verify that your new post appears in the list and that clicking the card loads your article.
* Check your new post on both desktop and mobile screen sizes to ensure the layout is responsive and the header and footer render properly.
* Test all links and ensure there are no broken references or missing images.

## 5. Deploy

When everything looks correct locally, zip the updated `Dentistry_Final` folder and deploy it to your hosting environment. If you are using a version control system, commit your changes with a descriptive message.