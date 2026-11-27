// Where the blog desk reads news, and how it labels outlets so each post can be checked for a spread of viewpoints.
// The lean labels are approximate and editorial (in the spirit of AllSides and Ad Fontes Media ratings): L left-leaning, C centre / straight news / trade press, R right-leaning.
// A domain that is not listed counts as a primary or other source (a company blog, a paper, a regulator).
const FEEDS = [
  ['OpenAI', 'https://openai.com/news/rss.xml'], ['Google AI Blog', 'https://blog.google/technology/ai/rss/'], ['Hugging Face', 'https://huggingface.co/blog/feed.xml'],
  ['TechCrunch', 'https://techcrunch.com/category/artificial-intelligence/feed/'], ['The Verge', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'],
  ['Ars Technica', 'https://feeds.arstechnica.com/arstechnica/technology-lab'], ['Wired', 'https://www.wired.com/feed/tag/ai/latest/rss'], ['VentureBeat', 'https://venturebeat.com/category/ai/feed/'],
  ['MIT Technology Review', 'https://www.technologyreview.com/feed/'], ['The Guardian', 'https://www.theguardian.com/technology/artificialintelligenceai/rss'], ['BBC News', 'https://feeds.bbci.co.uk/news/technology/rss.xml'],
  ['NPR', 'https://feeds.npr.org/1019/rss.xml'], ['New York Post', 'https://nypost.com/tech/feed/'], ['Fox News', 'https://moxie.foxnews.com/google-publisher/tech.xml'], ['Reason', 'https://reason.com/tag/technology/feed/'],
  ['Mint', 'https://www.livemint.com/rss/technology'], ['Economic Times', 'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms'], ['The Hindu', 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss'],
  ['NDTV Gadgets', 'https://gadgets.ndtv.com/rss/news'], ['Hacker News', 'https://hnrss.org/frontpage?points=250'],
  // Added 2026-11-23: until now every feed was AI or tech, so breaches and gaming stories never reached the desk. Third item = topic.
  ['BleepingComputer', 'https://www.bleepingcomputer.com/feed/', 'security'], ['The Hacker News', 'https://feeds.feedburner.com/TheHackersNews', 'security'], ['Krebs on Security', 'https://krebsonsecurity.com/feed/', 'security'],
  ['SecurityWeek', 'https://www.securityweek.com/feed/', 'security'], ['Dark Reading', 'https://www.darkreading.com/rss.xml', 'security'],
  ['GameSpot', 'https://www.gamespot.com/feeds/news/', 'gaming'], ['PC Gamer', 'https://www.pcgamer.com/rss/', 'gaming'], ['Eurogamer', 'https://www.eurogamer.net/feed', 'gaming'],
  ['BBC Business', 'https://feeds.bbci.co.uk/news/business/rss.xml', 'finance'], ['Mint Companies', 'https://www.livemint.com/rss/companies', 'finance'],
].map(([name, url, topic]) => ({ name, url, topic: topic || 'ai' }));

// Topic weights (Aashish, 2026-11-23): added to the 1 to 10 importance score, result capped at 10. AI already fills the plan, so it gets 0.
// ai = AI tools, models, policy and AI business; tech = other tech and big-company news; explainer = plain-English how-tos.
const TOPIC_WEIGHT = { ai: 0, tech: 0, explainer: 0, security: 2, gaming: 2, finance: 1 };
const topicOf = (p) => { const x = (p.extra && p.extra.topic) || p.topic; return x in TOPIC_WEIGHT ? x : 'ai'; };

// domain -> [outlet, lean, region]
const OUTLETS = {
  'theguardian.com': ['The Guardian', 'L', 'UK'],  'nbcnews.com': ['NBC News', 'L', 'US'], 'huffpost.com': ['HuffPost', 'L', 'US'], 'vox.com': ['Vox', 'L', 'US'], 'npr.org': ['NPR', 'L', 'US'], 'nytimes.com': ['The New York Times', 'L', 'US'], 'washingtonpost.com': ['The Washington Post', 'L', 'US'],
  'theverge.com': ['The Verge', 'L', 'US'], 'wired.com': ['Wired', 'L', 'US'], 'motherjones.com': ['Mother Jones', 'L', 'US'], 'theatlantic.com': ['The Atlantic', 'L', 'US'], 'slate.com': ['Slate', 'L', 'US'], 'thehindu.com': ['The Hindu', 'L', 'IN'], 'scroll.in': ['Scroll', 'L', 'IN'], 'thewire.in': ['The Wire', 'L', 'IN'],
  'reuters.com': ['Reuters', 'C', 'INT'], 'apnews.com': ['Associated Press', 'C', 'US'], 'bbc.com': ['BBC News', 'C', 'UK'], 'bbc.co.uk': ['BBC News', 'C', 'UK'], 'bloomberg.com': ['Bloomberg', 'C', 'US'], 'cnbc.com': ['CNBC', 'C', 'US'], 'forbes.com': ['Forbes', 'C', 'US'], 'axios.com': ['Axios', 'C', 'US'], 'thehill.com': ['The Hill', 'C', 'US'],
  'techcrunch.com': ['TechCrunch', 'C', 'US'], 'arstechnica.com': ['Ars Technica', 'C', 'US'], 'venturebeat.com': ['VentureBeat', 'C', 'US'], 'technologyreview.com': ['MIT Technology Review', 'C', 'US'], 'zdnet.com': ['ZDNET', 'C', 'US'], 'cnet.com': ['CNET', 'C', 'US'], 'engadget.com': ['Engadget', 'C', 'US'], 'theinformation.com': ['The Information', 'C', 'US'], 'semafor.com': ['Semafor', 'C', 'US'], 'ft.com': ['Financial Times', 'C', 'UK'], 'economist.com': ['The Economist', 'C', 'UK'], 'wsj.com': ['The Wall Street Journal', 'C', 'US'], 'nature.com': ['Nature', 'C', 'INT'], 'theregister.com': ['The Register', 'C', 'UK'], 'siliconangle.com': ['SiliconANGLE', 'C', 'US'], 'the-decoder.com': ['The Decoder', 'C', 'INT'], 'fonearena.com': ['FoneArena', 'C', 'IN'], 'marktechpost.com': ['MarkTechPost', 'C', 'US'],
  'livemint.com': ['Mint', 'C', 'IN'], 'economictimes.indiatimes.com': ['The Economic Times', 'C', 'IN'], 'indiatimes.com': ['Times of India', 'C', 'IN'], 'timesofindia.indiatimes.com': ['Times of India', 'C', 'IN'], 'business-standard.com': ['Business Standard', 'C', 'IN'], 'gadgets.ndtv.com': ['NDTV Gadgets', 'C', 'IN'], 'ndtv.com': ['NDTV', 'C', 'IN'], 'moneycontrol.com': ['Moneycontrol', 'C', 'IN'], 'indianexpress.com': ['The Indian Express', 'C', 'IN'], 'hindustantimes.com': ['Hindustan Times', 'C', 'IN'], 'inc42.com': ['Inc42', 'C', 'IN'], 'yourstory.com': ['YourStory', 'C', 'IN'], 'medianama.com': ['MediaNama', 'C', 'IN'],
  'foxnews.com': ['Fox News', 'R', 'US'], 'breitbart.com': ['Breitbart', 'R', 'US'], 'cbsnews.com': ['CBS News', 'C', 'US'], 'thestar.com.my': ['The Star (Malaysia)', 'C', 'MY'], 'foxbusiness.com': ['Fox Business', 'R', 'US'], 'nypost.com': ['New York Post', 'R', 'US'], 'washingtonexaminer.com': ['Washington Examiner', 'R', 'US'], 'reason.com': ['Reason', 'R', 'US'], 'dailycaller.com': ['Daily Caller', 'R', 'US'], 'nationalreview.com': ['National Review', 'R', 'US'], 'washingtontimes.com': ['The Washington Times', 'R', 'US'], 'thefederalist.com': ['The Federalist', 'R', 'US'], 'opindia.com': ['OpIndia', 'R', 'IN'], 'swarajyamag.com': ['Swarajya', 'R', 'IN'],
};
const PRIMARY = /(^|\.)(apache\.org|nginx\.org|f5\.com|openwall\.com|cve\.org|openai\.com|anthropic\.com|claude\.com|blog\.google|deepmind\.google|ai\.google|ai\.meta\.com|about\.fb\.com|microsoft\.com|nvidia\.com|mistral\.ai|x\.ai|huggingface\.co|github\.com|arxiv\.org|sec\.gov|europa\.eu|gov\.in|meity\.gov\.in|whitehouse\.gov|ftc\.gov|nist\.gov|apple\.com|amazon\.science|aboutamazon\.com|1password\.com|cisa\.gov|cisco\.com)$/i;
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
function outletOf(u) {
  const h = hostOf(u); if (!h) return null;
  const parts = h.split('.');
  for (let i = 0; i < parts.length - 1; i++) { const k = parts.slice(i).join('.'); if (OUTLETS[k]) { const [outlet, lean, region] = OUTLETS[k]; return { host: h, outlet, lean, region, primary: false }; } }
  return { host: h, outlet: h, lean: '', region: '', primary: PRIMARY.test(h) };
}
module.exports = { TOPIC_WEIGHT, topicOf, FEEDS, OUTLETS, outletOf, hostOf };
