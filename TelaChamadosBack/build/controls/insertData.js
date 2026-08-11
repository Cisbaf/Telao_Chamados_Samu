"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertLogin = void 0;
const config_1 = require("../config/config");
async function insertLogin(page) {
    //Aguarde verificacao
    try {
        return await page.evaluate((varsEnviroment) => {
            //const url = window.location.href.substring(0,57);
            //if(url == varsEnviroment.PageUrl){
            const nameLogin = document.getElementById(varsEnviroment.ElementInputLoginEntrada);
            const password = document.getElementById(varsEnviroment.ElementInputPasswordEntrada);
            if (nameLogin != null)
                nameLogin.value = varsEnviroment.InputUserToLogin;
            if (password != null)
                password.value = varsEnviroment.InputLoginPassword;
            //}       
        }, config_1.varsEnviroment);
    }
    catch (err) {
        throw "Ocorreu um erro ao tentar fazer o login na pagina - method: inserLogin file: insertData.ts  " + err.message;
    }
}
exports.insertLogin = insertLogin;
