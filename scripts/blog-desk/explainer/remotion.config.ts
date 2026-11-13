// Remotion settings for the blog explainer videos. Uses the Chromium headless shell that ships in the cloud container; set REMOTION_BROWSER to override.
import { Config } from '@remotion/cli/config';
import fs from 'fs';
const guess = () => { try { const d = '/opt/pw-browsers'; const s = fs.readdirSync(d).find((n) => n.startsWith('chromium_headless_shell')); return s ? `${d}/${s}/chrome-headless-shell-linux64/chrome-headless-shell` : ''; } catch { return ''; } };
const b = process.env.REMOTION_BROWSER || guess();
if (b) Config.setBrowserExecutable(b);
Config.setChromiumOpenGlRenderer('swangle');
