// What we can learn about a sign-in: the network's location from Vercel's headers, the device from its user agent, and what the browser tells us
// (its own location, time zone, language, screen). Nothing here is sent to a third party.
const NAMES = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { return null; } })();
const country = (c) => { try { return c ? (NAMES && NAMES.of(c)) || c : ''; } catch (e) { return c || ''; } };

function parseUA(ua) {
  ua = String(ua || ''); let x, browser = 'Unknown', ver = '', os = 'Unknown', device = 'desktop', model = '';
  if ((x = ua.match(/Edg(?:e|A|iOS)?\/([\d.]+)/))) { browser = 'Edge'; ver = x[1]; }
  else if ((x = ua.match(/OPR\/([\d.]+)/))) { browser = 'Opera'; ver = x[1]; }
  else if ((x = ua.match(/SamsungBrowser\/([\d.]+)/))) { browser = 'Samsung Internet'; ver = x[1]; }
  else if ((x = ua.match(/(?:Chrome|CriOS)\/([\d.]+)/))) { browser = 'Chrome'; ver = x[1]; }
  else if ((x = ua.match(/(?:Firefox|FxiOS)\/([\d.]+)/))) { browser = 'Firefox'; ver = x[1]; }
  else if ((x = ua.match(/Version\/([\d.]+).*Safari/))) { browser = 'Safari'; ver = x[1]; }
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11'; else if ((x = ua.match(/Windows NT ([\d.]+)/))) os = 'Windows ' + x[1];
  else if ((x = ua.match(/Android ([\d.]+)/))) os = 'Android ' + x[1];
  else if ((x = ua.match(/iPhone OS ([\d_]+)/))) os = 'iOS ' + x[1].replace(/_/g, '.');
  else if ((x = ua.match(/iPad.*OS ([\d_]+)/))) os = 'iPadOS ' + x[1].replace(/_/g, '.');
  else if ((x = ua.match(/Mac OS X ([\d_.]+)/))) os = 'macOS ' + x[1].replace(/_/g, '.');
  else if (/CrOS/.test(ua)) os = 'ChromeOS'; else if (/Linux/.test(ua)) os = 'Linux';
  if (/iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = 'tablet'; else if (/Mobi|iPhone/.test(ua)) device = 'phone';
  if ((x = ua.match(/Android [\d.]+; ([^;)]+)/))) model = x[1].trim().replace(/ Build.*/, ''); else if (/iPhone/.test(ua)) model = 'iPhone'; else if (/iPad/.test(ua)) model = 'iPad';
  return { browser, version: String(ver).split('.')[0], os, device, model };
}

function ipGeo(req) {   // Vercel adds these to every request; they are absent when running locally
  const h = (req && req.headers) || {}, dec = (s) => { try { return decodeURIComponent(s || ''); } catch (e) { return s || ''; } };
  const lat = parseFloat(h['x-vercel-ip-latitude']), lon = parseFloat(h['x-vercel-ip-longitude']);
  return { country: h['x-vercel-ip-country'] || '', countryName: country(h['x-vercel-ip-country']), region: dec(h['x-vercel-ip-country-region']), city: dec(h['x-vercel-ip-city']), lat: isNaN(lat) ? null : lat, lon: isNaN(lon) ? null : lon, tz: h['x-vercel-ip-timezone'] || '' };
}
function km(a, b) {
  const r = (d) => d * Math.PI / 180, dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)));
}
const num = (v, lo, hi) => { v = Number(v); return Number.isFinite(v) && v >= lo && v <= hi ? v : null; };
function cleanClient(c) {
  c = c && typeof c === 'object' ? c : {}; const g = c.geo && typeof c.geo === 'object' ? c.geo : {};
  const lat = num(g.lat, -90, 90), lon = num(g.lon, -180, 180);
  return {
    client: { tz: String(c.tz || '').slice(0, 60), lang: String(c.lang || '').slice(0, 40), screen: /^\d{2,5}x\d{2,5}$/.test(c.screen || '') ? c.screen : '', platform: String(c.platform || '').slice(0, 40), standalone: !!c.standalone },
    loc: lat !== null && lon !== null ? { lat, lon, acc: Math.round(num(g.acc, 0, 1e7) || 0) } : null,
  };
}
// everything about one request, ready to store
function collect(req, rawClient) {
  const h = (req && req.headers) || {}, { client, loc } = cleanClient(rawClient), geo = ipGeo(req);
  const dist = loc && geo.lat !== null ? km(loc, geo) : null;
  return { ua: String(h['user-agent'] || '').slice(0, 200), device: parseUA(h['user-agent']), geo, client: { ...client, acceptLang: String(h['accept-language'] || '').split(',')[0].slice(0, 20) }, loc, distanceKm: dist, mismatch: dist !== null && dist > 400, tzMismatch: !!(client.tz && geo.tz && client.tz !== geo.tz) };
}
const place = (g) => [g.city, g.region, g.countryName || g.country].filter(Boolean).join(', ');
module.exports = { parseUA, ipGeo, km, collect, place, cleanClient };
