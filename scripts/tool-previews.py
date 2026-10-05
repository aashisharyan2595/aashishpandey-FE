#!/usr/bin/env python3
"""Rebuilds the pictures on the Tools hub (assets/tools/*.webp) from the real tool pages.
Run after a tool's screen changes:  python3 scripts/tool-previews.py
Needs Google Chrome (macOS path below) and Pillow. It serves a scratch copy of the site with the cookie banner switched off,
screenshots each tool at 1280x1000, then crops the tool panel (1140x570) and saves it as a 720x360 WebP.
The crop heights (y) were set by eye; adjust them here if a page layout moves."""
import os, shutil, subprocess, sys, tempfile, time
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
PORT = 8811
# output name: (page file, crop top in px)
PAGES = {'checklist': ('Tools-Checklist', 340), 'estimate': ('Tools-Estimate', 420), 'exif': ('Tools-Exif', 410), 'hash': ('Tools-Hash', 375),
         'image': ('Tools-Image', 345), 'invoice': ('Tools-Invoice', 330), 'lorem': ('Tools-Lorem', 340), 'password': ('Tools-Password', 360),
         'qr-check': ('Tools-QR-Check', 330), 'qr': ('Tools-QR', 330), 'shortener': ('Tools-Shortener', 340), 'timezone': ('Tools-Timezone', 420),
         'resume': ('Tools-Resume-Build', 215)}
tmp = tempfile.mkdtemp(); site = os.path.join(tmp, 'site')
shutil.copytree(ROOT, site, ignore=shutil.ignore_patterns('node_modules', '.git', 'graphify-out'))
js = open(os.path.join(site, 'site.js')).read(); i = js.index('function getConsent()'); j = js.index('\n', i)
open(os.path.join(site, 'site.js'), 'w').write(js[:i] + 'function getConsent() { return { v: 1, a: false, t: 1 }; }' + js[j:])
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=site, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
try:
    def shot(page, h=1000):
        out = os.path.join(tmp, page + '.png')
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size=1280,{h}', '--virtual-time-budget=9000', f'--screenshot={out}', f'http://127.0.0.1:{PORT}/{page}.dc.html'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return Image.open(out).convert('RGB')
    os.makedirs(os.path.join(ROOT, 'assets/tools'), exist_ok=True)
    for name, (page, y) in PAGES.items():
        shot(page).crop((70, y, 1210, y + 570)).resize((720, 360), Image.LANCZOS).save(os.path.join(ROOT, f'assets/tools/{name}.webp'), 'WEBP', quality=80, method=6)
    pad = shot('Tools-Pad-v2')   # the notepad is a full-screen app: take the top of the window
    pad.crop((0, 0, 1280, 640)).resize((720, 360), Image.LANCZOS).save(os.path.join(ROOT, 'assets/tools/pad.webp'), 'WEBP', quality=80, method=6)
    pad.crop((0, 0, 1280, 800)).resize((1000, 625), Image.LANCZOS).save(os.path.join(ROOT, 'assets/tools/pad-wide.webp'), 'WEBP', quality=82, method=6)
    print('done:', len(os.listdir(os.path.join(ROOT, 'assets/tools'))), 'files')
finally:
    srv.terminate(); shutil.rmtree(tmp, ignore_errors=True)
