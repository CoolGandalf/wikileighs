// Guard against UTC-runner date drift on the constellation homepage.
// The old homepage rendered "Today, {label}"; the redesign renders a
// status-line flag ("today ✓" when journal/today/<NY stamp>.md exists,
// "today —" otherwise) computed via getTodayPage(new Date()), which is
// New-York-anchored. Assert the flag matches the vault's actual state for
// the current NY day — a UTC-shifted build would look up the wrong day's
// file and flip the flag.
import fs from 'node:fs';
import path from 'node:path';

const zone = 'America/New_York';
const stamp = new Date().toLocaleDateString('en-CA', { timeZone: zone });

const html = fs.readFileSync(path.resolve('dist/index.html'), 'utf8');
const hasCheck = html.includes('today ✓');
const hasDash = html.includes('today —');
if (!hasCheck && !hasDash) {
  throw new Error('Homepage is missing the "today ✓/—" status flag');
}

// Fail closed: every legitimate invocation (local + deploy.yml) sets
// VAULT_ROOT. Without it the drift check cannot run, and a presence-only
// pass would be a silent exit-0 degrade.
const vaultRoot = process.env.VAULT_ROOT;
const todayDir = vaultRoot ? path.join(vaultRoot, 'journal', 'today') : null;
if (!todayDir || !fs.existsSync(todayDir)) {
  throw new Error('VAULT_ROOT not set/invalid — today-drift check cannot run; refusing to pass silently');
}
const todayFileExists = fs.existsSync(path.join(todayDir, `${stamp}.md`));
if (todayFileExists && !hasCheck) {
  throw new Error(`Homepage shows "today —" but journal/today/${stamp}.md exists — NY date drift?`);
}
if (!todayFileExists && !hasDash) {
  throw new Error(`Homepage shows "today ✓" but journal/today/${stamp}.md does not exist — NY date drift?`);
}
if (todayFileExists) {
  const archive = path.resolve('dist', 'today', stamp, 'index.html');
  if (!fs.existsSync(archive)) throw new Error(`Current-day archive was not built: ${archive}`);
}

console.log(`Today flag check passed: ${hasCheck ? '✓' : '—'} for ${stamp}`);
