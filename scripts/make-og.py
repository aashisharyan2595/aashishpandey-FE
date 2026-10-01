#!/usr/bin/env python3
"""Generates the per-page Open Graph images (1200x630) into assets/og/.
Uses scripts/logo-mark.png for the corner mark. Run locally (needs Pillow and macOS system fonts): python3 scripts/make-og.py
Edit the ITEMS list to add or change a card. Not part of the Vercel build."""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG, CREAM, AMBER, MUTED = (11, 15, 36), (255, 246, 234), (245, 184, 103), (154, 146, 127)
HN, MENLO, GEO_B, GEO_I = '/System/Library/Fonts/HelveticaNeue.ttc', '/System/Library/Fonts/Menlo.ttc', '/System/Library/Fonts/Supplemental/Georgia Bold.ttf', '/System/Library/Fonts/Supplemental/Georgia Italic.ttf'
LOGO = Image.open(os.path.join(os.path.dirname(__file__), 'logo-mark.png')).convert('RGBA').resize((64, 64), Image.LANCZOS)
out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'og')
os.makedirs(out, exist_ok=True)

def hn(size, idx=1): return ImageFont.truetype(HN, size, index=idx)
def mono(size): return ImageFont.truetype(MENLO, size)

def wrap(d, text, font, maxw):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def card(name, kind, big, sub, foot=None, roles=(), big_size=150):
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    for x in range(14, W, 28):
        for y in range(14, H, 28): d.point((x, y), fill=(34, 36, 56))
    im.paste(LOGO, (64, 56), LOGO)
    d.text((148, 88), 'Aashish Pandey', font=hn(30, 10), fill=CREAM, anchor='lm')
    d.text((W - 64, 88), kind.upper(), font=mono(20), fill=AMBER, anchor='rm')
    size = big_size
    f = hn(size, 1)
    while d.textlength(big, font=f) > W - 128 and size > 60: size -= 6; f = hn(size, 1)
    y = 200 if foot else 230
    d.text((64, y), big, font=f, fill=CREAM)
    y += size + 24
    for line in wrap(d, sub, hn(34, 0), W - 128)[:2]:
        d.text((64, y), line, font=hn(34, 0), fill=(207, 198, 182)); y += 46
    if foot: d.text((64, H - 162), foot, font=ImageFont.truetype(GEO_I, 44), fill=AMBER)
    x = 64
    for r in roles:
        tw = d.textlength(r, font=mono(20)) + 36
        d.rounded_rectangle((x, H - 76, x + tw, H - 36), 20, outline=(120, 108, 84), width=2)
        d.text((x + 18, H - 56), r, font=mono(20), fill=CREAM, anchor='lm'); x += tw + 12
    d.text((W - 64, H - 56), 'aashishpandey.com', font=mono(20), fill=MUTED, anchor='rm')
    im.save(os.path.join(out, name + '.jpg'), quality=88, optimize=True)

CASE = 'Case study'
TOOL = 'Free tool · no sign-up'
SVC = 'Service'
ITEMS = [
    ('liquid-iv', CASE, '15 markets', 'Shopify rollout with 9 new EU markets live in H1 2026', 'Liquid I.V. · Unilever', ('PM', 'SEO'), 170),
    ('talenti', CASE, '20 days', 'A Canadian website, live before the physical launch', 'Talenti · The Magnum Ice Cream Company', ('PM', 'UI'), 170),
    ('storynest', CASE, '100K → 400K', 'Users, while I ran delivery and the SEO plan', 'StoryNest · Feb – Sep 2024', ('PM', 'SEO'), 150),
    ('ceat-specialty', CASE, 'Zero downtime', 'AEM 6.5 vendor handover across eight workstreams', 'CEAT Specialty · CEAT Ltd', ('PM', 'DEV', 'SEO'), 130),
    ('case-studies', CASE, '4 programs', 'Liquid I.V. · Talenti · StoryNest · CEAT Specialty', None, (), 150),
    ('tools', TOOL, 'Small tools', 'Notepad, URL shortener, image resizer and more', None, (), 150),
    ('tool-pad', TOOL, 'Online Notepad', 'Markdown preview, autosave and read-only share links', None, (), 120),
    ('tool-url-shortener', TOOL, 'URL Shortener', 'Custom alias, expiry date and a QR code', None, (), 120),
    ('tool-image-resizer', TOOL, 'Image Resizer', 'Resize and convert to WebP, JPEG, PNG or AVIF', None, (), 120),
    ('tool-qr', TOOL, 'QR Code Generator', 'Static codes that never expire. PNG or SVG.', None, (), 110),
    ('tool-qr-check', TOOL, 'QR Code Autopsy', 'Is your QR code dynamic or static? Find out.', None, (), 110),
    ('tool-lorem', TOOL, 'Lorem Ipsum', 'Placeholder text as plain text, HTML or Markdown', None, (), 120),
    ('tool-exif', TOOL, 'Photo Metadata', 'See and remove GPS, camera and EXIF data. Nothing uploads.', None, (), 120),
    ('tool-hash', TOOL, 'File Hash Checker', 'MD5, SHA-1, SHA-256 and SHA-512, verified on your device', None, (), 110),
    ('tool-password', TOOL, 'Password Generator', 'Random passwords made in your browser, never sent anywhere', None, (), 110),
    ('tool-timezone', TOOL, 'Meeting Planner', 'Find a time that works across time zones', None, (), 120),
    ('tool-checklist', TOOL, 'Launch Checklists', 'Websites, campaigns, products and events', None, (), 110),
    ('services', SVC, 'Services', 'Development, UI, SEO and tech consulting', None, ('PM', 'DEV', 'UI', 'SEO'), 170),
    ('svc-shopify', SVC, 'Shopify developer', 'And the project manager who ships it. Bangalore.', None, ('PM', 'DEV', 'SEO'), 110),
    ('svc-full-stack', SVC, 'Full-stack developer', 'CMS, eCommerce and CI/CD, with delivery built in.', None, ('PM', 'DEV'), 110),
    ('svc-wordpress-webflow', SVC, 'WordPress & Webflow', 'Sites, plugins and the project around them.', None, ('DEV', 'PM', 'SEO'), 110),
    ('svc-seo', SVC, 'SEO consultant', 'Technical, multi-market and AI-search SEO.', None, ('SEO', 'PM'), 120),
    ('svc-ui-ux', SVC, 'UI and UX design', 'Design that ships inside a launch.', None, ('UI', 'PM'), 120),
    ('svc-tech', SVC, 'Tech consultant', 'Solution architecture and vendor handovers.', None, ('DEV', 'PM'), 120),
]
for name, kind, big, sub, foot, roles, size in ITEMS:
    card('og-' + name, kind, big, sub, foot, roles, size)

def default_card():
    """The site-wide share image, built from the clean (blank-plate) ride artwork. Never use an older photo here."""
    from PIL import ImageOps
    src = Image.open(os.path.join(os.path.dirname(__file__), '..', 'assets', 'me-ride.webp')).convert('RGB')
    im = ImageOps.fit(src, (W, H), Image.LANCZOS, centering=(0.5, 0.42))
    shade = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shade)
    for y in range(H // 2, H):
        sd.line((0, y, W, y), fill=(6, 9, 24, int(200 * ((y - H // 2) / (H / 2)) ** 1.6)))
    im = Image.alpha_composite(im.convert('RGBA'), shade).convert('RGB')
    d = ImageDraw.Draw(im)
    d.text((64, H - 118), 'Aashish Pandey', font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Georgia.ttf', 66), fill=CREAM, anchor='ls')
    d.text((66, H - 62), 'PROJECT MANAGER · CREATIVE TECHNOLOGIST · BANGALORE', font=mono(21), fill=AMBER, anchor='ls')
    im.save(os.path.join(out, '..', 'og-image.jpg'), quality=88, optimize=True)

default_card()
print('wrote', len(ITEMS), 'images to', os.path.normpath(out))
