// The public side of the content engine: /blog, /blog/<slug>, /work, /work/<slug>, /blog/rss.xml, /sitemap-posts.xml and /media/<id>.
// Reached through rewrites in vercel.json that point at /api/config?a=site&p=..., so no extra Vercel function is used.
// Pages are drawn on the server as complete HTML (search engines read them like any static page) and cached at the CDN for a couple of minutes.
const posts = require('./posts');
const media = require('./media');
const md = require('./md');
const chrome = require('./chrome.json');
const cmsAuthors = () => require('../_adm/cms').authorsList();

const SITE = 'https://aashishpandey.com', esc = md.esc;
const BL = 'v2';   // ?v= for assets/blog.css and blog.js
const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '');
const isoDate = (ms) => new Date(ms || Date.now()).toISOString();
const abs = (u) => (!u ? '' : /^https?:/i.test(u) ? u : SITE + u);
const trunc = (s, n) => { s = String(s || ''); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
const jld = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const PERSON = { '@type': 'Person', '@id': SITE + '/#person', name: 'Aashish Pandey', url: SITE + '/' };
// the people who write here: name, short bio and photo come from their profile in the admin
let authorCache = null;
async function authorOf(p) {
  if (!authorCache || Date.now() - authorCache.t > 60000) { let m = {}; try { (await cmsAuthors()).forEach((a) => { m[a.id] = a; }); } catch (e) { /* the snapshot name on the entry is used */ } authorCache = { t: Date.now(), m }; }
  const a = authorCache.m[p.authorId || 'owner'];
  return { id: p.authorId || 'owner', name: (a && a.name) || p.author || 'Aashish Pandey', bio: (a && a.bio) || '', avatar: (a && a.avatar) || '' };
}
const authorLd = (a) => (a.id === 'owner' ? { '@id': SITE + '/#person' } : { '@type': 'Person', name: a.name });

function layout(o) {
  const sec = o.section === 'work' ? chrome.work : chrome.blog;
  const title = esc(o.title), desc = esc(o.desc || ''), url = esc(o.canonical || SITE + '/');
  const robots = o.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
  const og = abs(o.image) || SITE + '/assets/og-image.jpg';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${robots}">
<meta name="author" content="Aashish Pandey">
<meta name="theme-color" content="#0b1030">
<link rel="icon" href="/assets/favicon.svg?v=2" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png?v=2" sizes="32x32" type="image/png">
<link rel="manifest" href="/assets/site.webmanifest">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=2">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="Aashish Pandey">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(og)}">
${o.ogType === 'article' && o.published ? `<meta property="article:published_time" content="${isoDate(o.published)}">\n<meta property="article:modified_time" content="${isoDate(o.modified)}">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(og)}">
${o.rss ? '<link rel="alternate" type="application/rss+xml" title="Aashish Pandey: blog" href="/blog/rss.xml">\n' : ''}<link rel="preload" as="font" type="font/woff2" href="/assets/vendor/fonts/geist-normal-latin.woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts.css?v=1">
<link rel="stylesheet" href="/assets/nav.css?v=${chrome.navCss}">
<link rel="stylesheet" href="/assets/blog.css?v=${BL}">
<script src="/assets/nav.js?v=${chrome.navJs}" defer></script>
<script src="/assets/js/site.js" defer></script>
<script src="/assets/motion.js" defer></script>
<script src="/assets/blog.js?v=${BL}" defer></script>
${chrome.head}
${(o.jsonld || []).map(jld).join('\n')}
</head>
<body>
<div id="top" class="bl-page">
<!-- ap-nav:start -->
${sec.nav}
<!-- ap-nav:end -->
${o.progress ? '<div class="bl-progress" aria-hidden="true"><i></i></div>' : ''}
<main class="bl-main" id="main">
${o.body}
</main>
<section class="ap-close-sec" aria-labelledby="ap-close-h">
<!-- ap-close:start -->
${sec.close}
<!-- ap-close:end -->
</section>
<!-- ap-foot:start -->
${chrome.foot}
<!-- ap-foot:end -->
</div>
</body>
</html>`;
}


/* ---------- images: keyword addresses, sizes and structured data ----------
   Uploaded pictures live at /media/<id>. In the page they are shown as /media/<id>/<what-it-shows>.webp so the address says what the picture is
   (the words after the id are ignored when serving), and every body image gets its width and height so the page does not jump while loading. */
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' };
const metaCache = new Map();
async function metaOf(id) {
  const c = metaCache.get(id); if (c && Date.now() - c.t < 300000) return c.m;
  let m = null; try { m = await media.meta(id); } catch (e) { /* the plain address still works */ }
  metaCache.set(id, { t: Date.now(), m }); if (metaCache.size > 400) metaCache.clear(); return m;
}
const MEDIA_RE = /\/media\/([a-z0-9]{6,20})(?![a-z0-9\/])/g;
const keywordUrl = (m) => '/media/' + m.id + '/' + (posts.slugify(m.alt || String(m.name || '').replace(/\.[a-z0-9]+$/i, '')).slice(0, 60) || 'image') + '.' + (EXT[m.mime] || 'webp');
// returns a copy of the entry with keyword addresses, plus the list of its images for structured data and the sitemap
async function withImages(p) {
  const text = [p.body, p.cover && p.cover.src, p.seo && p.seo.ogImage].join('\n'), ids = [...new Set([...text.matchAll(MEDIA_RE)].map((m) => m[1]))].slice(0, 40), map = {};
  for (const id of ids) { const m = await metaOf(id); if (m) map[id] = m; }
  const swap = (t) => String(t || '').replace(MEDIA_RE, (x, id) => (map[id] ? keywordUrl(map[id]) : x));
  const q = { ...p, body: swap(p.body), cover: { ...(p.cover || {}), src: swap(p.cover && p.cover.src) }, seo: { ...(p.seo || {}), ogImage: swap(p.seo && p.seo.ogImage) } };
  const imgs = [];
  if (q.cover.src) imgs.push({ url: q.cover.src, alt: q.cover.alt || p.title, id: ((q.cover.src.match(/\/media\/([a-z0-9]+)/) || [])[1]) });
  for (const m of q.body.matchAll(/!\[([^\]]*)\]\((\/media\/([a-z0-9]+)[^)\s]*)/g)) imgs.push({ url: m[2], alt: m[1], id: m[3] });
  imgs.forEach((i) => { const m = map[i.id]; if (m) { i.w = m.w; i.h = m.h; } });
  q.images = imgs.filter((x, k) => imgs.findIndex((y) => y.url === x.url) === k).slice(0, 12); q.mediaMap = map;
  return q;
}
// width and height on every body image; the first picture on the page is not lazy-loaded when there is no cover
function sized(html, map) {
  return html.replace(/<img src="(\/media\/([a-z0-9]+)\/[^"]*)"/g, (x, src, id) => (map[id] && map[id].w && map[id].h ? `<img src="${src}" width="${map[id].w}" height="${map[id].h}"` : x));
}
const coverAttrs = (p) => { const i = p.images && p.images[0]; return i && i.url === (p.cover && p.cover.src) && i.w && i.h ? ` width="${i.w}" height="${i.h}" fetchpriority="high"` : ' fetchpriority="high"'; };
const imageLd = (list) => list.map((i) => ({ '@type': 'ImageObject', url: abs(i.url), contentUrl: abs(i.url), caption: i.alt || undefined, width: i.w || undefined, height: i.h || undefined, license: SITE + '/image-license', acquireLicensePage: SITE + '/image-license#request', creditText: 'Aashish Pandey', copyrightNotice: '© ' + new Date().getFullYear() + ' Aashish Pandey' }));

/* ---------- pieces ---------- */
const crumbs = (items) => '<nav class="bl-crumbs" aria-label="Breadcrumb"><ol>' + items.map((c, i) => `<li>${c.href && i < items.length - 1 ? `<a href="${esc(c.href)}">${esc(c.t)}</a>` : esc(c.t)}</li>`).join('<li aria-hidden="true">/</li>') + '</ol></nav>';
const crumbLd = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.t, item: abs(c.href || '') })) });
const tagChips = (tags, base) => (tags || []).map((t) => `<a class="bl-tag" href="${base}?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join('');
const base = (p) => (p.type === 'case' ? '/work/' : '/blog/') + p.slug;

function card(p, big) {
  const meta = p.type === 'case' ? [p.case && p.case.client, p.case && p.case.year].filter(Boolean).join(' · ') : [fmtDate(p.publishAt), (p.mins || 1) + ' min read'].join(' · ');
  return `<article class="bl-card${big ? ' bl-card--big' : ''}">
<a class="bl-card__img" href="${base(p)}" tabindex="-1" aria-hidden="true">${p.cover && p.cover.src ? `<img src="${esc(p.cover.src)}" alt="" loading="lazy" decoding="async">` : `<span class="bl-card__ph">${esc((p.title || '').slice(0, 1))}</span>`}</a>
<div class="bl-card__b">
${p.category || (p.tags && p.tags[0]) ? `<span class="bl-kick">${esc(p.category || p.tags[0])}</span>` : ''}
<h3><a href="${base(p)}">${esc(p.title)}</a></h3>
<p>${esc(trunc(p.excerpt, big ? 220 : 150))}</p>
<span class="bl-meta">${esc(meta)}</span>
</div></article>`;
}

/* ---------- blog index ---------- */
async function blogIndex(q) {
  const tag = String(q.tag || '').slice(0, 40), find = String(q.q || '').trim().slice(0, 60).toLowerCase(), per = 9, pg = Math.max(1, parseInt(q.page, 10) || 1);
  const all = await posts.live('post'), tags = {};
  all.forEach((p) => (p.tags || []).forEach((t) => { tags[t] = (tags[t] || 0) + 1; }));
  const rows = all.filter((p) => (!tag || (p.tags || []).includes(tag)) && (!find || [p.title, p.excerpt, (p.tags || []).join(' '), p.category].join(' ').toLowerCase().includes(find)));
  const feat = !tag && !find && pg === 1 ? rows.find((p) => p.featured) || rows[0] : null, rest = rows.filter((p) => p !== feat), pages = Math.max(1, Math.ceil(rest.length / per)), slice = rest.slice((pg - 1) * per, pg * per);
  const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10).map((x) => x[0]);
  const qs = (n) => '/blog?' + [tag ? 'tag=' + encodeURIComponent(tag) : '', find ? 'q=' + encodeURIComponent(find) : '', n > 1 ? 'page=' + n : ''].filter(Boolean).join('&');
  const body = `<header class="bl-hero"><div class="bl-wrap">${crumbs([{ t: 'Home', href: '/' }, { t: 'Blog' }])}
<p class="bl-eyebrow">Blog</p>
<h1>Notes on shipping <em>digital work</em></h1>
<p class="bl-lead">What I learn running multi-market Shopify programs, building small tools and getting websites live. Short, practical, no fluff.</p>
${all.length > 5 || find ? `<form class="bl-search" action="/blog" role="search"><input type="search" name="q" value="${esc(find)}" placeholder="Search the blog" aria-label="Search the blog" maxlength="60"><button type="submit">Search</button></form>` : ''}
${topTags.length ? `<div class="bl-filter" role="group" aria-label="Topics"><a class="bl-tag${tag ? '' : ' is-on'}" href="/blog">All</a>${topTags.map((t) => `<a class="bl-tag${t === tag ? ' is-on' : ''}" href="/blog?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>` : ''}
</div></header>
<div class="bl-wrap bl-list">
${feat ? card(feat, true) : ''}
${slice.length ? `<div class="bl-grid">${slice.map((p) => card(p)).join('')}</div>` : (!feat ? `<div class="bl-empty"><h2>${find ? 'Nothing found for ' + esc(find) : tag ? 'Nothing under ' + esc(tag) + ' yet' : 'The first posts are on the way'}</h2><p>${tag || find ? '<a href="/blog">See all posts</a>' : 'In the meantime, the <a href="/tools">free tools</a> and <a href="/case-studies">case studies</a> are live.'}</p></div>` : '')}
${pages > 1 ? `<nav class="bl-pager" aria-label="Pages">${pg > 1 ? `<a href="${qs(pg - 1)}" rel="prev">Newer</a>` : '<span></span>'}<span>Page ${pg} of ${pages}</span>${pg < pages ? `<a href="${qs(pg + 1)}" rel="next">Older</a>` : '<span></span>'}</nav>` : ''}
</div>`;
  const canonical = SITE + '/blog' + (tag ? '?tag=' + encodeURIComponent(tag) : '') + (pg > 1 ? (tag ? '&' : '?') + 'page=' + pg : '');
  return layout({
    title: (tag ? tag + ': ' : find ? 'Search: ' + find + ' · ' : '') + 'Blog · Aashish Pandey', desc: 'Notes on running multi-market Shopify programs, building small web tools and shipping websites, by Aashish Pandey.', canonical, rss: true, noindex: !!find, body,
    jsonld: [{ '@context': 'https://schema.org', '@graph': [{ '@type': 'Blog', '@id': SITE + '/blog#blog', url: SITE + '/blog', name: 'Aashish Pandey: Blog', publisher: { '@id': SITE + '/#person' }, blogPost: rows.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: SITE + base(p), datePublished: isoDate(p.publishAt) })) }, crumbLd([{ t: 'Home', href: '/' }, { t: 'Blog', href: '/blog' }])] }],
  });
}

/* ---------- one post ---------- */
const authorBox = (a) => `<aside class="bl-author">${a.avatar ? `<img class="bl-av bl-av--img" src="${esc(a.avatar)}" alt="" width="46" height="46" loading="lazy">` : `<span class="bl-av" aria-hidden="true">${esc(a.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase())}</span>`}<div><b>${esc(a.name)}</b><p>${a.bio ? esc(a.bio) : (a.id === 'owner' ? 'Project manager and creative technologist in Bangalore. I run multi-market Shopify programs and build free tools. <a href="/contact">Send a brief</a>.' : '')}</p></div></aside>`;
const shareBlock = (p, url) => `<div class="bl-share" aria-label="Share"><span>Share</span><button type="button" data-copy="${esc(url)}">Copy link</button><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(p.title)}" target="_blank" rel="noopener noreferrer">X</a></div>`;
const tocBlock = (toc) => (toc.length > 2 ? `<nav class="bl-toc" aria-label="On this page"><b>On this page</b><ol>${toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : '');

async function postPage(p0, preview) {
  const p = await withImages(p0), r = md.render(p.body), url = SITE + '/blog/' + p.slug, seo = p.seo || {}, au = await authorOf(p);
  r.html = sized(r.html, p.mediaMap);
  const live = await posts.live('post');
  const rel = live.filter((x) => x.id !== p.id).map((x) => ({ x, n: (x.tags || []).filter((t) => (p.tags || []).includes(t)).length })).sort((a, b) => b.n - a.n || (b.x.publishAt - a.x.publishAt)).slice(0, 3).map((a) => a.x);
  const body = `<article class="bl-article" itemscope itemtype="https://schema.org/BlogPosting"${preview ? '' : ' data-pid="' + p.id + '"'}>
<header class="bl-ah"><div class="bl-wrap bl-wrap--n">${crumbs([{ t: 'Home', href: '/' }, { t: 'Blog', href: '/blog' }, { t: p.title }])}
${p.tags && p.tags.length ? `<div class="bl-tags">${tagChips(p.tags, '/blog')}</div>` : ''}
<h1 itemprop="headline">${esc(p.title)}</h1>
<p class="bl-lead">${esc(p.excerpt)}</p>
<p class="bl-by"><span itemprop="author">${esc(au.name)}</span><span aria-hidden="true">·</span><time datetime="${isoDate(p.publishAt || p.updated)}" itemprop="datePublished">${fmtDate(p.publishAt || p.updated)}</time><span aria-hidden="true">·</span><span>${p.mins || 1} min read</span></p>
</div></header>
${p.cover && p.cover.src ? `<figure class="bl-cover"><img src="${esc(p.cover.src)}"${coverAttrs(p)} alt="${esc(p.cover.alt || '')}" itemprop="image" decoding="async"></figure>` : ''}
<div class="bl-wrap bl-cols"><div class="bl-md" itemprop="articleBody">${r.html}
<hr class="bl-end">${shareBlock(p, url)}
${authorBox(au)}
</div>${tocBlock(r.toc) ? `<aside class="bl-side">${tocBlock(r.toc)}</aside>` : ''}</div>
${rel.length ? `<section class="bl-wrap bl-rel" aria-labelledby="bl-rel-h"><h2 id="bl-rel-h">Keep reading</h2><div class="bl-grid">${rel.map((x) => card(x)).join('')}</div></section>` : ''}
</article>`;
  const ld = [{ '@context': 'https://schema.org', '@graph': [{ '@type': 'BlogPosting', '@id': url + '#post', headline: p.title, description: p.excerpt, image: p.images.length ? imageLd(p.images) : undefined, datePublished: isoDate(p.publishAt || p.updated), dateModified: isoDate(p.updated), author: authorLd(au), publisher: { '@id': SITE + '/#person' }, mainEntityOfPage: { '@type': 'WebPage', '@id': url }, keywords: (p.tags || []).join(', ') || undefined, wordCount: p.words, inLanguage: 'en' }, PERSON, crumbLd([{ t: 'Home', href: '/' }, { t: 'Blog', href: '/blog' }, { t: p.title, href: '/blog/' + p.slug }])] }];
  return layout({ title: (seo.title || p.title) + ' · Aashish Pandey', desc: seo.description || trunc(p.excerpt, 170), canonical: seo.canonical || url, image: seo.ogImage || (p.cover && p.cover.src), ogType: 'article', published: p.publishAt || p.updated, modified: p.updated, noindex: preview || seo.noindex, progress: true, rss: true, body, jsonld: ld });
}

/* ---------- case studies ---------- */
async function workIndex() {
  const rows = await posts.live('case');
  const body = `<header class="bl-hero"><div class="bl-wrap">${crumbs([{ t: 'Home', href: '/' }, { t: 'Case studies', href: '/case-studies' }, { t: 'More work' }])}
<p class="bl-eyebrow">More work</p><h1>Case studies, <em>in more detail</em></h1>
<p class="bl-lead">Programs, launches and builds, with what was asked, what I did and what changed. The first four are on <a href="/case-studies">the main case studies page</a>.</p></div></header>
<div class="bl-wrap bl-list">${rows.length ? `<div class="bl-grid">${rows.map((p) => card(p)).join('')}</div>` : '<div class="bl-empty"><h2>More case studies are on the way</h2><p>See the <a href="/case-studies">four main case studies</a> in the meantime.</p></div>'}</div>`;
  return layout({ section: 'work', title: 'More case studies · Aashish Pandey', desc: 'Case studies from multi-market Shopify programs, website launches and tool builds by Aashish Pandey.', canonical: SITE + '/work', body, jsonld: [{ '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', '@id': SITE + '/work#page', url: SITE + '/work', name: 'More case studies', isPartOf: { '@id': SITE + '/#website' } }, crumbLd([{ t: 'Home', href: '/' }, { t: 'Case studies', href: '/case-studies' }, { t: 'More work', href: '/work' }])] }] });
}
async function casePage(p0, preview) {
  const p = await withImages(p0), r = md.render(p.body), url = SITE + '/work/' + p.slug, c = p.case || {}, seo = p.seo || {};
  r.html = sized(r.html, p.mediaMap);
  const more = (await posts.live('case')).filter((x) => x.id !== p.id).slice(0, 3);
  const body = `<article class="bl-article bl-case"${preview ? '' : ' data-pid="' + p.id + '"'}>
<header class="bl-ah"><div class="bl-wrap bl-wrap--n">${crumbs([{ t: 'Home', href: '/' }, { t: 'Case studies', href: '/case-studies' }, { t: p.title }])}
<p class="bl-eyebrow">Case study${c.client ? ' · ' + esc(c.client) : ''}</p>
<h1>${esc(p.title)}</h1><p class="bl-lead">${esc(p.excerpt)}</p>
<dl class="bl-facts">${c.client ? `<div><dt>Client</dt><dd>${esc(c.client)}</dd></div>` : ''}${c.role ? `<div><dt>My role</dt><dd>${esc(c.role)}</dd></div>` : ''}${c.year ? `<div><dt>Year</dt><dd>${esc(c.year)}</dd></div>` : ''}${c.services && c.services.length ? `<div><dt>Services</dt><dd>${c.services.map(esc).join(', ')}</dd></div>` : ''}</dl>
</div></header>
${c.metrics && c.metrics.length ? `<div class="bl-wrap"><ul class="bl-metrics">${c.metrics.map((m) => `<li><b>${esc(m.value)}</b><span>${esc(m.label)}</span></li>`).join('')}</ul></div>` : ''}
${p.cover && p.cover.src ? `<figure class="bl-cover"><img src="${esc(p.cover.src)}"${coverAttrs(p)} alt="${esc(p.cover.alt || '')}" decoding="async"></figure>` : ''}
<div class="bl-wrap bl-cols"><div class="bl-md">${r.html}
${c.stack && c.stack.length ? `<h2 id="stack">Built with</h2><div class="bl-tags">${c.stack.map((s) => `<span class="bl-tag">${esc(s)}</span>`).join('')}</div>` : ''}
${c.link ? `<p class="md-cta"><a class="md-btn" href="${esc(c.link)}" rel="noopener noreferrer" target="_blank">Visit the live site</a></p>` : ''}
<hr class="bl-end">${shareBlock(p, url)}</div>${tocBlock(r.toc) ? `<aside class="bl-side">${tocBlock(r.toc)}</aside>` : ''}</div>
${more.length ? `<section class="bl-wrap bl-rel" aria-labelledby="bl-rel-h"><h2 id="bl-rel-h">More case studies</h2><div class="bl-grid">${more.map((x) => card(x)).join('')}</div></section>` : ''}
</article>`;
  const ld = [{ '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', '@id': url + '#article', headline: p.title, description: p.excerpt, image: p.images.length ? imageLd(p.images) : undefined, datePublished: isoDate(p.publishAt || p.updated), dateModified: isoDate(p.updated), author: { '@id': SITE + '/#person' }, publisher: { '@id': SITE + '/#person' }, mainEntityOfPage: { '@type': 'WebPage', '@id': url }, about: c.client || undefined, inLanguage: 'en' }, PERSON, crumbLd([{ t: 'Home', href: '/' }, { t: 'Case studies', href: '/case-studies' }, { t: p.title, href: '/work/' + p.slug }])] }];
  return layout({ section: 'work', title: (seo.title || p.title + ' · Case study') + ' · Aashish Pandey', desc: seo.description || trunc(p.excerpt, 170), canonical: seo.canonical || url, image: seo.ogImage || (p.cover && p.cover.src), ogType: 'article', published: p.publishAt || p.updated, modified: p.updated, noindex: preview || seo.noindex, progress: true, body, jsonld: ld });
}

function notFound() {
  return layout({ title: 'Page not found · Aashish Pandey', desc: 'This page does not exist.', canonical: SITE + '/', noindex: true, body: `<div class="bl-wrap bl-empty bl-empty--page"><p class="bl-eyebrow">404</p><h1>That page is not here</h1><p class="bl-lead">It may have moved, or it may not be published yet.</p><p><a class="md-btn" href="/blog">Go to the blog</a> <a class="md-btn md-btn--ghost" href="/">Home</a></p></div>` });
}

/* ---------- feeds ---------- */
async function rss() {
  const rows = (await posts.live('post')).slice(0, 30);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Aashish Pandey: blog</title><link>${SITE}/blog</link><description>Notes on shipping digital work.</description><language>en</language><atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>`
    + rows.map((p) => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}</link><guid isPermaLink="true">${SITE}/blog/${p.slug}</guid><pubDate>${new Date(p.publishAt || p.updated).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description>${(p.tags || []).map((t) => `<category>${esc(t)}</category>`).join('')}</item>`).join('') + '</channel></rss>';
}
async function sitemap() {
  const rows = (await posts.live()).filter((p) => !(p.seo && p.seo.noindex)), idx = (u, m, imgs) => `<url><loc>${SITE}${u}</loc>${m ? `<lastmod>${new Date(m).toISOString().slice(0, 10)}</lastmod>` : ''}${(imgs || []).map((i) => `<image:image><image:loc>${esc(abs(i.url))}</image:loc></image:image>`).join('')}</url>`;
  const lastOf = (t) => Math.max(0, ...rows.filter((p) => p.type === t).map((p) => p.updated));
  const withImgs = []; for (const p of rows) withImgs.push([p, (await withImages(p)).images]);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`
    + (rows.some((p) => p.type === 'post') ? idx('/blog', lastOf('post')) : '') + (rows.some((p) => p.type === 'case') ? idx('/work', lastOf('case')) : '')
    + withImgs.map(([p, imgs]) => idx((p.type === 'case' ? '/work/' : '/blog/') + p.slug, p.updated, imgs)).join('') + '</urlset>';
}

/* ---------- entry ---------- */
async function handle(req, res) {
  const q = req.query || {}, p = String(q.p || ''), slug = String(q.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
  const send = (code, ct, body, cache) => { res.setHeader('Content-Type', ct); res.setHeader('Cache-Control', cache || 'public, max-age=0, s-maxage=120, stale-while-revalidate=600'); if (code === 404) res.setHeader('X-Robots-Tag', 'noindex'); return res.status(code).send(body); };
  try {
    if (p === 'media') {
      const m = await media.blob(String(q.id || '').replace(/\.[a-z0-9]+$/i, ''));
      if (!m) return send(404, 'text/plain; charset=utf-8', 'Not found', 'public, max-age=60');
      res.setHeader('Content-Type', m.meta.mime); res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      return res.status(200).send(m.data);
    }
    if (p === 'hit') { if (req.method !== 'POST') return send(405, 'text/plain; charset=utf-8', 'Use POST', 'no-store'); await require('./stats').hit(req, String(q.id || '')); return send(204, 'text/plain; charset=utf-8', '', 'no-store'); }
    if (p === 'rss') return send(200, 'application/rss+xml; charset=utf-8', await rss());
    if (p === 'psitemap') return send(200, 'application/xml; charset=utf-8', await sitemap());
    if (p === 'blog') return send(200, 'text/html; charset=utf-8', await blogIndex(q));
    if (p === 'work') return send(200, 'text/html; charset=utf-8', await workIndex());
    if (p === 'post' || p === 'case') {
      const type = p === 'post' ? 'post' : 'case', pid = q.preview ? posts.previewId(String(q.preview)) : null;
      let rec = pid ? await posts.get(pid) : await posts.bySlug(type, slug);
      if (rec && rec.type !== type) rec = null;
      if (!rec || (!pid && !posts.isLive(rec))) return send(404, 'text/html; charset=utf-8', notFound(), 'public, max-age=0, s-maxage=30');
      if (!pid && rec.slug !== slug) { res.setHeader('Location', (type === 'case' ? '/work/' : '/blog/') + rec.slug); res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300'); return res.status(301).send(''); }   // an old address after a rename
      const html = rec.type === 'case' ? await casePage(rec, !!pid) : await postPage(rec, !!pid);
      return send(200, 'text/html; charset=utf-8', html, pid ? 'private, no-store' : undefined);
    }
    return send(404, 'text/html; charset=utf-8', notFound(), 'public, max-age=0, s-maxage=30');
  } catch (e) {
    console.error('site render:', e.message);
    return send(500, 'text/plain; charset=utf-8', 'Something went wrong. Please try again in a moment.', 'no-store');
  }
}
module.exports = { handle, postPage, casePage, dropAuthors: () => { authorCache = null; } };
