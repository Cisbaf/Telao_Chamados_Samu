const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function findChromeExecutable() {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try { return puppeteer.executablePath(); } catch (e) { return undefined; }
}

async function tryLaunch(options, label) {
  console.log(`\n--- Trying: ${label} ---`);
  console.log('Options:', options);
  try {
    const browser = await puppeteer.launch(options);
    console.log('Launched browser PID:', browser.process() ? browser.process().pid : 'no-process');
    await browser.close();
    console.log('Closed successfully');
    return { ok: true };
  } catch (err) {
    console.error('Launch error:', err);
    return { ok: false, err };
  }
}

(async () => {
  const execPath = findChromeExecutable();
  console.log('Detected execPath:', execPath);

  const baseArgs = ['--disable-dev-shm-usage'];

  const attempts = [
    { headless: true, dumpio: true, args: baseArgs, executablePath: execPath },
    { headless: true, dumpio: true, args: baseArgs.concat(['--no-sandbox','--disable-setuid-sandbox']), executablePath: execPath },
    { headless: false, dumpio: true, args: baseArgs.concat(['--no-sandbox','--disable-setuid-sandbox']), executablePath: execPath },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const opt = Object.assign({}, attempts[i]);
    // remove undefined executablePath
    if (!opt.executablePath) delete opt.executablePath;
    await tryLaunch(opt, `attempt-${i+1}`);
  }

  console.log('\nDone diagnostics.');
})();
