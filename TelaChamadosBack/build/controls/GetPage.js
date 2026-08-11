"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PegarPageComDataSSO = void 0;
const puppeter = require("puppeteer");
const process = require("node:process");
let browser;
let page;
(async () => {
    browser = await puppeter.launch({ headless: false, args: ['--disable-dev-shm-usage'], protocolTimeout: 300000 });
    page = await browser.newPage();
})();
const url = 'http://192.168.1.252/SSONovaIguacu/_Sistema/ConsultaRegulacao.aspx';
// Headers da requisição
const headers = {
    'Host': '192.168.1.252',
    'Cookie': 'ASP.NET_SessionId=1koabuwr0ac5nrebr5wq1plm; IDCidade=6994; IDEstabelecimento=0; IDUsuario=1183; NomeUsuario=NILTON DOS SANTOS JUNIOR; NivelUsuario=4; Ramal=; IdAgente=; TrAcesso=6994118320240722 10:32:07; AutoCookie=9B71D81D9AF04F08CA7A59CFC4F6D8DEF1E1A02485AE1C41E5A7945525654296179CD2D5499648DFB9AE472F0088A28C58795349128B364511EBFFB96602D32C89F959F754D2000C6FFC4DBCAB0DDF6E9D010F85C7F3C5E0E1B546D5484EA3647C07C50503AED838367699722B49B45E1E86067D2F3240D727ABDB25775650CE',
    'Referer': 'http://192.168.1.252//SSONOVAIGUACU/Login.aspx',
    'Accept-Language': 'pt-BR',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.127 Safari/537.36',
    'Connection': 'keep-alive'
};
// Configuração da requisição
const options = {
    method: 'GET',
    headers: headers,
    keepalive: true,
};
async function PegarPageComDataSSO() {
    return new Promise(async (resolve) => {
        try {
            await fetch(url, options)
                .then(response => {
                if (!response.ok)
                    throw new Error(`HTTP error! Status: ${response.status}`);
                return response.text();
            })
                .then(async (data) => {
                await page.evaluate((data) => {
                    document.body.innerHTML = data;
                }, data).catch(async () => {
                    throw "Ocorreu um erro inesperado na pagina ao tentar mudar o innerHTML vamos recarregar";
                });
                await page.waitForSelector("#ctl00_cphBody_lblUsuario", { timeout: 10000 }).catch(async () => {
                    throw "Ocorreu um erro ao tentar achar o lblUsuario vamos recarregar";
                });
                resolve(page);
            })
                .catch(err => {
                throw new Error(err);
            });
        }
        catch (err) {
            //console.log(`Erro ${err} ocorrido no método PegarPageComDataSSO no arquivo GetPage.js. \n
            //    O programa foi finalizado.`);
            process.exit();
        }
    });
}
exports.PegarPageComDataSSO = PegarPageComDataSSO;
