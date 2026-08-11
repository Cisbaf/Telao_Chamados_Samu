"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVeiclesInfo = void 0;
const config_1 = require("../config/config");

async function getVeiclesInfo(page) {
    try {
        await page.waitForSelector(config_1.varsSSO.listaVeiculos, {
            visible: true,
            timeout: 30000
        });

        var result = await page.evaluate(async (varsSSO) => {
            return new Promise((resolve, reject) => {
                const tabelaVeiculos = document.querySelectorAll(varsSSO.listaVeiculos);
                
                if (!tabelaVeiculos || tabelaVeiculos.length === 0) {
                    return reject("Erro pegar os elementos com querySelectorAll para retornar tabelaVeiculos: tabelaVeiculos.length igual a 0.");
                }

                var ListaVeiculos = [];
                var municipioAtual = "";
                var _status = "";
                var viaturas = [];
                var ultimoAtendimento = "";
                var tituloElemento = "";

                // Estatistica Geral para o municipio especifico
                var TotalviaturasBaixadas = 0;
                var TotalviaturasEmpenhadas = 0;
                var TotalviaturasAtivas = 0;
                var TotalviaturasAcaoTemporaria = 0;

                for (var i = 0; i < tabelaVeiculos.length; i++) {
                    var textoLinha = tabelaVeiculos[i].innerText.trim();

                    // Verifica se a linha é um município
                    if (varsSSO.listaMunicipiosPercorrer.includes(textoLinha)) {
                        if (municipioAtual) {
                            const EstatisticaGeral = {
                                TotalviaturasBaixadas: TotalviaturasBaixadas,
                                TotalviaturasEmpenhadas: TotalviaturasEmpenhadas,
                                TotalviaturasAtivas: TotalviaturasAtivas,
                                TotalviaturasAcaoTemporaria: TotalviaturasAcaoTemporaria
                            };
                            ListaVeiculos.push({ municipio: municipioAtual, viaturas: viaturas, EstatisticaGeral: EstatisticaGeral });

                            // RESET OBJECT ESTATISTICA GERAL
                            TotalviaturasBaixadas = 0;
                            TotalviaturasEmpenhadas = 0;
                            TotalviaturasAtivas = 0;
                            TotalviaturasAcaoTemporaria = 0;
                        }

                        // Atualiza o município atual e reinicia os detalhes
                        municipioAtual = textoLinha;
                        _status = "";
                        viaturas = [];
                        tituloElemento = "";
                    } else {
                        // Captura o título do span associado à viatura
                        var span = tabelaVeiculos[i].querySelector('span');
                        if (span && span.title) {
                            const tituloLimpo = span.title.substring(0, 5).replace("-", "").trim();
                            if (tituloLimpo === "Baixa") {
                                _status = "Baixada";
                                TotalviaturasBaixadas++;
                            } else if (tituloLimpo === "Empen") {
                                _status = "Empenhada";
                                TotalviaturasEmpenhadas++;
                            } else if (tituloLimpo === "Ativa") {
                                _status = "Ativa";
                                TotalviaturasAtivas++;
                            } else if (tituloLimpo === "Ação") {
                                _status = "Ação temporária";
                                TotalviaturasAcaoTemporaria++;
                                tituloElemento = span.title;
                            }

                            const regex = /Último atendimento: (\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/;
                            const match = span.title.match(regex);
                            if (match) {
                                ultimoAtendimento = match[0];
                            }
                        }
                        viaturas.push({
                            nome: textoLinha.trim(),
                            status: _status,
                            ultimoAtendimento: ultimoAtendimento,
                            tituloElemento: tituloElemento
                        });
                    }
                }

                if (municipioAtual !== "") {
                    const EstatisticaGeral = {
                        TotalviaturasBaixadas: TotalviaturasBaixadas,
                        TotalviaturasEmpenhadas: TotalviaturasEmpenhadas,
                        TotalviaturasAtivas: TotalviaturasAtivas,
                        TotalviaturasAcaoTemporaria: TotalviaturasAcaoTemporaria
                    };
                    ListaVeiculos.push({ municipio: municipioAtual, viaturas: viaturas, EstatisticaGeral: EstatisticaGeral });
                }

                resolve(ListaVeiculos);
            });
        }, config_1.varsSSO);

        return result;
    } catch (err) {
        throw new Error(`Falha em getVeiclesInfo: ${err.message || err}`);
    }
}
exports.getVeiclesInfo = getVeiclesInfo;