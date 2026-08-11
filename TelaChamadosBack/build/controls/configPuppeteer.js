"use strict";
/* ScrapSSO 1.0 */
/* Cisbaf - Sistemas de Informação 2024 - ₢ NJ */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fazerLogin = exports.configPuppeteer = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("../config/config");
const ErrorLog_1 = require("../utils/ErrorLog");
const ObterCookie_1 = require("../services/ObterCookie");
Object.defineProperty(exports, "fazerLogin", { enumerable: true, get: function () { return ObterCookie_1.fazerLogin; } });

function findChromeExecutable() {
    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (envPath && fs_1.default.existsSync(envPath)) {
        return envPath;
    }

    const candidates = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];

    return candidates.find((candidate) => fs_1.default.existsSync(candidate));
}

function findFirefoxExecutable() {
    const envPath = process.env.PUPPETEER_FIREFOX_PATH;
    if (envPath && fs_1.default.existsSync(envPath)) {
        return envPath;
    }

    const candidates = [
        '/usr/bin/firefox-esr',
        '/usr/bin/firefox',
        '/usr/lib/firefox-esr/firefox-esr',
        '/snap/bin/firefox',
        'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
        'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe'
    ];

    return candidates.find((candidate) => fs_1.default.existsSync(candidate));
}

function findBundledPuppeteerExecutable() {
    try {
        return puppeteer_1.default.executablePath();
    }
    catch (_a) {
        return undefined;
    }
}
function envFlag(name, fallback = false) {
    const value = process.env[name];
    if (value === undefined)
        return fallback;
    return ['1', 'true', 'yes', 'sim', 'on'].includes(value.toLowerCase());
}
function envNumber(name) {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
function envString(name, fallback) {
    const value = process.env[name];
    return value && value.trim() ? value.trim() : fallback;
}
function positiveNumber(name, fallback) {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
async function cleanupProfileDir(userDataDir) {
    await fs_1.default.promises.rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
        .catch(() => undefined);
}
async function cleanupOldProfiles(profileRoot) {
    const maxAgeMs = positiveNumber('PUPPETEER_PROFILE_MAX_AGE_MS', 6 * 60 * 60 * 1000);
    const now = Date.now();
    const entries = await fs_1.default.promises.readdir(profileRoot, { withFileTypes: true }).catch(() => []);
    await Promise.all(entries
        .filter((entry) => entry.isDirectory() && (entry.name.startsWith('puppeteer-profile-') || entry.name.startsWith('.org.chromium.Chromium.')))
        .map(async (entry) => {
            const fullPath = node_path_1.default.join(profileRoot, entry.name);
            const stat = await fs_1.default.promises.stat(fullPath).catch(() => undefined);
            if (!stat || now - stat.mtimeMs < maxAgeMs)
                return;
            await cleanupProfileDir(fullPath);
        }));
}

async function configPuppeteer() {
    try {
        //console.log("Configurando...");
        var browser;
        
        const profileRoot = process.env.PUPPETEER_TMP_DIR ||
            node_path_1.default.resolve(process.cwd(), ".puppeteer-profiles");
        fs_1.default.mkdirSync(profileRoot, { recursive: true });
        await cleanupOldProfiles(profileRoot);
        const defaultProfileName = "puppeteer-profile-" + Date.now() + "-" + process.pid;
        const userDataDir = process.platform === "win32" && !config_1.varsEnviroment.production ?
            "C:\\pupperteer-profile" :
            node_path_1.default.join(profileRoot, defaultProfileName);

        const chromePath = findChromeExecutable();
        const firefoxPath = findFirefoxExecutable();
        const bundledPath = findBundledPuppeteerExecutable();
        const debugPort = envNumber('PUPPETEER_REMOTE_DEBUGGING_PORT');
        const browserPreference = envString('PUPPETEER_BROWSER', 'chrome').toLowerCase();
        const launchOptions = {
            headless: !envFlag('PUPPETEER_HEADFUL'),
            userDataDir,
            devtools: envFlag('PUPPETEER_DEVTOOLS'),
            dumpio: envFlag('PUPPETEER_DUMPIO'),
            slowMo: envNumber('PUPPETEER_SLOWMO_MS'),
            env: {
                ...process.env,
                TMPDIR: profileRoot,
                TMP: profileRoot,
                TEMP: profileRoot,
            },
            args: [
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-breakpad',
                '--disable-crash-reporter',
                '--disable-crashpad',
                '--disable-client-side-phishing-detection',
                '--disable-component-extensions-with-background-pages',
                '--disable-component-update',
                '--disable-default-apps',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
                '--disable-gpu',
                '--disable-hang-monitor',
                '--disable-ipc-flooding-protection',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--disable-renderer-backgrounding',
                '--disable-sync',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-default-browser-check',
                '--no-first-run',
                '--password-store=basic',
                '--use-mock-keychain',
            ],
        };
        if (debugPort) {
            const debugAddress = envString('PUPPETEER_REMOTE_DEBUGGING_ADDRESS', '127.0.0.1');
            launchOptions.args.push(`--remote-debugging-port=${debugPort}`, `--remote-debugging-address=${debugAddress}`);
            console.error(`Puppeteer DevTools remoto em http://${debugAddress}:${debugPort}`);
        }

        if (chromePath || bundledPath) {
            launchOptions.executablePath = chromePath || bundledPath;
        }
        else if (firefoxPath) {
            launchOptions.product = 'firefox';
            launchOptions.executablePath = firefoxPath;
            launchOptions.args = ['-headless'];
        }
        else {
            throw new Error('Nenhum executável Chrome/Chromium/Firefox encontrado. Instale um navegador ou defina PUPPETEER_EXECUTABLE_PATH / PUPPETEER_FIREFOX_PATH.');
        }

        if (!(firefoxPath && !chromePath && !bundledPath)) {
            launchOptions.args.push('--no-sandbox', '--disable-setuid-sandbox');
        }

        console.error(`Puppeteer executavel: ${launchOptions.executablePath || 'padrao do puppeteer'}`);
        if (browserPreference === 'firefox') {
            if (!firefoxPath) {
                throw new Error('Firefox nao encontrado para PUPPETEER_BROWSER=firefox.');
            }
            console.error(`Iniciando Firefox por preferencia: ${firefoxPath}`);
            browser = await puppeteer_1.default.launch({
                product: 'firefox',
                executablePath: firefoxPath,
                headless: !envFlag('PUPPETEER_HEADFUL'),
                userDataDir: node_path_1.default.join(profileRoot, defaultProfileName + "-firefox"),
                dumpio: envFlag('PUPPETEER_DUMPIO'),
                args: envFlag('PUPPETEER_HEADFUL') ? [] : ['-headless'],
            });
            console.error(`Puppeteer iniciado. WebSocket endpoint: ${browser.wsEndpoint()}`);
            global.__BROWSER__ = browser;
            return browser;
        }
        try {
            browser = await puppeteer_1.default.launch(launchOptions);
        }
        catch (launchErr) {
            console.error("Falha ao iniciar Chromium com flags otimizadas:", launchErr);
            await cleanupProfileDir(userDataDir);
            const fallbackOptions = {
                ...launchOptions,
                args: ['--disable-dev-shm-usage', '--disable-crash-reporter', '--disable-crashpad', '--disable-breakpad', '--no-sandbox', '--disable-setuid-sandbox'],
                dumpio: true,
            };
            if (debugPort) {
                const debugAddress = envString('PUPPETEER_REMOTE_DEBUGGING_ADDRESS', '127.0.0.1');
                fallbackOptions.args.push(`--remote-debugging-port=${debugPort}`, `--remote-debugging-address=${debugAddress}`);
            }
            console.error("Tentando iniciar Chromium com flags minimas...");
            try {
                browser = await puppeteer_1.default.launch(fallbackOptions);
            }
            catch (fallbackErr) {
                await cleanupProfileDir(userDataDir);
                if (firefoxPath) {
                    const firefoxProfileDir = node_path_1.default.join(profileRoot, defaultProfileName + "-firefox");
                    console.error("Falha ao iniciar Chromium com flags minimas:", fallbackErr);
                    console.error(`Tentando iniciar Firefox como fallback: ${firefoxPath}`);
                    try {
                        browser = await puppeteer_1.default.launch({
                            product: 'firefox',
                            executablePath: firefoxPath,
                            headless: !envFlag('PUPPETEER_HEADFUL'),
                            userDataDir: firefoxProfileDir,
                            dumpio: true,
                            args: ['-headless'],
                        });
                    }
                    catch (firefoxErr) {
                        await cleanupProfileDir(firefoxProfileDir);
                        throw firefoxErr;
                    }
                }
                else {
                    throw fallbackErr;
                }
            }
        }
        console.error(`Puppeteer iniciado. WebSocket endpoint: ${browser.wsEndpoint()}`);
        browser.on("disconnected", () => {
            setTimeout(() => {
                fs_1.default.promises.rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
                    .catch(() => undefined);
            }, 1000);
        });
        global.__BROWSER__ = browser;
        
        return browser;
    }
    catch (err) {
        (0, ErrorLog_1.newLog)("Problema ao tentar fazer o login no Sistema: " + err);
        console.error("Problema ao tentar fazer o login no Sistema: " + err);
        throw err;
    }
}
exports.configPuppeteer = configPuppeteer;
