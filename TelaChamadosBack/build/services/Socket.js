"use strict";
/* ScrapSSO 1.0 */
/* Cisbaf - Sistemas de Informação 2024 - ₢ NJ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const socket_io_1 = require("socket.io");
const GetStatistic_1 = require("../services/GetStatistic");
const pm2 = require('pm2');
const config_1 = require("../config/config");
const ObterCookie_1 = require("../services/ObterCookie");

function positiveNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
const SCRAP_SOCKET_INTERVAL_MS = positiveNumber(process.env.SCRAP_SOCKET_INTERVAL_MS, 30000);

class SocketServer {
    constructor(server) {
        this.io = new socket_io_1.Server(server);
        this.io.on("connection", async (socket) => {
            this.io.emit("NovaEstatistica", this.Relatorio ? this.Relatorio : "");
            const intervalId = setInterval(() => {
                if (this.Relatorio)
                    this.io.emit("NovaEstatistica", this.Relatorio);
            }, 1000);
            socket.on("disconnect", () => clearInterval(intervalId));
            if (!SocketServer.update) {
                this.io.emit("update", "window.location.reload()");
                SocketServer.update = true;
            }
        });
    }
async PegarEstatistica(browser) {
        let page = null;
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        const abrirPaginaLogada = async () => {
            if (page) {
                await page.close().catch(() => undefined);
            }
            page = await browser.newPage();
            await (0, ObterCookie_1.fazerLogin)(page);
            return page;
        };
        await abrirPaginaLogada();
        while (true) {
            const cycleStartedAt = Date.now();
            try {
                await page.goto(config_1.varsEnviroment.PageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
                this.Relatorio = await GetStatistic_1.GetStatistic.pegarDados(page);
                console.error(`Scrap Socket atualizado em ${new Date().toISOString()}`);
                await delay(Math.max(0, SCRAP_SOCKET_INTERVAL_MS - (Date.now() - cycleStartedAt)));
            } catch (err) {
                console.error("O método PegarEstatistica deu erro e vai tentar novamente: " + err);
                await delay(Math.min(SCRAP_SOCKET_INTERVAL_MS, 5000));
                try {
                    await abrirPaginaLogada();
                }
                catch (loginErr) {
                    console.error("Falha ao recriar pagina/logar novamente: " + loginErr);
                    await delay(Math.min(SCRAP_SOCKET_INTERVAL_MS, 5000));
                }
            }
        }
    }

}
exports.SocketServer = SocketServer;
SocketServer.update = false;
SocketServer.erros = 0;
