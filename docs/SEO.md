# SEO checklist

What the repo already does, and what only you can do outside it. Nobody can guarantee a #1 ranking. These steps make it more likely and faster.

## In the repo (done)

- One clear title, description and canonical URL per page. The bare domain `aashishpandey.com` is canonical. `www` redirects to it.
- Structured data on every page: `Person` (with alternate names and a portrait `ImageObject`), `WebSite`, breadcrumbs, and page-specific types (`Article`, `CollectionPage`, `WebApplication`, `Service`).
- Old URLs from the previous site (`/about`, `/work`, `/contact`, `/ride`, `/field-notes/*`) redirect permanently to the new pages.
- `sitemap.xml` lists every public page and the portrait images. `robots.txt` blocks only `/api/` and `/s/`.
- The home page carries a hidden but real list of links to every key page, so crawlers can find them from the front door.
- Pages aimed at searches: `/shopify-developer` (Shopify developer and project manager), `/portfolio`, `/case-studies`, and one page per tool.

## You do (once)

1. **Google Search Console** (search.google.com/search-console). Add `aashishpandey.com` as a **Domain** property and verify it with the DNS TXT record Google gives you.
2. Submit `https://aashishpandey.com/sitemap.xml` under Sitemaps.
3. Under URL Inspection, paste each key URL and click **Request indexing**: `/`, `/portfolio`, `/case-studies`, `/shopify-developer`, `/tools`, and each tool page.
4. **Bing Webmaster Tools** (bing.com/webmasters). Import the site from Search Console. Bing also feeds DuckDuckGo and other engines.
5. Put the site URL in your **LinkedIn** profile (Contact info → Website) and use the same name and headline as on the site. Do the same on any GitHub, Behance or other profile.
6. Ask clients or colleagues to link to the site where it is natural (case-study mentions, partner pages, your Langoor profile).

## Realistic expectations

- Your **name** ("Aashish Pandey") is the easiest win, but many people share it. Expect the site to climb over weeks as Google re-crawls and trusts it. The `www` version and old `/about` and `/work` pages currently in results will drop out once Google sees the redirects.
- **Sitelinks** (the indented sub-pages under a result) are chosen by Google. You can't set them. Clear page titles, internal links and breadcrumbs make them more likely.
- **Image results:** Google ranks images by the page they sit on, the alt text and the file. The portrait and bike artwork are on `/portfolio` with alt text that includes your name. Keep using the same photos consistently across profiles.
- **"Shopify developer" or "Project Manager" alone** are very competitive terms. Long searches such as "Shopify developer Bangalore" or "freelance Shopify project manager India" are realistic.
- **Tool searches** ("online notepad", "URL shortener") compete with big sites. Each tool page is set up properly, and a few backlinks help more than anything else.

## Checking progress

- Search Console → Performance shows which searches bring people and where you rank.
- Search `site:aashishpandey.com` in Google to see what is indexed.
- Re-run the check in `SETUP.md` section 10 after any deploy.
