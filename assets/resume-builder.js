(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
function h(tag, attrs) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (attrs[k] == null || attrs[k] === false) continue;
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  (function add(list) { for (var i = 0; i < list.length; i++) { var c = list[i]; if (c == null || c === false) continue; if (Array.isArray(c)) add(c); else e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); } })(Array.prototype.slice.call(arguments, 2));
  return e;
}
/* Role starting points: section order, titles and sample content. All names and numbers are made up. */
var uid = 0, nid = function () { return ++uid; };
var FONTS = { sans: ['Arial', "Arial, Helvetica, sans-serif"], serif: ['Georgia', "Georgia, 'Times New Roman', serif"], times: ['Times New Roman', "'Times New Roman', Times, serif"], verdana: ['Verdana', "Verdana, Geneva, sans-serif"], calibri: ['Calibri', "Calibri, Carlito, Arial, sans-serif"], helvetica: ['Helvetica', "'Helvetica Neue', Helvetica, Arial, sans-serif"], garamond: ['Garamond', "Garamond, 'EB Garamond', 'Cormorant Garamond', Georgia, serif"] };
var TPLS = [
  ["classic", "Classic", "One column, ruled headings. The safest choice for ATS.", "Highest", {"font": "sans", "size": 10.5, "lh": 1.35, "gap": 12, "head": "rule", "align": "left", "accent": "#111111"}, "single", "", "classic ats"],
  ["modern", "Modern", "One column with colour headings.", "High", {"font": "sans", "size": 10.5, "lh": 1.4, "gap": 13, "head": "rule", "align": "left", "accent": "#1f4fd8"}, "single", "nm-ac", "modern"],
  ["compact", "Compact", "Dense, to fit a long career on one page.", "High", {"font": "sans", "size": 9.5, "lh": 1.28, "gap": 8, "head": "caps", "align": "left", "accent": "#111111"}, "single", "", "classic"],
  ["executive", "Executive", "Serif and centred, for senior roles.", "High", {"font": "serif", "size": 10.5, "lh": 1.4, "gap": 14, "head": "rule", "align": "center", "accent": "#222222"}, "single", "nm-caps", "classic"],
  ["minimal", "Minimal", "Quiet and airy, with no rules.", "Highest", {"font": "calibri", "size": 11, "lh": 1.45, "gap": 15, "head": "plain", "align": "left", "accent": "#333333"}, "single", "", "minimal ats"],
  ["sidebar", "Sidebar", "Skills in a narrow side column.", "Lower", {"font": "sans", "size": 10, "lh": 1.38, "gap": 12, "head": "caps", "align": "left", "accent": "#0f766e"}, "side", "", "twocol"],
  ["professional", "Professional", "Navy name and clean rules.", "Highest", {"font": "calibri", "size": 10.5, "lh": 1.38, "gap": 12, "head": "rule", "align": "left", "accent": "#1e3a8a"}, "single", "nm-ac", "classic ats"],
  ["corporate", "Corporate", "A dark header band over a one-column page.", "High", {"font": "sans", "size": 10.5, "lh": 1.38, "gap": 13, "head": "caps", "align": "left", "accent": "#0f172a"}, "single", "hb", "modern"],
  ["clean", "Clean", "Light name, plain headings, soft grey.", "Highest", {"font": "calibri", "size": 10.5, "lh": 1.42, "gap": 14, "head": "plain", "align": "left", "accent": "#374151"}, "single", "nm-light", "minimal ats"],
  ["simple", "Simple", "Plain text look with almost no styling.", "Highest", {"font": "sans", "size": 11, "lh": 1.4, "gap": 12, "head": "plain", "align": "left", "accent": "#111111"}, "single", "", "minimal ats"],
  ["traditional", "Traditional", "Times type, centred header, capital headings.", "Highest", {"font": "times", "size": 11, "lh": 1.35, "gap": 12, "head": "rule", "align": "center", "accent": "#111111"}, "single", "nm-caps", "classic ats"],
  ["academic", "Academic", "Serif and plain headings, suited to CV-style resumes.", "Highest", {"font": "serif", "size": 10.5, "lh": 1.4, "gap": 13, "head": "plain", "align": "left", "accent": "#7f1d1d"}, "single", "", "classic ats"],
  ["bold", "Bold", "A big name and heavy side-bar headings.", "High", {"font": "sans", "size": 10.5, "lh": 1.38, "gap": 13, "head": "bar", "align": "left", "accent": "#be123c"}, "single", "nm-big", "modern"],
  ["elegant", "Elegant", "Light serif name with short accent underlines.", "High", {"font": "serif", "size": 10.5, "lh": 1.42, "gap": 14, "head": "short", "align": "center", "accent": "#92400e"}, "single", "nm-light", "classic"],
  ["creative", "Creative", "Coloured side column with skills and contact.", "Lower", {"font": "sans", "size": 10, "lh": 1.38, "gap": 12, "head": "caps", "align": "left", "accent": "#6d28d9"}, "side", "sd-fill", "creative twocol"],
  ["tech", "Tech", "Monospace headings and arrow bullets.", "High", {"font": "sans", "size": 10, "lh": 1.38, "gap": 12, "head": "plain", "align": "left", "accent": "#0f766e", "bullet": "›"}, "single", "hm nm-ac", "modern"],
  ["startup", "Startup", "Soft tinted heading bars in blue.", "High", {"font": "calibri", "size": 10.5, "lh": 1.4, "gap": 13, "head": "tint", "align": "left", "accent": "#2563eb"}, "single", "nm-ac", "modern"],
  ["banner", "Banner", "A colour band behind the name.", "High", {"font": "sans", "size": 10.5, "lh": 1.38, "gap": 13, "head": "rule", "align": "left", "accent": "#1f4fd8"}, "single", "hb", "modern creative"],
  ["noir", "Noir", "Black header band and side-bar headings.", "High", {"font": "sans", "size": 10.5, "lh": 1.38, "gap": 13, "head": "bar", "align": "left", "accent": "#111827"}, "single", "hb", "modern"],
  ["split", "Split", "Name on the left, contact details on the right.", "High", {"font": "sans", "size": 10.5, "lh": 1.36, "gap": 12, "head": "rule", "align": "left", "accent": "#111111"}, "split", "", "classic"],
  ["sideright", "Sidebar Right", "Skills in a side column on the right.", "Lower", {"font": "calibri", "size": 10, "lh": 1.38, "gap": 12, "head": "caps", "align": "left", "accent": "#0f766e"}, "sideR", "", "twocol"],
  ["timeline", "Timeline", "A vertical line and dots along each job.", "High", {"font": "sans", "size": 10.5, "lh": 1.4, "gap": 13, "head": "caps", "align": "left", "accent": "#1f4fd8"}, "single", "tl nm-ac", "modern creative"],
  ["boxed", "Boxed", "Headings in solid boxes.", "High", {"font": "sans", "size": 10.5, "lh": 1.36, "gap": 12, "head": "box", "align": "left", "accent": "#334155"}, "single", "", "classic"],
  ["dotted", "Dotted", "Dotted rules under amber headings.", "Highest", {"font": "calibri", "size": 10.5, "lh": 1.4, "gap": 13, "head": "dotted", "align": "left", "accent": "#b45309"}, "single", "", "classic ats"],
  ["doublerule", "Double Rule", "Double rules and a centred serif header.", "High", {"font": "serif", "size": 10.5, "lh": 1.4, "gap": 14, "head": "double", "align": "center", "accent": "#111111"}, "single", "nm-caps", "classic"],
  ["monochrome", "Monochrome", "Greys only, capital name and headings.", "Highest", {"font": "sans", "size": 10.5, "lh": 1.4, "gap": 14, "head": "caps", "align": "left", "accent": "#444444"}, "single", "nm-caps nm-light", "minimal ats"],
  ["pastel", "Pastel", "Rose tinted headings with a friendly feel.", "High", {"font": "calibri", "size": 10.5, "lh": 1.4, "gap": 13, "head": "tint", "align": "left", "accent": "#db2777"}, "single", "nm-ac", "creative"],
  ["headline", "Headline", "An oversized name with an accent underline.", "High", {"font": "sans", "size": 10.5, "lh": 1.38, "gap": 13, "head": "plain", "align": "left", "accent": "#1f4fd8"}, "single", "nm-big nm-ul", "modern"],
  ["balanced", "Balanced", "Centred header with short teal underlines.", "High", {"font": "calibri", "size": 10.5, "lh": 1.4, "gap": 14, "head": "short", "align": "center", "accent": "#0f766e"}, "single", "nm-ac", "modern"],
  ["leftbar", "Left Bar", "Serif body with a bar beside each heading.", "High", {"font": "serif", "size": 10.5, "lh": 1.4, "gap": 13, "head": "bar", "align": "left", "accent": "#334155"}, "single", "nm-ac", "classic"],
  /* Big tech and famous formats. Original layouts that follow the conventions these resumes share; names describe the style, not an affiliation. */
  ["latex", "LaTeX Engineer", "Dense serif page with small-caps headings, the look of the LaTeX resumes engineers share most.", "Highest", {"font": "serif", "size": 10, "lh": 1.3, "gap": 9, "head": "smcap", "align": "center", "accent": "#111111"}, "single", "nm-sc tight", "faang famous classic ats"],
  ["bigtech", "Big Tech", "Centred black and white one-pager, the plain format tech recruiters scan fastest.", "Highest", {"font": "calibri", "size": 10.5, "lh": 1.32, "gap": 10, "head": "rule", "align": "center", "accent": "#111111"}, "single", "nm-caps tight", "faang classic ats"],
  ["xyz", "Google XYZ", "Clean sans page made for result-first bullets: what you did, measured by what, by doing what.", "Highest", {"font": "sans", "size": 10.5, "lh": 1.38, "gap": 12, "head": "rule", "align": "left", "accent": "#1a73e8"}, "single", "nm-ac", "faang modern ats"],
  ["amazon", "Amazon LP", "Dense and data-first, for bullets that show ownership and results.", "High", {"font": "sans", "size": 10, "lh": 1.32, "gap": 10, "head": "bar", "align": "left", "accent": "#c45500"}, "single", "nm-caps tight", "faang classic"],
  ["meta", "Meta Impact", "Blue tinted headings that lead the eye to scale and impact numbers.", "High", {"font": "calibri", "size": 10.5, "lh": 1.38, "gap": 12, "head": "tint", "align": "left", "accent": "#0866ff"}, "single", "nm-ac", "faang modern"],
  ["apple", "Apple Clean", "Light name, airy spacing and quiet headings in Helvetica.", "Highest", {"font": "helvetica", "size": 10.5, "lh": 1.45, "gap": 15, "head": "plain", "align": "left", "accent": "#1d1d1f"}, "single", "nm-light", "faang minimal ats"],
  ["netflix", "Netflix Senior", "A dark red header band for senior, high-ownership roles.", "High", {"font": "sans", "size": 10.5, "lh": 1.38, "gap": 13, "head": "rule", "align": "left", "accent": "#b20710"}, "single", "hb", "faang modern"],
  ["deedy", "Two Column Tech", "Thin large name with skills in a left column, after the popular two-column LaTeX resume.", "Lower", {"font": "calibri", "size": 9.5, "lh": 1.32, "gap": 10, "head": "caps", "align": "center", "accent": "#111111"}, "side", "nm-light sd-plain", "faang famous twocol"],
  ["ivy", "Ivy", "Garamond with centred headings, after the university career-office format used for finance, consulting and law.", "Highest", {"font": "garamond", "size": 11, "lh": 1.3, "gap": 11, "head": "rule", "align": "center", "accent": "#111111"}, "single", "hc tight", "famous classic ats"],
  ["consulting", "Consulting", "One page with navy small-caps headings, for consulting and strategy roles.", "Highest", {"font": "garamond", "size": 10.5, "lh": 1.32, "gap": 10, "head": "smcap", "align": "left", "accent": "#0b2d5b"}, "single", "nm-ac tight", "famous classic ats"],
  ["wallstreet", "Wall Street", "Times at 10 pt, tight and black, the banking and finance standard.", "Highest", {"font": "times", "size": 10, "lh": 1.22, "gap": 8, "head": "rule", "align": "center", "accent": "#111111"}, "single", "nm-caps tight", "famous classic ats"],
  ["accent", "Accent CV", "Centred light name and red small-caps headings, after a well-known LaTeX CV.", "High", {"font": "sans", "size": 10, "lh": 1.38, "gap": 12, "head": "smcap", "align": "center", "accent": "#dc3522"}, "single", "nm-light", "famous modern"]
];
function tplOf(k) { for (var i = 0; i < TPLS.length; i++) if (TPLS[i][0] === k) return TPLS[i]; return TPLS[0]; }
var ADD = [
  ['summary', 'Summary'], ['experience', 'Work experience'], ['education', 'Education'], ['skills', 'Skills'], ['projects', 'Projects'], ['certs', 'Certifications'],
  ['experience', 'Internships'], ['experience', 'Volunteering'], ['bullets', 'Awards and achievements'], ['bullets', 'Publications'], ['inline', 'Languages'], ['inline', 'Interests'],
  ['text', 'References'], ['text', 'Custom text'], ['bullets', 'Custom list']
];
var STD_HEADS = /^(summary|professional summary|profile|objective|career objective|work experience|experience|professional experience|employment|employment history|work history|internships?|education|academic background|skills|technical skills|core competencies|key skills|projects|selected projects|selected work|certifications?|licenses and certifications|awards|achievements|awards and achievements|languages|interests|publications|volunteering|volunteer experience|references)$/i;

function S(type, title, data) { return { id: nid(), type: type, title: title, hidden: false, data: data }; }
function exp(role, org, loc, start, end, bullets) { return { id: nid(), role: role, org: org, loc: loc, start: start, end: end, bullets: bullets.join('\n') }; }
function edu(degree, school, loc, start, end, note) { return { id: nid(), degree: degree, school: school, loc: loc, start: start, end: end, note: note || '' }; }
function proj(name, link, tech, bullets) { return { id: nid(), name: name, link: link, tech: tech, bullets: bullets.join('\n') }; }
function cert(name, org, date) { return { id: nid(), name: name, org: org, date: date }; }
function rows(list) { return list.map(function (r) { return { id: nid(), label: r[0], items: r[1] }; }); }
function P(name, title, loc, links) { return { name: name, title: title, email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com', phone: '+1 555 010 0199', loc: loc, links: (links || []).map(function (l) { return { id: nid(), t: l[0], u: l[1] }; }) }; }

var ROLES = {
  software: { name: 'Software engineer', tip: 'Lead with skills and projects. Name the stack in each role, and give numbers for speed, scale or cost.', tpl: 'classic', build: function () { return { p: P('Alex Morgan', 'Software Engineer', 'Austin, TX', [['GitHub', 'github.com/alexmorgan'], ['LinkedIn', 'linkedin.com/in/alexmorgan']]), sections: [
    S('summary', 'Summary', { text: 'Backend-leaning software engineer with 5 years of experience building APIs and data pipelines in TypeScript and Python. Cut checkout latency by 38% and led a move to event-driven services at 2M daily users.' }),
    S('skills', 'Skills', { items: rows([['Languages', 'TypeScript, Python, Go, SQL'], ['Frameworks', 'Node.js, React, FastAPI, Next.js'], ['Cloud and tools', 'AWS, Docker, Kubernetes, Terraform, GitHub Actions, PostgreSQL, Redis']]) }),
    S('experience', 'Work experience', { items: [
      exp('Senior Software Engineer', 'Northwind Commerce', 'Remote', 'Mar 2022', 'Present', ['Redesigned the checkout API with Node.js and Redis, cutting p95 latency from 820 ms to 510 ms.', 'Led a team of 4 to move order processing to an event-driven design on AWS SQS, removing 6 hours of weekly manual fixes.', 'Raised test coverage from 52% to 86% and cut failed deploys by 40% with CI checks in GitHub Actions.']),
      exp('Software Engineer', 'BrightPath Labs', 'Austin, TX', 'Jul 2019', 'Feb 2022', ['Built a reporting service in Python and PostgreSQL used by 300 sales staff.', 'Reduced monthly cloud spend by $9,000 by right-sizing containers and adding autoscaling.']) ] }),
    S('projects', 'Projects', { items: [proj('Open-source rate limiter', 'github.com/alexmorgan/limiter', 'Go, Redis', ['Token-bucket library with 1,400 GitHub stars and 60 contributors.']), proj('Job board scraper', '', 'Python, FastAPI', ['Collects 20,000 listings a day and serves search with 120 ms median response.'])] }),
    S('education', 'Education', { items: [edu('B.S. Computer Science', 'University of Texas at Austin', 'Austin, TX', '2015', '2019', 'GPA 3.7')] }),
    S('certs', 'Certifications', { items: [cert('AWS Certified Solutions Architect, Associate', 'Amazon Web Services', '2023')] })
  ] }; } },
  designer: { name: 'Designer (UX or UI)', tip: 'Put a portfolio link in the contact line. Describe your process and the result, and keep the layout plain so the text is readable by a parser.', tpl: 'modern', build: function () { return { p: P('Priya Nair', 'Product Designer', 'Bengaluru, India', [['Portfolio', 'priyanair.design'], ['LinkedIn', 'linkedin.com/in/priyanair']]), sections: [
    S('summary', 'Summary', { text: 'Product designer with 6 years of experience in fintech and marketplace apps. Combines user research with design systems to ship features that lift conversion, with a recent redesign of onboarding that raised activation by 22%.' }),
    S('skills', 'Skills', { items: rows([['Design', 'UX design, UI design, interaction design, design systems, prototyping, accessibility (WCAG 2.2)'], ['Research', 'User interviews, usability testing, journey mapping, A/B test analysis'], ['Tools', 'Figma, FigJam, Maze, Miro, Notion, basic HTML and CSS']]) }),
    S('experience', 'Work experience', { items: [
      exp('Senior Product Designer', 'Finwise', 'Bengaluru, India', 'Jan 2022', 'Present', ['Redesigned onboarding for 1.2M users, raising activation from 41% to 50% in one quarter.', 'Built a Figma design system of 90 components, cutting design-to-build handoff time by 35%.', 'Ran 40 usability sessions and turned findings into a roadmap adopted by 3 product squads.']),
      exp('Product Designer', 'ShopLane', 'Remote', 'Jun 2019', 'Dec 2021', ['Designed the seller dashboard used by 50,000 merchants, lifting weekly active use by 18%.', 'Partnered with engineers to ship 25 features across web and Android.']) ] }),
    S('projects', 'Selected work', { items: [proj('Onboarding redesign, Finwise', 'priyanair.design/finwise', 'Figma, Maze', ['Research, flows, prototype and launch. Activation up 22%.']), proj('Seller dashboard, ShopLane', 'priyanair.design/shoplane', 'Figma', ['Information architecture and visual design for 50,000 merchants.'])] }),
    S('education', 'Education', { items: [edu('B.Des, Interaction Design', 'National Institute of Design', 'Ahmedabad, India', '2014', '2018', '')] })
  ] }; } },
  pm: { name: 'Project or program manager', tip: 'Show scale: budget, team size, markets, timeline. Every bullet should end in a result you can measure.', tpl: 'executive', build: function () { return { p: P('Jordan Lee', 'Senior Project Manager', 'London, UK', [['LinkedIn', 'linkedin.com/in/jordanlee']]), sections: [
    S('summary', 'Summary', { text: 'PMP-certified project manager with 9 years of experience delivering digital programmes across 15 markets. Brought 12 projects in on time and under a combined budget of $14M, and known for clear stakeholder reporting.' }),
    S('skills', 'Core competencies', { items: rows([['Delivery', 'Agile and waterfall, programme planning, scope and change control, RAID logs, vendor management'], ['Leadership', 'Cross-functional teams of up to 25, stakeholder reporting, coaching'], ['Tools', 'Jira, Confluence, MS Project, Smartsheet, Power BI']]) }),
    S('experience', 'Professional experience', { items: [
      exp('Senior Project Manager', 'Halden Group', 'London, UK', 'Feb 2021', 'Present', ['Led a Shopify rollout across 15 markets with a team of 22, launching 3 weeks early and 8% under a $3.2M budget.', 'Cut status-reporting time by 60% with a single weekly dashboard used by 40 stakeholders.', 'Managed 6 vendors and negotiated scope changes that saved $240,000.']),
      exp('Project Manager', 'Clearwater Digital', 'London, UK', 'Sep 2016', 'Jan 2021', ['Delivered 20 website and app projects worth $6M with 96% on-time delivery.', 'Introduced sprint reviews that reduced rework by 25%.']) ] }),
    S('certs', 'Certifications', { items: [cert('Project Management Professional (PMP)', 'PMI', '2019'), cert('Certified ScrumMaster (CSM)', 'Scrum Alliance', '2018')] }),
    S('education', 'Education', { items: [edu('B.A. Business Management', 'University of Leeds', 'Leeds, UK', '2012', '2016', '')] })
  ] }; } },
  data: { name: 'Data analyst or scientist', tip: 'Name the tools, the data size and the decision your work changed.', tpl: 'classic', build: function () { return { p: P('Sam Rivera', 'Data Analyst', 'Toronto, Canada', [['GitHub', 'github.com/samrivera'], ['LinkedIn', 'linkedin.com/in/samrivera']]), sections: [
    S('summary', 'Summary', { text: 'Data analyst with 4 years of experience in SQL, Python and dashboards for retail and subscription businesses. Built churn models and reporting that helped cut cancellations by 11%.' }),
    S('skills', 'Skills', { items: rows([['Analysis', 'SQL, Python (pandas, scikit-learn), statistics, A/B testing, forecasting'], ['BI and tools', 'Tableau, Power BI, dbt, Airflow, BigQuery, Excel'], ['Practice', 'Stakeholder reporting, data modelling, documentation']]) }),
    S('experience', 'Work experience', { items: [
      exp('Data Analyst', 'Pinecrest Subscriptions', 'Toronto, Canada', 'Apr 2021', 'Present', ['Built a churn model on 800,000 customers that flagged 70% of cancellations a month early, helping cut churn by 11%.', 'Replaced 14 manual spreadsheets with Tableau dashboards, saving 25 hours a week.', 'Designed an A/B test framework used by 5 teams.']),
      exp('Junior Analyst', 'Maple Retail', 'Toronto, Canada', 'Jul 2019', 'Mar 2021', ['Wrote SQL pipelines on 40M rows of sales data feeding weekly planning.']) ] }),
    S('projects', 'Projects', { items: [proj('Demand forecasting', 'github.com/samrivera/forecast', 'Python, Prophet', ['Forecast weekly demand for 300 products with 9% mean error.'])] }),
    S('education', 'Education', { items: [edu('B.Sc. Statistics', 'University of Toronto', 'Toronto, Canada', '2015', '2019', '')] })
  ] }; } },
  marketing: { name: 'Marketing', tip: 'Show channels, budgets and outcomes: traffic, leads, revenue, cost per acquisition.', tpl: 'modern', build: function () { return { p: P('Maya Chen', 'Digital Marketing Manager', 'Singapore', [['LinkedIn', 'linkedin.com/in/mayachen']]), sections: [
    S('summary', 'Summary', { text: 'Digital marketing manager with 7 years of experience in SEO, paid media and lifecycle email for B2C brands. Grew organic traffic 3x and cut cost per lead by 31% across 4 markets.' }),
    S('skills', 'Skills', { items: rows([['Channels', 'SEO, Google Ads, Meta Ads, email and CRM, content marketing, affiliate'], ['Analytics', 'GA4, Looker Studio, Search Console, attribution, conversion tracking'], ['Tools', 'HubSpot, Klaviyo, Semrush, Ahrefs, WordPress']]) }),
    S('experience', 'Work experience', { items: [
      exp('Digital Marketing Manager', 'Lumen Home', 'Singapore', 'May 2020', 'Present', ['Grew organic sessions from 90,000 to 270,000 a month in 18 months with a technical and content SEO plan.', 'Managed a $60,000 monthly paid budget and cut cost per lead by 31%.', 'Built a lifecycle email programme that now drives 22% of online revenue.']),
      exp('Marketing Executive', 'Pixelgrove', 'Singapore', 'Jun 2017', 'Apr 2020', ['Ran social and email campaigns that added 40,000 subscribers.']) ] }),
    S('education', 'Education', { items: [edu('B.Sc. Communications', 'Nanyang Technological University', 'Singapore', '2013', '2017', '')] }),
    S('certs', 'Certifications', { items: [cert('Google Ads Search Certification', 'Google', '2023'), cert('HubSpot Inbound Marketing', 'HubSpot Academy', '2022')] })
  ] }; } },
  sales: { name: 'Sales or business development', tip: 'Quota, revenue, deal size and win rate. Say what you sold and to whom.', tpl: 'classic', build: function () { return { p: P('Chris Walker', 'Business Development Manager', 'Chicago, IL', [['LinkedIn', 'linkedin.com/in/chriswalker']]), sections: [
    S('summary', 'Summary', { text: 'B2B sales professional with 8 years of experience selling SaaS to mid-market buyers. Finished at 128% of quota for three years running and built a $4.5M pipeline from outbound alone.' }),
    S('skills', 'Skills', { items: rows([['Sales', 'Prospecting, discovery, negotiation, contract close, account expansion, forecasting'], ['Tools', 'Salesforce, HubSpot, Outreach, LinkedIn Sales Navigator, Gong']]) }),
    S('experience', 'Work experience', { items: [
      exp('Senior Account Executive', 'Cloudtrail Software', 'Chicago, IL', 'Jan 2020', 'Present', ['Closed $2.8M a year against a $2.2M quota, at an average deal size of $48,000.', 'Won 31% of qualified opportunities, up from a team average of 22%.', 'Mentored 3 new reps to quota within their first 6 months.']),
      exp('Business Development Representative', 'Dataloom', 'Chicago, IL', 'Aug 2016', 'Dec 2019', ['Booked 25 qualified meetings a month, 40% above target.']) ] }),
    S('education', 'Education', { items: [edu('B.B.A. Marketing', 'DePaul University', 'Chicago, IL', '2012', '2016', '')] })
  ] }; } },
  engineer: { name: 'Engineer (mechanical, civil, electrical)', tip: 'List software and standards, then projects with size, load, cost or tolerance. Licences matter, so show them.', tpl: 'classic', build: function () { return { p: P('Daniel Okafor', 'Mechanical Engineer', 'Houston, TX', [['LinkedIn', 'linkedin.com/in/danielokafor']]), sections: [
    S('summary', 'Summary', { text: 'Mechanical engineer with 6 years of experience in pressure vessel and piping design for oil and gas. Skilled in CAD and FEA, and has reduced fabrication cost by 14% through design changes on a $22M project.' }),
    S('skills', 'Skills', { items: rows([['Design and analysis', 'SolidWorks, AutoCAD, ANSYS (FEA), CFD basics, GD&T'], ['Standards', 'ASME Section VIII, B31.3, API 650'], ['Practice', 'Design reviews, vendor coordination, cost estimating, root-cause analysis']]) }),
    S('experience', 'Work experience', { items: [
      exp('Mechanical Engineer', 'Gulfstream Energy Services', 'Houston, TX', 'Aug 2020', 'Present', ['Designed 18 pressure vessels to ASME VIII, with no rework at third-party inspection.', 'Cut fabrication cost by 14% on a $22M project by changing weld and support details.', 'Ran FEA studies in ANSYS that removed 2 tonnes of steel from a skid design.']),
      exp('Junior Design Engineer', 'Bayou Piping', 'Houston, TX', 'Jul 2018', 'Jul 2020', ['Produced 120 piping isometrics in AutoCAD to B31.3.']) ] }),
    S('projects', 'Projects', { items: [proj('Offshore skid redesign', '', 'SolidWorks, ANSYS', ['Reduced weight by 9% while meeting lifting and vibration limits.'])] }),
    S('education', 'Education', { items: [edu('B.S. Mechanical Engineering', 'Texas A&M University', 'College Station, TX', '2014', '2018', '')] }),
    S('certs', 'Licences and certifications', { items: [cert('Engineer in Training (EIT)', 'State of Texas', '2018')] })
  ] }; } },
  fresher: { name: 'Student or recent graduate', tip: 'Put education first. Use projects, internships and leadership to show what you can do, and keep it to one page.', tpl: 'minimal', build: function () { return { p: P('Taylor Brooks', 'Computer Science Graduate', 'Boston, MA', [['GitHub', 'github.com/taylorbrooks'], ['LinkedIn', 'linkedin.com/in/taylorbrooks']]), sections: [
    S('summary', 'Objective', { text: 'Recent computer science graduate seeking a software engineering role. Built three full-stack projects, interned on a team of 6, and led a university coding club of 80 members.' }),
    S('education', 'Education', { items: [edu('B.S. Computer Science', 'Northeastern University', 'Boston, MA', '2021', '2025', 'GPA 3.8 · Dean\'s List, 6 semesters · Relevant courses: data structures, databases, operating systems')] }),
    S('projects', 'Projects', { items: [proj('Campus events app', 'github.com/taylorbrooks/events', 'React, Node.js, MongoDB', ['Used by 1,200 students in the first month.', 'Built sign-in, event search and reminders in 8 weeks with a team of 3.']), proj('Study planner', '', 'Python, Flask', ['Scheduling tool that cut average planning time from 30 to 5 minutes in user tests.'])] }),
    S('experience', 'Internships', { items: [exp('Software Engineering Intern', 'Beacon Health', 'Boston, MA', 'Jun 2024', 'Aug 2024', ['Built an internal dashboard in React that saved the support team 5 hours a week.', 'Fixed 23 bugs and wrote 60 unit tests.'])] }),
    S('skills', 'Skills', { items: rows([['Languages', 'Python, Java, JavaScript, SQL'], ['Tools', 'React, Node.js, Git, Docker, Linux']]) }),
    S('bullets', 'Leadership and achievements', { text: 'President, Northeastern Coding Club (80 members)\nFinalist, HackBoston 2024' })
  ] }; } },
  bigtech: { name: 'Big tech software engineer (FAANG)', tip: 'Write each bullet as: accomplished X, as measured by Y, by doing Z. Show scale (users, requests, data size), keep one page, and use one plain column so the parser and the recruiter both read it fast.', tpl: 'xyz', build: function () { return { p: P('Jordan Lee', 'Software Engineer', 'Seattle, WA', [['GitHub', 'github.com/jordanlee'], ['LinkedIn', 'linkedin.com/in/jordanlee']]), sections: [
    S('education', 'Education', { items: [edu('B.S. Computer Science', 'University of Washington', 'Seattle, WA', '2016', '2020', 'GPA 3.8 · Relevant courses: distributed systems, algorithms, machine learning')] }),
    S('experience', 'Experience', { items: [
      exp('Software Engineer II', 'Cascade Cloud', 'Seattle, WA', 'Aug 2022', 'Present', ['Reduced p99 search latency by 42% (310 ms to 180 ms) for 40M monthly users by adding a two-tier cache in front of the ranking service.', 'Cut infrastructure cost by $1.2M a year, as measured by monthly cloud spend, by moving batch jobs from always-on clusters to spot instances.', 'Raised deploy frequency from weekly to 30 a day by building a canary release pipeline adopted by 14 teams.', 'Mentored 3 new engineers; all were promoted within 18 months.']),
      exp('Software Engineer', 'Lumen Pay', 'San Francisco, CA', 'Jul 2020', 'Jul 2022', ['Increased payment success rate by 3.1 points, worth $8M in yearly volume, by adding smart retries for card declines.', 'Shipped a fraud rules API handling 6,000 requests per second at 99.99% uptime, written in Go on Kubernetes.']),
      exp('Software Engineering Intern', 'Northpeak Games', 'Redmond, WA', 'Jun 2019', 'Sep 2019', ['Cut game patch download size by 35% by building delta compression for asset bundles.']) ] }),
    S('projects', 'Projects', { items: [proj('Distributed key-value store', 'github.com/jordanlee/kv', 'Rust, Raft', ['Linearizable store passing 1,000 Jepsen-style fault tests; 900 GitHub stars.'])] }),
    S('skills', 'Technical skills', { items: rows([['Languages', 'Java, Go, Python, C++, TypeScript, SQL'], ['Systems', 'Distributed systems, caching, gRPC, Kafka, Kubernetes, AWS, GCP'], ['Practices', 'System design, code review, on-call, A/B testing']]) })
  ] }; } },
  pmtech: { name: 'Product manager (big tech)', tip: 'Lead with the product decision you drove and the metric it moved. Name the team size and the number of users, and keep it to one page.', tpl: 'meta', build: function () { return { p: P('Morgan Diaz', 'Product Manager', 'New York, NY', [['LinkedIn', 'linkedin.com/in/morgandiaz']]), sections: [
    S('summary', 'Summary', { text: 'Product manager with 6 years in consumer apps and ads. Led teams of up to 18 engineers and launched features used by 25M people a month.' }),
    S('experience', 'Experience', { items: [
      exp('Senior Product Manager, Creator Tools', 'Brightline Social', 'New York, NY', 'Mar 2022', 'Present', ['Grew weekly active creators by 31% (1.9M to 2.5M) by launching scheduled posts and in-app editing, built with 2 design and 14 engineering partners.', 'Raised creator retention at 90 days from 44% to 52% by setting up a monthly experiment review that shipped 40 A/B tests a quarter.', 'Wrote the 3-year roadmap for creator monetization, funded with a new team of 9.']),
      exp('Product Manager, Ads Measurement', 'Harbor Media', 'Boston, MA', 'Jun 2019', 'Feb 2022', ['Increased advertiser spend by $22M a year by launching conversion lift studies for small businesses.', 'Cut report load time from 12 s to 2 s by leading a data pipeline rebuild across 3 teams.']) ] }),
    S('education', 'Education', { items: [edu('MBA', 'Columbia Business School', 'New York, NY', '2017', '2019', ''), edu('B.S. Information Systems', 'Carnegie Mellon University', 'Pittsburgh, PA', '2011', '2015', '')] }),
    S('skills', 'Skills', { items: rows([['Product', 'Roadmapping, experimentation, pricing, user research, PRDs'], ['Data and tools', 'SQL, Amplitude, Looker, Figma, Jira']]) })
  ] }; } },
  consult: { name: 'Consulting or finance', tip: 'Put education first with GPA and test scores, then experience with numbers in every bullet. One page, plain fonts, and a short line of interests at the end.', tpl: 'ivy', build: function () { return { p: P('Casey Patel', '', 'Chicago, IL', [['LinkedIn', 'linkedin.com/in/caseypatel']]), sections: [
    S('education', 'Education', { items: [edu('MBA, Finance and Strategy', 'Kellogg School of Management, Northwestern University', 'Evanston, IL', '2023', '2025', 'GMAT 740 · Co-chair, Consulting Club'), edu('B.A. Economics, magna cum laude', 'University of Michigan', 'Ann Arbor, MI', '2015', '2019', 'GPA 3.85')] }),
    S('experience', 'Experience', { items: [
      exp('Summer Associate', 'Lakeshore Strategy Partners', 'Chicago, IL', 'Jun 2024', 'Aug 2024', ['Built a market model for a $4B industrial client that sized a $600M adjacency; the client approved entry.', 'Ran 25 expert interviews and led the final readout to the client CFO.']),
      exp('Senior Analyst, Corporate Development', 'Midland Foods', 'Chicago, IL', 'Jul 2019', 'Jun 2023', ['Led diligence on 3 acquisitions totalling $310M, including valuation, synergy cases and board materials.', 'Found $14M in yearly procurement savings by benchmarking 1,200 supplier contracts.', 'Promoted ahead of cohort; trained 6 new analysts.']) ] }),
    S('experience', 'Leadership and activities', { items: [exp('Founder', 'Ann Arbor Financial Literacy Project', 'Ann Arbor, MI', '2017', '2019', ['Grew a volunteer program to 40 tutors teaching budgeting to 500 high-school students.'])] }),
    S('skills', 'Skills and interests', { items: rows([['Skills', 'Financial modelling, valuation, Excel, PowerPoint, SQL, Tableau'], ['Languages', 'English, Hindi, conversational Spanish'], ['Interests', 'Marathon running, chess, Chicago food history']]) })
  ] }; } },
  general: { name: 'Other or general', tip: 'A plain starting point. Add the sections your field expects, and keep standard headings.', tpl: 'classic', build: function () { return { p: P('Your Name', 'Your job title', 'City, Country', []), sections: [
    S('summary', 'Summary', { text: '' }),
    S('experience', 'Work experience', { items: [exp('', '', '', '', '', [])] }),
    S('education', 'Education', { items: [edu('', '', '', '', '', '')] }),
    S('skills', 'Skills', { items: rows([['', '']]) })
  ] }; } }
};


var ITEM_FIELDS = {
  experience: [['role', 'Job title', 'text'], ['org', 'Company', 'text'], ['loc', 'Location', 'text'], ['start', 'Start, such as Jan 2022', 'text'], ['end', 'End, or Present', 'text'], ['bullets', 'Achievements, one per line', 'area', 5]],
  education: [['degree', 'Degree', 'text'], ['school', 'School', 'text'], ['loc', 'Location', 'text'], ['start', 'Start', 'text'], ['end', 'End', 'text'], ['note', 'Details such as GPA or honours', 'area', 2]],
  projects: [['name', 'Project name', 'text'], ['link', 'Link', 'text'], ['tech', 'Tools or tech', 'text'], ['bullets', 'What you did, one per line', 'area', 4]],
  certs: [['name', 'Certification', 'text'], ['org', 'Issuer', 'text'], ['date', 'Date', 'text']],
  skills: [['label', 'Group, such as Languages', 'text'], ['items', 'Skills, separated by commas', 'area', 2]]
};
var ITEM_TYPES = ['experience', 'education', 'projects', 'certs', 'skills'];
var TEXT_TYPES = { summary: ['Summary', 4], bullets: ['One item per line', 5], inline: ['Separate with commas', 2], text: ['Text', 4] };
function blankItem(type) { var o = { id: nid() }; ITEM_FIELDS[type].forEach(function (f) { o[f[0]] = ''; }); return o; }
function blankData(type) { return ITEM_TYPES.indexOf(type) >= 0 ? { items: [blankItem(type)] } : { text: '' }; }

var st, jdText = '';
function designFor(tplKey) { var t = tplOf(tplKey), d = {}; for (var k in t[4]) d[k] = t[4][k]; d.margin = 'normal'; d.bullet = t[4].bullet || '•'; d.datePos = 'right'; d.paper = 'A4'; d.nameScale = 2.4; return d; }
function fresh(roleKey) { var r = ROLES[roleKey], b = r.build(); return { role: roleKey, tpl: r.tpl, p: b.p, sections: b.sections, d: designFor(r.tpl), open: {}, dirty: false }; }
var str = function (v, n) { return String(v == null ? '' : v).slice(0, n || 600); };
function cleanState(raw) {
  var s = fresh('software');
  if (!raw || typeof raw !== 'object') return s;
  if (ROLES[raw.role]) s.role = raw.role;
  if (TPLS.some(function (t) { return t[0] === raw.tpl; })) s.tpl = raw.tpl;
  var p = raw.p || {}; s.p = { name: str(p.name, 80), title: str(p.title, 100), email: str(p.email, 100), phone: str(p.phone, 40), loc: str(p.loc, 80), links: (Array.isArray(p.links) ? p.links : []).slice(0, 6).map(function (l) { return { id: nid(), t: str(l && l.t, 30), u: str(l && l.u, 200) }; }) };
  if (Array.isArray(raw.sections)) s.sections = raw.sections.slice(0, 30).map(function (sec) {
    var type = sec && (ITEM_TYPES.indexOf(sec.type) >= 0 || TEXT_TYPES[sec.type]) ? sec.type : 'text', data;
    if (ITEM_TYPES.indexOf(type) >= 0) {
      var items = sec.data && Array.isArray(sec.data.items) ? sec.data.items.slice(0, 40) : [];
      data = { items: items.map(function (it) { var o = { id: nid() }; ITEM_FIELDS[type].forEach(function (f) { o[f[0]] = str(it && it[f[0]], f[2] === 'area' ? 2500 : 200); }); return o; }) };
      if (!data.items.length) data.items.push(blankItem(type));
    } else data = { text: str(sec.data && sec.data.text, 6000) };
    return { id: nid(), type: type, title: str(sec.title, 60), hidden: !!sec.hidden, data: data };
  });
  var d = designFor(s.tpl), rd = raw.d || {};
  if (FONTS[rd.font]) d.font = rd.font; var n = function (v, lo, hi, def) { v = parseFloat(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def; };
  d.size = n(rd.size, 8, 13, d.size); d.lh = n(rd.lh, 1.1, 1.8, d.lh); d.gap = n(rd.gap, 4, 30, d.gap); d.nameScale = n(rd.nameScale, 1.6, 3.4, 2.4);
  if (['rule', 'caps', 'plain', 'box', 'bar', 'dotted', 'double', 'tint', 'short', 'smcap'].indexOf(rd.head) >= 0) d.head = rd.head; if (rd.align === 'center') d.align = 'center'; else if (rd.align === 'left') d.align = 'left';
  if (/^#[0-9a-f]{6}$/i.test(rd.accent || '')) d.accent = rd.accent; if (['narrow', 'normal', 'wide'].indexOf(rd.margin) >= 0) d.margin = rd.margin;
  if (['•', '–', '▪', '›'].indexOf(rd.bullet) >= 0) d.bullet = rd.bullet; if (rd.datePos === 'inline') d.datePos = 'inline'; if (rd.paper === 'Letter') d.paper = 'Letter';
  s.d = d; s.open = {}; s.dirty = !!raw.dirty; return s;
}
function load() { var raw = null; try { raw = JSON.parse(localStorage.getItem('apResume') || 'null'); } catch (e) {} st = raw ? cleanState(raw) : fresh('software'); }
var saveT; function save() { try { localStorage.setItem('apResume', JSON.stringify({ role: st.role, tpl: st.tpl, p: st.p, sections: st.sections, d: st.d, dirty: st.dirty })); } catch (e) {} }

/* ------------ text helpers ------------ */
var lines = function (t) { return String(t || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
var join = function (a, sep) { return a.filter(function (x) { return x && String(x).trim(); }).join(sep); };
function rng(s, e) { return s && e ? s + ' - ' + e : (s || e || ''); }
function contactParts() { var p = st.p; return [p.email, p.phone, p.loc].concat(p.links.map(function (l) { return join([l.t, l.u], ': '); })).filter(function (x) { return x && x.trim(); }); }
function secHasContent(sec) {
  if (ITEM_TYPES.indexOf(sec.type) >= 0) return sec.data.items.some(function (it) { return ITEM_FIELDS[sec.type].some(function (f) { return String(it[f[0]]).trim(); }); });
  return !!String(sec.data.text).trim();
}
function visible() { return st.sections.filter(function (s) { return !s.hidden && secHasContent(s); }); }

/* ------------ preview ------------ */
var rs = $('#resume'), fit = $('#fit');
var MARG = { narrow: 12, normal: 18, wide: 24 }, PW = { A4: [794, 1123], Letter: [816, 1056] };
function ul(text) { return h('ul', { class: 'rs-ul' }, lines(text).map(function (l) { return h('li', { text: l }); })); }
function secBody(sec) {
  var d = sec.data, t = sec.type, out = [];
  if (t === 'summary' || t === 'text') lines(d.text).forEach(function (l) { out.push(h('p', { class: 'rs-p', text: l })); });
  else if (t === 'bullets') out.push(ul(d.text));
  else if (t === 'inline') out.push(h('p', { class: 'rs-p', text: lines(d.text).join(', ').replace(/,\s*,/g, ',') }));
  else if (t === 'skills') d.items.forEach(function (it) { if (!(it.label.trim() || it.items.trim())) return; out.push(h('div', { class: 'rs-sk' }, it.label.trim() ? h('b', { text: it.label.trim() + ': ' }) : null, h('span', { text: it.items.trim() }))); });
  else if (t === 'certs') d.items.forEach(function (it) { if (!(it.name || it.org || it.date)) return; out.push(h('div', { class: 'rs-e rs-row' }, h('span', {}, h('b', { text: it.name }), it.org ? ', ' + it.org : ''), h('span', { class: 'rs-dt', text: it.date }))); });
  else d.items.forEach(function (it) {
    var isExp = t === 'experience', isEdu = t === 'education', isPro = t === 'projects';
    if (!ITEM_FIELDS[t].some(function (f) { return String(it[f[0]]).trim(); })) return;
    var dates = isPro ? it.tech : rng(it.start, it.end), main = isExp ? it.role : isEdu ? it.degree : it.name, sub = isExp ? join([it.org, it.loc], ', ') : isEdu ? join([it.school, it.loc], ', ') : it.link;
    var inline = st.d.datePos === 'inline' && !isPro;
    out.push(h('div', { class: 'rs-e' },
      h('div', { class: 'rs-row' }, h('b', { text: main }), inline ? null : h('span', { class: 'rs-dt', text: dates })),
      (sub || (inline && dates)) ? h('div', { class: 'rs-sub', text: join([sub, inline ? dates : ''], ' | ') }) : null,
      isEdu && it.note.trim() ? h('div', { class: 'rs-note', text: it.note.trim() }) : null,
      (isExp || isPro) && it.bullets.trim() ? ul(it.bullets) : null));
  });
  return out;
}
var SIDE = { skills: 1, certs: 1, inline: 1 };
function paint(el) {
  var d = st.d, p = st.p, W = PW[d.paper], mpx = Math.round(MARG[d.margin] * 3.7795), f = FONTS[d.font][1];
  var T = tplOf(st.tpl), lay = T[5];
  el.className = 'rsx rt-' + st.tpl + ' ly-' + lay + ' ' + T[6] + ' hd-' + d.head + ' al-' + d.align;
  el.style.cssText = 'width:' + W[0] + 'px;min-height:' + W[1] + 'px;padding:' + mpx + 'px;--ac:' + d.accent + ';--fs:' + d.size + 'pt;--lh:' + d.lh + ';--gap:' + d.gap + 'px;--ff:' + f + ';--bl:"' + d.bullet + '";--ns:' + d.nameScale;
  el.textContent = '';
  var cp = contactParts();
  el.appendChild(h('header', { class: 'rs-head' }, p.name.trim() ? h('h1', { class: 'rs-name', text: p.name.trim() }) : null, p.title.trim() ? h('div', { class: 'rs-title', text: p.title.trim() }) : null, cp.length ? (lay === 'split' ? h('div', { class: 'rs-contact' }, cp.map(function (x) { return h('span', { class: 'rs-cl', text: x }); })) : h('div', { class: 'rs-contact', text: cp.join(' | ') })) : null));
  var secs = visible(), mk = function (sec) { return h('section', { class: 'rs-sec' }, h('h2', { class: 'rs-h', text: sec.title.trim() || 'Section' }), h('div', { class: 'rs-b' }, secBody(sec))); };
  if (lay === 'side' || lay === 'sideR') { var sd = h('aside', { class: 'rs-side' }, secs.filter(function (s) { return SIDE[s.type]; }).map(mk)), mn = h('div', { class: 'rs-main' }, secs.filter(function (s) { return !SIDE[s.type]; }).map(mk)); el.appendChild(h('div', { class: 'rs-grid' }, lay === 'side' ? [sd, mn] : [mn, sd])); }
  else secs.forEach(function (s) { el.appendChild(mk(s)); });
}
function paintState(el, s) { var keep = st; st = s; try { paint(el); } finally { st = keep; } }
function render() {
  paint(rs);
  $('#pagesize').textContent = '@page{size:' + (st.d.paper === 'Letter' ? 'letter' : 'A4') + ';margin:' + MARG[st.d.margin] + 'mm}';
  layout();
}
function layout() {
  var d = st.d, W = PW[d.paper], mpx = Math.round(MARG[d.margin] * 3.7795), pc = W[1] - 2 * mpx;
  Array.prototype.forEach.call(rs.querySelectorAll('.rs-pb'), function (n) { n.remove(); });
  var H = rs.scrollHeight, pages = Math.max(1, Math.ceil((H - 2 * mpx) / pc - 0.03));
  for (var k = 1; k < pages; k++) rs.appendChild(h('div', { class: 'rs-pb', style: 'top:' + (mpx + k * pc) + 'px', text: 'Page ' + (k + 1) + ' starts about here' }));
  var s = Math.min(1, Math.max(0.3, fit.clientWidth / W[0]));
  rs.style.transform = 'scale(' + s + ')'; rs.style.transformOrigin = 'top left';
  fit.style.height = Math.round(rs.offsetHeight * s) + 'px';
  st._pages = pages; st._H = H;
  $('#pageNote').textContent = 'About ' + pages + (pages === 1 ? ' page' : ' pages') + ' on ' + d.paper + '. Dashed lines show roughly where pages break.';
}
window.addEventListener('resize', function () { layout(); });

/* ------------ editor ------------ */
function bump() { st.dirty = true; render(); drawAts(); clearTimeout(saveT); saveT = setTimeout(save, 300); }
function inputFor(obj, key, label, kind, rows, extra) {
  var id = 'f' + nid(), el = kind === 'area' ? h('textarea', { class: 'tl-textarea', id: id, rows: String(rows || 3), maxlength: '2500' }) : h('input', { class: 'tl-input', id: id, type: 'text', maxlength: '200' });
  el.value = obj[key] || ''; el.addEventListener('input', function () { obj[key] = el.value; bump(); });
  return h('div', { class: 'tl-field' + (extra || '') }, h('label', { for: id, text: label }), el);
}
function mini(label, text, fn, off) { return h('button', { type: 'button', class: 'tz-mini', 'aria-label': label, title: label, disabled: off ? 'disabled' : null, onclick: fn }, text); }
function move(arr, i, dir) { var j = i + dir; if (j < 0 || j >= arr.length) return false; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; return true; }

var ROLE_ICON = { software: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>', designer: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.6 7.6"/>', pm: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', data: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/>', marketing: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>', sales: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>', engineer: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', fresher: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>', general: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>', bigtech: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m9 8-2 2 2 2M15 8l2 2-2 2"/>', pmtech: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>', consult: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' };
function svgIcon(k) { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ROLE_ICON[k] || ROLE_ICON.general) + '</svg>'; }
function applyRole(k, keepTpl) {
  var t = keepTpl ? st.tpl : null; st = fresh(k); if (t) { var keep = st.d; st.tpl = t; st.d = designFor(t); st.d.paper = keep.paper; }
  afterReplace();
}
var tplFilter = 'all';
function drawStart() {
  var g = $('#roleGrid'); g.textContent = '';
  Object.keys(ROLES).forEach(function (k) {
    var b = h('button', { type: 'button', class: 'rb-role', 'aria-pressed': st.role === k ? 'true' : 'false', onclick: function () { if (st.role === k && !st.dirty) return; if (st.dirty && !window.confirm('Replace your resume with the ' + ROLES[k].name + ' starting point and its sample content?')) return; applyRole(k, true); if (window.apTrack) window.apTrack('resume_role', { r: k }); } });
    b.insertAdjacentHTML('afterbegin', '<span class="rb-ico">' + svgIcon(k) + '</span>'); b.appendChild(h('strong', { text: ROLES[k].name })); g.appendChild(b);
  });
  $('#roleTip').textContent = ROLES[st.role] ? ROLES[st.role].tip : '';
  var fb = $('#tplFilter'); fb.textContent = '';
  [['all', 'All ' + TPLS.length], ['ats', 'Safest for ATS'], ['faang', 'FAANG and big tech'], ['famous', 'Famous formats'], ['classic', 'Classic'], ['modern', 'Modern'], ['minimal', 'Minimal'], ['creative', 'Creative'], ['twocol', 'Two column']].forEach(function (f) { fb.appendChild(h('button', { type: 'button', 'aria-pressed': tplFilter === f[0] ? 'true' : 'false', onclick: function () { tplFilter = f[0]; drawStart(); } }, f[1])); });
  var tg = $('#tplGrid'); tg.textContent = '';
  TPLS.filter(function (t) { return tplFilter === 'all' || (' ' + t[7] + ' ').indexOf(' ' + tplFilter + ' ') >= 0 || t[0] === st.tpl; }).forEach(function (t) {
    var clone = JSON.parse(JSON.stringify({ role: st.role, tpl: t[0], p: st.p, sections: st.sections, d: designFor(t[0]) })); clone.d.paper = st.d.paper; clone.d.margin = st.d.margin;
    var frame = h('div', { class: 'rsx-frame' }, h('div', { class: 'rsx' })); paintState(frame.firstChild, clone);
    var btn = h('button', { type: 'button', class: 'rb-tpl', role: 'radio', 'aria-checked': st.tpl === t[0] ? 'true' : 'false', 'aria-label': t[1] + ' template, ATS ' + t[3], onclick: function () { st.tpl = t[0]; var keep = { margin: st.d.margin, bullet: st.d.bullet, datePos: st.d.datePos, paper: st.d.paper, nameScale: st.d.nameScale }; st.d = designFor(t[0]); for (var k in keep) st.d[k] = keep[k]; drawStart(); drawDesign(); bump(); if (window.apTrack) window.apTrack('resume_template', { t: t[0] }); } },
      frame, h('span', { class: 'rb-tpl-n' }, h('strong', { text: t[1] }), h('span', { class: 'rs-ats rs-ats--' + t[3].toLowerCase(), text: t[3] === 'Lower' ? 'ATS: lower' : 'ATS: ' + t[3].toLowerCase() })));
    tg.appendChild(btn);
  });
  if (window.RSfit) window.RSfit();
}
function afterReplace() { drawStart(); drawContact(); drawSections(); drawDesign(); render(); drawAts(); save(); }

function drawContact() {
  var b = $('#contactBody'), p = st.p; b.textContent = '';
  b.appendChild(h('div', { class: 'rs-f2' }, inputFor(p, 'name', 'Full name'), inputFor(p, 'title', 'Job title'), inputFor(p, 'email', 'Email'), inputFor(p, 'phone', 'Phone'), inputFor(p, 'loc', 'City and country')));
  var box = h('div', { class: 'rs-links' });
  p.links.forEach(function (l, i) { box.appendChild(h('div', { class: 'rs-link' }, inputFor(l, 't', 'Link name'), inputFor(l, 'u', 'Address, such as linkedin.com/in/you'), mini('Remove link', '×', function () { p.links.splice(i, 1); drawContact(); bump(); }))); });
  b.appendChild(box);
  if (p.links.length < 6) b.appendChild(h('div', { class: 'tl-actions' }, h('button', { type: 'button', class: 'tl-btn', onclick: function () { p.links.push({ id: nid(), t: 'LinkedIn', u: '' }); drawContact(); bump(); } }, 'Add a link')));
  b.appendChild(h('p', { class: 'tl-muted tl-small', text: 'No photo, date of birth or home address is needed. Employers in most countries do not want them, and a photo can confuse a parser.' }));
}
function drawSections() {
  var box = $('#secList'); box.textContent = '';
  st.sections.forEach(function (sec, i) {
    var open = st.open[sec.id] !== false && st.open[sec.id] !== undefined ? true : !!st.open[sec.id];
    var title = h('input', { class: 'tl-input rs-st', type: 'text', value: sec.title, maxlength: '60', 'aria-label': 'Section title' }); title.addEventListener('input', function () { sec.title = title.value; bump(); });
    var head = h('div', { class: 'rs-card-h' },
      h('button', { type: 'button', class: 'tz-mini', 'aria-expanded': open ? 'true' : 'false', 'aria-label': (open ? 'Collapse ' : 'Expand ') + sec.title, onclick: function () { st.open[sec.id] = !open; drawSections(); } }, open ? '▾' : '▸'),
      title,
      mini('Move up', '↑', function () { if (move(st.sections, i, -1)) { drawSections(); bump(); } }, i === 0), mini('Move down', '↓', function () { if (move(st.sections, i, 1)) { drawSections(); bump(); } }, i === st.sections.length - 1),
      mini(sec.hidden ? 'Show this section' : 'Hide this section', sec.hidden ? 'Show' : 'Hide', function () { sec.hidden = !sec.hidden; drawSections(); bump(); }),
      mini('Delete this section', '×', function () { if (!window.confirm('Delete the section "' + (sec.title || 'Untitled') + '"?')) return; st.sections.splice(i, 1); drawSections(); bump(); }));
    var card = h('div', { class: 'rs-card' + (sec.hidden ? ' is-off' : '') }, head);
    if (open) card.appendChild(h('div', { class: 'rs-card-b' }, secEditor(sec)));
    box.appendChild(card);
  });
  if (!st.sections.length) box.appendChild(h('p', { class: 'tl-muted', text: 'No sections yet. Add one below.' }));
}
function secEditor(sec) {
  var t = sec.type, d = sec.data;
  if (TEXT_TYPES[t]) return [inputFor(d, 'text', TEXT_TYPES[t][0], 'area', TEXT_TYPES[t][1])];
  var out = [];
  d.items.forEach(function (it, i) {
    var fields = ITEM_FIELDS[t].map(function (f) { return inputFor(it, f[0], f[1], f[2], f[3], f[2] === 'area' ? ' rs-wide' : ''); });
    out.push(h('div', { class: 'rs-item' }, h('div', { class: 'rs-item-h' }, h('span', { class: 'tl-muted', text: (t === 'skills' ? 'Group ' : 'Entry ') + (i + 1) }), h('span', { class: 'tl-actions' }, mini('Move up', '↑', function () { if (move(d.items, i, -1)) { drawSections(); bump(); } }, i === 0), mini('Move down', '↓', function () { if (move(d.items, i, 1)) { drawSections(); bump(); } }, i === d.items.length - 1), mini('Remove this entry', '×', function () { d.items.splice(i, 1); if (!d.items.length) d.items.push(blankItem(t)); drawSections(); bump(); }))), h('div', { class: 'rs-f2' }, fields)));
  });
  out.push(h('div', { class: 'tl-actions' }, h('button', { type: 'button', class: 'tl-btn', onclick: function () { d.items.push(blankItem(t)); drawSections(); bump(); } }, t === 'skills' ? 'Add a skill group' : 'Add another entry')));
  if (t === 'experience' || t === 'projects') out.push(h('p', { class: 'tl-muted tl-small', text: 'Start each line with a strong verb, then say what changed and by how much. Numbers help.' }));
  return out;
}
function drawAdd() {
  var sel = $('#addSel'); sel.textContent = '';
  ADD.forEach(function (a, i) { sel.appendChild(h('option', { value: i, text: a[1] })); });
  $('#addBtn').addEventListener('click', function () { var a = ADD[+sel.value]; var s = S(a[0], a[1], blankData(a[0])); st.sections.push(s); st.open[s.id] = true; drawSections(); bump(); var last = document.querySelector('#secList .rs-card:last-child .rs-st'); if (last) last.scrollIntoView({ block: 'center' }); });
}
function drawDesign() {
  var b = $('#designBody'), d = st.d; b.textContent = '';
  var sel = function (label, key, opts, after) { var id = 'd' + nid(), s = h('select', { class: 'tl-select', id: id }); opts.forEach(function (o) { s.appendChild(h('option', { value: o[0], text: o[1] })); }); s.value = d[key]; s.addEventListener('change', function () { d[key] = s.value; if (after) after(); bump(); }); return h('div', { class: 'tl-field' }, h('label', { for: id, text: label }), s); };
  var rg = function (label, key, min, max, step, fmt) { var id = 'd' + nid(), v = h('span', { class: 'tl-muted', text: fmt(d[key]) }), r = h('input', { class: 'tl-range', type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(d[key]) }); r.addEventListener('input', function () { d[key] = parseFloat(r.value); v.textContent = fmt(d[key]); bump(); }); return h('div', { class: 'tl-field' }, h('label', { for: id }, label + ': ', v), r); };
  b.appendChild(h('div', { class: 'rs-f2' },
    sel('Font', 'font', Object.keys(FONTS).map(function (k) { return [k, FONTS[k][0]]; })),
    rg('Text size', 'size', 8, 13, 0.5, function (v) { return v + ' pt'; }), rg('Line spacing', 'lh', 1.1, 1.8, 0.05, function (v) { return v.toFixed(2); }), rg('Space between sections', 'gap', 4, 30, 1, function (v) { return v + ' px'; }), rg('Name size', 'nameScale', 1.6, 3.4, 0.1, function (v) { return Math.round(v * 100) + '%'; }),
    sel('Margins', 'margin', [['narrow', 'Narrow (12 mm)'], ['normal', 'Normal (18 mm)'], ['wide', 'Wide (24 mm)']]),
    sel('Section headings', 'head', [['rule', 'Underlined'], ['caps', 'Capitals'], ['plain', 'Plain bold'], ['box', 'Coloured band'], ['bar', 'Side bar'], ['dotted', 'Dotted line'], ['double', 'Double line'], ['tint', 'Tinted bar'], ['short', 'Short underline'], ['smcap', 'Small capitals, underlined']]),
    sel('Header alignment', 'align', [['left', 'Left'], ['center', 'Centred']]), sel('Dates', 'datePos', [['right', 'On the right'], ['inline', 'After the company']]), sel('Bullet', 'bullet', [['•', '•  Dot'], ['–', '–  Dash'], ['▪', '▪  Square'], ['›', '›  Arrow']]), sel('Paper', 'paper', [['A4', 'A4'], ['Letter', 'US Letter']])));
  var ac = h('div', { class: 'tl-field' }, h('span', { class: 'tl-label', text: 'Accent colour' }));
  var row = h('div', { class: 'tl-row', style: 'gap:8px' }); ['#111111', '#1f4fd8', '#0f766e', '#b45309', '#be123c', '#6d28d9', '#334155'].forEach(function (c) { row.appendChild(h('button', { type: 'button', class: 'inv-sw', style: 'background:' + c, 'aria-label': 'Accent ' + c, 'aria-pressed': d.accent.toLowerCase() === c ? 'true' : 'false', onclick: function () { d.accent = c; drawDesign(); bump(); } })); });
  var cin = h('input', { type: 'color', value: d.accent, 'aria-label': 'Custom accent colour', style: 'width:38px;height:30px;border:0;background:none;padding:0' }); cin.addEventListener('input', function () { d.accent = cin.value; bump(); }); row.appendChild(cin);
  ac.appendChild(row); b.appendChild(ac);
  b.appendChild(h('div', { class: 'tl-actions' }, h('button', { type: 'button', class: 'tl-btn', onclick: function () { var keep = st.d.paper; st.d = designFor(st.tpl); st.d.paper = keep; drawDesign(); bump(); } }, 'Reset to the template defaults')));
}

/* ------------ ATS check + job match ------------ */
var VERBS = 'achieved,administered,analysed,analyzed,architected,automated,boosted,built,championed,collaborated,completed,configured,consolidated,coordinated,created,cut,decreased,delivered,deployed,designed,developed,directed,drove,eliminated,enabled,engineered,established,exceeded,executed,expanded,facilitated,generated,grew,guided,identified,implemented,improved,increased,initiated,integrated,introduced,launched,led,managed,mentored,migrated,modelled,negotiated,optimised,optimized,orchestrated,organised,organized,oversaw,owned,partnered,planned,presented,produced,raised,rebuilt,reduced,redesigned,refactored,released,replaced,researched,resolved,restructured,reviewed,saved,scaled,secured,shipped,simplified,sold,spearheaded,standardised,standardized,streamlined,strengthened,supported,trained,translated,upgraded,won,wrote,closed,booked,ran,won,forecast,produced,converted,cleaned,tested,fixed,wrote,authored,published,taught,advised,sourced,onboarded,audited,prototyped,validated,defined,mapped,tracked,monitored'.split(',');
function allBullets() { var out = []; st.sections.forEach(function (s) { if (s.hidden) return; if (s.type === 'experience' || s.type === 'projects') s.data.items.forEach(function (it) { lines(it.bullets).forEach(function (b) { out.push(b); }); }); }); return out; }
function checks() {
  var p = st.p, c = [], add = function (ok, text, fix) { c.push({ ok: ok, text: text, fix: fix }); }, secs = visible();
  add(!!p.name.trim(), 'Your name is at the top', 'Add your full name.');
  add(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email.trim()), 'A working email address is in the header', 'Add an email address.');
  add(!!p.phone.trim(), 'A phone number is in the header', 'Add a phone number.');
  add(tplOf(st.tpl)[5] !== 'side' && tplOf(st.tpl)[5] !== 'sideR', 'Single-column layout', 'Two columns can be read in the wrong order by some parsers. Switch to Classic or Minimal for important applications.');
  var heads = secs.map(function (s) { return s.title.trim(); }), odd = heads.filter(function (t) { return !STD_HEADS.test(t); });
  add(!odd.length, 'Section headings are the standard ones parsers look for', 'Rename "' + odd.slice(0, 3).join('", "') + '" to a common heading such as Experience, Education, Skills or Projects.');
  add(secs.some(function (s) { return s.type === 'experience'; }) || secs.some(function (s) { return s.type === 'education'; }), 'There is an Experience or Education section', 'Add one of them.');
  add(secs.some(function (s) { return s.type === 'skills'; }), 'There is a Skills section with keywords', 'Add a Skills section. Parsers and recruiters search it.');
  var exps = []; secs.forEach(function (s) { if (s.type === 'experience') s.data.items.forEach(function (it) { if (it.role || it.org) exps.push(it); }); });
  var yr = /(19|20)\d\d/; add(!exps.length || exps.every(function (it) { return yr.test(it.start) && (yr.test(it.end) || /present|current|now/i.test(it.end)); }), 'Every job has start and end dates with a year', 'Give each job a start and an end, such as "Jan 2022" and "Present".');
  var bl = allBullets(), words = bl.map(function (b) { return b.split(/\s+/).length; });
  add(!bl.length || Math.max.apply(null, words) <= 32, 'Bullets are short (under about 30 words)', 'Shorten the longest bullets to one or two lines.');
  var verbOk = bl.filter(function (b) { var w = b.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ''); return VERBS.indexOf(w) >= 0 || /ed$/.test(w); }).length;
  add(!bl.length || verbOk / bl.length >= 0.7, 'Most bullets start with an action verb', 'Start bullets with verbs such as Led, Built, Reduced or Launched.');
  var numOk = bl.filter(function (b) { return /\d/.test(b); }).length;
  add(!bl.length || numOk / bl.length >= 0.4, 'Many bullets include a number or result', 'Add figures where you honestly can: percentages, money, time, team size.');
  add((st._pages || 1) <= 2, 'Two pages or fewer (' + (st._pages || 1) + ' now)', 'Trim older or less relevant detail. One page suits under about 10 years of experience.');
  add(!/\b(I|my|me)\b/.test(secs.map(function (s) { return ITEM_TYPES.indexOf(s.type) >= 0 ? '' : s.data.text || ''; }).join(' ')), 'No first-person pronouns in the summary', 'Write "Led a team of 5" rather than "I led my team of 5".');
  return c;
}
function drawAts() {
  var b = $('#atsBody'), c = checks(), pass = c.filter(function (x) { return x.ok; }).length; b.textContent = '';
  b.appendChild(h('p', { class: 'rs-score', text: pass + ' of ' + c.length + ' checks pass' }));
  var ul2 = h('ul', { class: 'rs-checks' });
  c.forEach(function (x) { ul2.appendChild(h('li', { class: x.ok ? 'is-ok' : 'is-no' }, h('span', { 'aria-hidden': 'true', text: x.ok ? '✓' : '!' }), h('span', {}, h('b', { text: x.text }), x.ok ? null : h('em', { text: ' ' + x.fix })))); });
  b.appendChild(ul2);
  b.appendChild(h('p', { class: 'tl-muted tl-small', text: 'These are common good-practice checks, not a score from a real ATS. No tool can promise that a resume will pass a given employer’s system.' }));
  drawMatch();
}
var STOP = 'a,about,above,after,again,all,also,am,an,and,any,are,as,at,be,because,been,before,being,between,both,but,by,can,could,did,do,does,doing,down,during,each,few,for,from,further,had,has,have,having,he,her,here,hers,him,his,how,i,if,in,into,is,it,its,just,me,more,most,my,no,nor,not,now,of,off,on,once,only,or,other,our,ours,out,over,own,per,same,she,should,so,some,such,than,that,the,their,theirs,them,then,there,these,they,this,those,through,to,too,under,until,up,us,very,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,you,your,yours,able,ability,across,add,build,candidate,company,day,experience,help,including,join,looking,must,need,new,number,part,people,plus,preferred,required,requirements,responsibilities,responsible,role,strong,team,teams,through,time,understanding,use,using,well,within,work,working,years,year,years+,etc,hiring,run,own,ensure,job,position,skills,knowledge,excellent,good,great,seeking,ideal,opportunity,benefits,equal,employer,apply'.split(',');
var stopSet = {}; STOP.forEach(function (w) { stopSet[w] = 1; });
function resumeText() { var out = [st.p.name, st.p.title, st.p.loc]; visible().forEach(function (s) { out.push(s.title); if (ITEM_TYPES.indexOf(s.type) >= 0) s.data.items.forEach(function (it) { ITEM_FIELDS[s.type].forEach(function (f) { out.push(it[f[0]]); }); }); else out.push(s.data.text); }); return out.join(' \n ').toLowerCase(); }
function keywords(jd) {
  var freq = {}, order = [], toks = jd.toLowerCase().match(/[a-z][a-z0-9+#.\/-]*[a-z0-9+#]|[a-z]/g) || [];
  toks.forEach(function (t) { t = t.replace(/^[.\/-]+|[.\/-]+$/g, ''); if (t.length < 2 || stopSet[t] || /^\d+$/.test(t)) return; if (!freq[t]) { freq[t] = 0; order.push(t); } freq[t]++; });
  var tech = function (t) { return /[+#.]/.test(t) ? 1 : 0; };
  order.sort(function (a, b) { return (freq[b] + tech(b)) - (freq[a] + tech(a)) || order.indexOf(a) - order.indexOf(b); });
  return order.slice(0, 24).map(function (t) { return { w: t, n: freq[t] }; });
}
function hasWord(text, w) { var esc = w.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); return new RegExp('(^|[^a-z0-9+#])' + esc + '($|[^a-z0-9+#])').test(text); }
function drawMatch() {
  var b = $('#matchBody'); b.textContent = '';
  if (jdText.trim().length < 40) { b.appendChild(h('p', { class: 'tl-muted tl-small', text: 'Paste a job description above to see which of its main words your resume already uses.' })); return; }
  var kw = keywords(jdText), txt = resumeText(), hit = kw.filter(function (k) { return hasWord(txt, k.w); }), miss = kw.filter(function (k) { return !hasWord(txt, k.w); });
  b.appendChild(h('p', { class: 'rs-score', text: Math.round(hit.length / Math.max(1, kw.length) * 100) + '% of the top ' + kw.length + ' words match' }));
  var chips = function (list, cls) { return h('div', { class: 'rs-chips' }, list.map(function (k) { return h('span', { class: 'rs-chip ' + cls, text: k.w }); })); };
  if (hit.length) b.appendChild(h('div', {}, h('span', { class: 'tl-label', text: 'Already in your resume' }), chips(hit, 'is-hit')));
  if (miss.length) b.appendChild(h('div', {}, h('span', { class: 'tl-label', text: 'Missing from your resume' }), chips(miss, 'is-miss')));
  b.appendChild(h('p', { class: 'tl-muted tl-small', text: 'Work in a missing word only where it is true, in your skills or in a bullet that shows it. Stuffing keywords does not help and recruiters notice it.' }));
}

/* ------------ exports ------------ */
function toText() {
  var p = st.p, o = [];
  if (p.name.trim()) o.push(p.name.trim()); if (p.title.trim()) o.push(p.title.trim()); var cp = contactParts(); if (cp.length) o.push(cp.join(' | ')); o.push('');
  visible().forEach(function (s) {
    o.push((s.title.trim() || 'Section').toUpperCase());
    if (TEXT_TYPES[s.type]) { if (s.type === 'bullets') lines(s.data.text).forEach(function (l) { o.push('- ' + l); }); else if (s.type === 'inline') o.push(lines(s.data.text).join(', ')); else lines(s.data.text).forEach(function (l) { o.push(l); }); }
    else s.data.items.forEach(function (it) {
      if (!ITEM_FIELDS[s.type].some(function (f) { return String(it[f[0]]).trim(); })) return;
      if (s.type === 'skills') o.push(join([it.label, it.items], ': '));
      else if (s.type === 'certs') o.push(join([join([it.name, it.org], ', '), it.date], ' | '));
      else { var isE = s.type === 'experience', isD = s.type === 'education'; o.push(join([isE ? it.role : isD ? it.degree : it.name, isE ? it.org : isD ? it.school : it.link, isE || isD ? it.loc : it.tech, s.type === 'projects' ? '' : rng(it.start, it.end)], ' | ')); if (isD && it.note.trim()) o.push(it.note.trim()); if (it.bullets) lines(it.bullets).forEach(function (l) { o.push('- ' + l); }); }
    });
    o.push('');
  });
  return o.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
var X = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
function crc32(u8) { var t = crc32.t; if (!t) { t = crc32.t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } } var r = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) r = t[(r ^ u8[i]) & 255] ^ (r >>> 8); return (r ^ 0xFFFFFFFF) >>> 0; }
function zip(entries) {
  var enc = new TextEncoder(), now = new Date(), time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1), date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate(), local = [], central = [], off = 0;
  entries.forEach(function (en) { var name = enc.encode(en.name), data = enc.encode(en.text), crc = crc32(data), L = new DataView(new ArrayBuffer(30)), C = new DataView(new ArrayBuffer(46));
    L.setUint32(0, 0x04034b50, true); L.setUint16(4, 20, true); L.setUint16(6, 0x0800, true); L.setUint16(10, time, true); L.setUint16(12, date, true); L.setUint32(14, crc, true); L.setUint32(18, data.length, true); L.setUint32(22, data.length, true); L.setUint16(26, name.length, true);
    C.setUint32(0, 0x02014b50, true); C.setUint16(4, 20, true); C.setUint16(6, 20, true); C.setUint16(8, 0x0800, true); C.setUint16(12, time, true); C.setUint16(14, date, true); C.setUint32(16, crc, true); C.setUint32(20, data.length, true); C.setUint32(24, data.length, true); C.setUint16(28, name.length, true); C.setUint32(42, off, true);
    local.push(new Uint8Array(L.buffer), name, data); central.push(new Uint8Array(C.buffer), name); off += 30 + name.length + data.length; });
  var cl = central.reduce(function (a, x) { return a + x.length; }, 0), E = new DataView(new ArrayBuffer(22)); E.setUint32(0, 0x06054b50, true); E.setUint16(8, entries.length, true); E.setUint16(10, entries.length, true); E.setUint32(12, cl, true); E.setUint32(16, off, true);
  return new Blob(local.concat(central, [new Uint8Array(E.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
function docx() {
  var d = st.d, fn = FONTS[d.font][0], sz = Math.round(d.size * 2), W = d.paper === 'Letter' ? [12240, 15840] : [11906, 16838], m = Math.round(MARG[d.margin] * 56.7), tw = W[0] - 2 * m, tint = /nm-ac|hb|sd-fill/.test(tplOf(st.tpl)[6]) ? d.accent.replace('#', '') : '000000', center = d.align === 'center', body = [];
  var run = function (t, o) { o = o || {}; return '<w:r><w:rPr><w:rFonts w:ascii="' + fn + '" w:hAnsi="' + fn + '" w:cs="' + fn + '"/>' + (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.c ? '<w:color w:val="' + o.c + '"/>' : '') + '<w:sz w:val="' + (o.sz || sz) + '"/></w:rPr><w:t xml:space="preserve">' + X(t) + '</w:t></w:r>'; };
  var tab = '<w:r><w:tab/></w:r>';
  var para = function (inner, o) { o = o || {}; return '<w:p><w:pPr>' + (o.keep ? '<w:keepNext/>' : '') + (o.tabs ? '<w:tabs>' + o.tabs + '</w:tabs>' : '') + (o.border ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="' + o.border + '"/></w:pBdr>' : '') + '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 40 : o.after) + '" w:line="' + Math.round(d.lh * 240) + '" w:lineRule="auto"/>' + (o.ind ? '<w:ind w:left="' + o.ind[0] + '" w:hanging="' + o.ind[1] + '"/>' : '') + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '') + '</w:pPr>' + inner + '</w:p>'; };
  var rtab = '<w:tab w:val="right" w:pos="' + tw + '"/>';
  var p = st.p; if (p.name.trim()) body.push(para(run(p.name.trim(), { b: 1, sz: Math.round(sz * d.nameScale), c: tint }), { jc: center ? 'center' : null, after: 20 }));
  if (p.title.trim()) body.push(para(run(p.title.trim(), { sz: Math.round(sz * 1.15) }), { jc: center ? 'center' : null, after: 20 }));
  var cp = contactParts(); if (cp.length) body.push(para(run(cp.join(' | ')), { jc: center ? 'center' : null, after: 120 }));
  visible().forEach(function (s) {
    body.push(para(run((s.title.trim() || 'Section').toUpperCase(), { b: 1, c: tint }), { before: Math.round(d.gap * 15), after: 60, border: tint, keep: 1 }));
    var bullet = function (t) { return para(run(d.bullet) + '<w:r><w:tab/></w:r>' + run(t), { ind: [360, 260], tabs: '<w:tab w:val="left" w:pos="360"/>', after: 20 }); };
    if (s.type === 'summary' || s.type === 'text') lines(s.data.text).forEach(function (l) { body.push(para(run(l))); });
    else if (s.type === 'bullets') lines(s.data.text).forEach(function (l) { body.push(bullet(l)); });
    else if (s.type === 'inline') body.push(para(run(lines(s.data.text).join(', '))));
    else s.data.items.forEach(function (it) {
      if (!ITEM_FIELDS[s.type].some(function (f) { return String(it[f[0]]).trim(); })) return;
      if (s.type === 'skills') { body.push(para((it.label.trim() ? run(it.label.trim() + ': ', { b: 1 }) : '') + run(it.items.trim()))); return; }
      if (s.type === 'certs') { body.push(para(run(it.name, { b: 1 }) + (it.org ? run(', ' + it.org) : '') + (it.date ? tab + run(it.date) : ''), { tabs: rtab })); return; }
      var isE = s.type === 'experience', isD = s.type === 'education', main = isE ? it.role : isD ? it.degree : it.name, dates = s.type === 'projects' ? it.tech : rng(it.start, it.end), sub = isE ? join([it.org, it.loc], ', ') : isD ? join([it.school, it.loc], ', ') : it.link;
      body.push(para(run(main, { b: 1 }) + (dates ? tab + run(dates) : ''), { tabs: rtab, keep: 1, before: 60, after: 0 }));
      if (sub) body.push(para(run(sub, { i: 1 }), { keep: 1, after: 20 }));
      if (isD && it.note.trim()) body.push(para(run(it.note.trim())));
      if (it.bullets) lines(it.bullets).forEach(function (l) { body.push(bullet(l)); });
    });
  });
  var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body.join('') + '<w:sectPr><w:pgSz w:w="' + W[0] + '" w:h="' + W[1] + '"/><w:pgMar w:top="' + m + '" w:right="' + m + '" w:bottom="' + m + '" w:left="' + m + '" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>';
  return zip([
    { name: '[Content_Types].xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name: '_rels/.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name: 'word/document.xml', text: doc }]);
}
function fileName(ext) { return (st.p.name.trim() || 'resume').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '-resume.' + ext; }
function download(blob, name) { var u = URL.createObjectURL(blob), a = h('a', { href: u, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); }
function flash(b, t, idle) { b.textContent = t; setTimeout(function () { b.textContent = idle; }, 1500); }

/* ------------ wiring ------------ */
var origTitle = document.title;
window.addEventListener('afterprint', function () { document.title = origTitle; });
$('#print').addEventListener('click', function () { render(); document.title = (st.p.name.trim() ? st.p.name.trim() + ' - Resume' : 'Resume'); if (window.apTrack) window.apTrack('resume_print', { t: st.tpl }); window.print(); });
$('#dl-docx').addEventListener('click', function () { download(docx(), fileName('docx')); if (window.apTrack) window.apTrack('resume_docx', {}); });
$('#dl-txt').addEventListener('click', function (e) { var t = toText(), b = e.currentTarget; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { flash(b, 'Copied', 'Copy as plain text'); }, function () { window.prompt('Copy this:', t); }); });
$('#dl-json').addEventListener('click', function () { save(); download(new Blob([localStorage.getItem('apResume') || '{}'], { type: 'application/json' }), fileName('json')); });
$('#open-json').addEventListener('change', function (e) { var f = e.target.files[0]; e.target.value = ''; if (!f || f.size > 2000000) return; var r = new FileReader(); r.onload = function () { try { st = cleanState(JSON.parse(r.result)); afterReplace(); } catch (er) { window.alert('That file is not a saved resume.'); } }; r.readAsText(f); });
$('#clearAll').addEventListener('click', function () { if (!window.confirm('Remove the resume saved in this browser and start again?')) return; try { localStorage.removeItem('apResume'); } catch (e) {} st = fresh('software'); afterReplace(); });
$('#jd').addEventListener('input', function (e) { jdText = e.target.value; drawMatch(); });

/* ---- steps ---- */
var STEPS = ['Start', 'Details', 'Sections', 'Design', 'Check', 'Download'], cur = 1;
function go(n) {
  cur = Math.max(1, Math.min(STEPS.length, n));
  Array.prototype.forEach.call(document.querySelectorAll('.rb-step'), function (p) { p.hidden = +p.getAttribute('data-step') !== cur; });
  Array.prototype.forEach.call(document.querySelectorAll('#rbSteps button'), function (b) { var i = +b.getAttribute('data-go'); b.setAttribute('aria-current', i === cur ? 'step' : 'false'); b.classList.toggle('is-done', i < cur); });
  $('#rbBack').hidden = cur === 1; $('#rbNext').hidden = cur === STEPS.length; $('#rbNext').textContent = 'Next: ' + (STEPS[cur] || '');
  if (cur === 1) drawStart(); if (cur === 5) drawAts();
  var top = $('#rbSteps'); if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' });
  if (window.apTrack) window.apTrack('resume_step', { s: cur });
}
(function () { var box = $('#rbSteps'); STEPS.forEach(function (n, i) { box.appendChild(h('button', { type: 'button', 'data-go': String(i + 1), onclick: function () { go(i + 1); } }, h('span', { class: 'rb-n', text: String(i + 1) }), h('span', { class: 'rb-l', text: n }))); }); })();
$('#rbBack').addEventListener('click', function () { go(cur - 1); }); $('#rbNext').addEventListener('click', function () { go(cur + 1); });
$('#rbDl').addEventListener('click', function () { go(6); });

load();
(function () {
  var q = new URLSearchParams(location.search), qr = q.get('role'), qt = q.get('tpl'), tplOk = TPLS.some(function (t) { return t[0] === qt; });
  if (qr && ROLES[qr]) { if (!st.dirty || window.confirm('Replace the resume in progress with the ' + ROLES[qr].name + ' starting point?')) { st = fresh(qr); if (tplOk) { var pk = st.d.paper; st.tpl = qt; st.d = designFor(qt); st.d.paper = pk; } } }
  else if (tplOk) { var keep = { margin: st.d.margin, bullet: st.d.bullet, datePos: st.d.datePos, paper: st.d.paper, nameScale: st.d.nameScale }; st.tpl = qt; st.d = designFor(qt); for (var k in keep) st.d[k] = keep[k]; }
})();
drawAdd(); drawStart(); drawContact(); drawSections(); drawDesign(); render(); drawAts(); go((qrStart() ? 2 : 1));
function qrStart() { var q = new URLSearchParams(location.search); return q.get('role') || q.get('tpl'); }
if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(fit);
window.__rs = { roleData: function () { var o = {}; Object.keys(ROLES).forEach(function (k) { var b = ROLES[k].build(), sk = [], bl = []; b.sections.forEach(function (sec) { if (sec.type === 'skills') sec.data.items.forEach(function (r) { r.items.split(',').forEach(function (x) { x = x.trim(); if (x && sk.length < 24) sk.push(x); }); }); if (sec.type === 'experience' && !bl.length) bl = lines(sec.data.items[0].bullets); }); o[k] = { skills: sk, bullets: bl }; }); return o; }, snapshot: function (role, tpl) { var s0 = fresh(role); if (tpl) { s0.tpl = tpl; s0.d = designFor(tpl); } var el = document.createElement('div'); paintState(el, s0); return el.outerHTML; }, go: go, st: function () { return st; }, text: toText, docx: docx, checks: checks, kw: keywords, pages: function () { return st._pages; } };
})();
