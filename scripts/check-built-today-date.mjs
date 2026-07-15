import fs from 'node:fs';
import path from 'node:path';

const zone = 'America/New_York';
const now = new Date();
const stamp = now.toLocaleDateString('en-CA', { timeZone: zone });
const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: zone,
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
}).formatToParts(now);
const value = (type) => parts.find((part) => part.type === type)?.value ?? '';
const label = `${value('weekday')} ${value('month')} ${value('day')} ${value('year')}`;

const html = fs.readFileSync(path.resolve('dist/index.html'), 'utf8');
if (!html.includes(`Today, ${label}`)) {
  throw new Error(`Homepage date mismatch: expected "Today, ${label}" for ${stamp}`);
}

const vaultRoot = process.env.VAULT_ROOT;
if (vaultRoot && fs.existsSync(path.join(vaultRoot, 'journal', 'today', `${stamp}.md`))) {
  const href = `/wikileighs/today/${stamp}`;
  if (!html.includes(href)) throw new Error(`Homepage is missing current-day link ${href}`);
  const archive = path.resolve('dist', 'today', stamp, 'index.html');
  if (!fs.existsSync(archive)) throw new Error(`Current-day archive was not built: ${archive}`);
}

console.log(`Today date check passed: ${label} → ${stamp}`);
