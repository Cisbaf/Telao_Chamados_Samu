"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fazerLogin = void 0;
const config_1 = require("../config/config");
async function setJavaScriptEnabledIfSupported(page, enabled) {
    await (page === null || page === void 0 ? void 0 : page.setJavaScriptEnabled(enabled).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Nao foi possivel ${enabled ? 'ativar' : 'desativar'} JavaScript nesta sessao: ${message}`);
    }));
}
async function waitForSelectorCompat(page, selector, timeout = 60000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
        const found = await page.evaluate((currentSelector) => Boolean(document.querySelector(currentSelector)), selector).catch(() => false);
        if (found)
            return true;
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return false;
}
async function fillAndClickLogin(page) {
    await page.evaluate(() => {
        const login = document.querySelector("#txtLogin");
        const senha = document.querySelector("#txtSenha");
        const button = document.querySelector("input[name='btnLogin']");
        if (!login || !senha || !button) {
            throw new Error("Campos de login nao encontrados.");
        }
        login.value = "scrapsso";
        login.dispatchEvent(new Event("input", { bubbles: true }));
        login.dispatchEvent(new Event("change", { bubbles: true }));
        senha.value = "!@7890380!@";
        senha.dispatchEvent(new Event("input", { bubbles: true }));
        senha.dispatchEvent(new Event("change", { bubbles: true }));
        button.click();
    });
}
async function fazerLogin(page) {
    var _a;
    await setJavaScriptEnabledIfSupported(page, false);
    //console.log("FAZENDO LOGIN...");
    await ((_a = page) === null || _a === void 0 ? void 0 : _a.goto(config_1.varsEnviroment.PageLogin, { waitUntil: 'load', timeout: 60000 }));
    await fillAndClickLogin(page);
    const btnAtualizar = await waitForSelectorCompat(page, "#btnAtualizar", 4000).catch(() => {
        console.error("Botão de atualizar a página não encontrado!");
        return false;
    });
    if (btnAtualizar)
        await page.evaluate(() => { var _a; return (_a = document.querySelector("#btnAtualizar")) === null || _a === void 0 ? void 0 : _a.click(); });
    const loggedIn = await waitForSelectorCompat(page, "#ctl00_cphBody_lblUsuario", 60000);
    if (!loggedIn) {
        throw "Demorou muito para encontrar o elemento #ctl00_cphBody_lblUsuario após o login. main.ts";
    }
    await setJavaScriptEnabledIfSupported(page, true);
    //console.log("Login realizado.");
}
exports.fazerLogin = fazerLogin;
