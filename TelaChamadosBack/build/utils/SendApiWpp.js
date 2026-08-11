"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnviarMensagemWpp = void 0;
const axios = require("axios");
var erro = 0;
var MensagemErroEnviada = false;
async function EnviarMensagemWpp(err) {
    if (!MensagemErroEnviada) {
        axios.post('http://192.168.1.10:8004/notification/wpp', {
            number: '21968612660',
            message: err.toString("UTF-8"),
        }, {
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            }
        })
            .then(response => {
            erro = 0;
            MensagemErroEnviada = true;
            return;
        })
            .catch(async (error) => {
            erro++;
            if (erro < 3) {
                await new Promise((resolve) => {
                    setTimeout(resolve, 60000);
                }).then(async () => {
                    await EnviarMensagemWpp(err);
                    return;
                });
            }
            else {
                erro = 0;
                return;
            }
        });
    }
}
exports.EnviarMensagemWpp = EnviarMensagemWpp;
