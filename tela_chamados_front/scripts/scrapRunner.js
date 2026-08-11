const path = require('path');
const fs = require('fs');

const buildRootCandidates = [
  process.env.SCRAP_BACKEND_BUILD_DIR,
  path.resolve(__dirname, '../../TelaChamadosBack/build'),
  path.resolve(__dirname, '../../build'),
  '/app/build',
].filter(Boolean);

const buildRoot = buildRootCandidates.find((candidate) =>
  fs.existsSync(path.join(candidate, 'controls/configPuppeteer.js'))
);

if (!buildRoot) {
  throw new Error(`Build do backend nao encontrado. Caminhos testados: ${buildRootCandidates.join(', ')}`);
}

const { configPuppeteer } = require(path.join(buildRoot, 'controls/configPuppeteer.js'));
const { fazerLogin } = require(path.join(buildRoot, 'services/ObterCookie.js'));
const { GetStatistic } = require(path.join(buildRoot, 'services/GetStatistic.js'));
const { varsEnviroment } = require(path.join(buildRoot, 'config/config.js'));

const BLOCKED_RESOURCE_TYPES = new Set(['image', 'font', 'media']);
const SCRAP_RUNNER_TIMEOUT_MS = positiveNumber(process.env.SCRAP_RUNNER_TIMEOUT_MS, 120000);

let activeBrowser = null;
let activePage = null;

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function reducePageLoad(page) {
  await page.setCacheEnabled(false).catch(() => undefined);
  await page.setRequestInterception(true).catch(() => undefined);

  page.on('request', (request) => {
    if (BLOCKED_RESOURCE_TYPES.has(request.resourceType())) {
      request.abort().catch(() => undefined);
      return;
    }

    request.continue().catch(() => undefined);
  });
}

async function closeBrowser() {
  if (activePage) {
    await activePage.close().catch(() => undefined);
    activePage = null;
  }

  if (activeBrowser) {
    await activeBrowser.close().catch(() => undefined);
    activeBrowser = null;
  }
}

async function shutdownAfterSignal() {
  await closeBrowser();
  process.exit(1);
}

process.once('SIGTERM', shutdownAfterSignal);
process.once('SIGINT', shutdownAfterSignal);

async function runScrap() {
  const watchdog = setTimeout(() => {
    console.error(`Tempo limite do scrap excedido (${SCRAP_RUNNER_TIMEOUT_MS}ms). Encerrando Chromium.`);
    void shutdownAfterSignal();
  }, SCRAP_RUNNER_TIMEOUT_MS);

  try {
    activeBrowser = await configPuppeteer();
    activePage = await activeBrowser.newPage();
    await reducePageLoad(activePage);
    await fazerLogin(activePage);
    await activePage.goto(varsEnviroment.PageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const relatorio = await GetStatistic.pegarDados(activePage);
    console.log(JSON.stringify(relatorio));
  } catch (err) {
    console.error(err instanceof Error ? err.stack || err.message : String(err));
    process.exitCode = 1;
  } finally {
    clearTimeout(watchdog);
    await closeBrowser();
  }
}

runScrap();
