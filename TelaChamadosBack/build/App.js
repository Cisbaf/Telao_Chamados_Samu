"use strict";
/* ScrapSSO 1.0 */
/* Cisbaf - Sistemas de Informação 2024 - ₢ NJ */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const Router_1 = require("./middleware/Router");
const Middleware_1 = require("./middleware/Middleware");
const Socket_1 = require("./services/Socket");
const http_1 = require("http");
const configPuppeteer_1 = require("./controls/configPuppeteer");
const node_process_1 = __importDefault(require("node:process"));
const ErrorLog_1 = require("./utils/ErrorLog");
const pm2 = require('pm2');

// 🔹 Função global para fechar o Puppeteer
async function fecharPuppeteer() {
    if (global.__BROWSER__) {
        try {
            console.log("Fechando navegador Puppeteer...");
            await global.__BROWSER__.close();
        } catch (e) {
            console.log("Erro ao fechar browser:", e.message);
        }
    }
}

class App {
    constructor() {
        this.server = (0, express_1.default)();
        this.httpServer = (0, http_1.createServer)(this.server);
        this.middleware();
        this.router();
        this.listen();
        this.StartConfig();

        // 🔹 Handlers de encerramento
        const process = node_process_1.default;

        process.on('exit', fecharPuppeteer);
        process.on('SIGINT', async () => { await fecharPuppeteer(); process.exit(); });
        process.on('SIGTERM', async () => { await fecharPuppeteer(); process.exit(); });
        process.on('uncaughtException', async (err) => {
            console.error("Erro não tratado:", err);
            await fecharPuppeteer();
            await this.reseteIfError();
            process.exit(1);
        });
        process.on('unhandledRejection', async (reason) => {
            console.error("Promise rejeitada não tratada:", reason);
            await fecharPuppeteer();
            process.exit(1);
        });

        // setInterval(() => { this.reseteIfError(); }, 60000);
        
    }

    async reseteIfError() {
        if (process.env.ENABLE_PM2_RESTART !== '1') {
            console.log('Reinicio PM2 ignorado. Defina ENABLE_PM2_RESTART=1 para ativar.');
            return;
        }
        pm2.connect((err) => {
            if (err) {
                console.error('Erro ao conectar ao PM2:', err.message);
                node_process_1.default.exit(2);
            }

            pm2.restart('MonitoraSamu', (restartErr, proc) => {
                pm2.disconnect();
                if (restartErr) {
                    console.error(`Erro ao reiniciar MonitoraSamu: ${restartErr.message}`);
                    return;
                }
            });
        });
    }

    async StartConfig() {
        try {
            let browser = await (0, configPuppeteer_1.configPuppeteer)();
            await new Socket_1.SocketServer(this.httpServer).PegarEstatistica(browser);
        } catch (err) {
            console.error("Erro no StartConfig:", err);
            await this.reseteIfError();
        }
    }

    middleware() {
        this.server.use(Middleware_1.middleware);
    }

    router() {
        this.server.use(Router_1.router);
    }

    listen() {
        this.httpServer.listen(9080, () => {
            //console.log("Server started");
        });
    }
}

exports.App = App;

