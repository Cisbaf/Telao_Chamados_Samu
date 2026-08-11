"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOccurrenceCriticalPatient = void 0;
const config_1 = require("../config/config");
async function getOccurrenceCriticalPatient(page) {
    try {
        var result = await page.evaluate(async (varsSSO) => {
            return new Promise((resolve, reject) => {
                var listOfOccurrences = [];
                const newObjectOccurrence = {
                    prioridadeOcorrencia: "",
                    textoPrioridadeViatura: "",
                    cidadeOcorrencia: "",
                    bairroOcorrencia: "",
                    pacienteOcorrencia: "",
                    pacienteIdadeOcorrencia: "",
                    motivoHD: "",
                    numeroChamado: "",
                    dataOcorrencia: "",
                    hchOcorrencia: "",
                };
                //LISTA OCORRENCIAS PACIENTE CRITICO
                var lista = document.querySelectorAll(varsSSO.listaOcorrenciasPacienteCritico);
                for (var i = 0; i <= lista.length; i++) {
                    const ItemParaChecarSeExiste = document.querySelector(`#ctl00_cphBody_GridViewVZ > tbody > tr:nth-child(${i}) > td.gridPrioridade`);
                    if (ItemParaChecarSeExiste && ItemParaChecarSeExiste != "") {
                        let currentElement = (i).toString().padStart(2, '0');
                        var newOcorrencia = Object.create(newObjectOccurrence);
                        ////console.log(` ELEMENTO PEGO  #ctl00_cphBody_gvVTRCampinas_ctl${currentElement}_lblDescBairro`)
                        try {
                            // Tenta obter a prioridadeOcorrencia a partir do atributo "title" do elemento img                           
                            let imgElement = document.querySelector(`#ctl00_cphBody_GridViewVZ > tbody > tr:nth-child(${i}) > td.gridPrioridade > img`);
                            if (imgElement) {
                                newOcorrencia.prioridadeOcorrencia = imgElement.getAttribute("title").substring(0, 9).replace("-", "").trim();
                            }
                            else {
                                // Se não houver img, tenta obter a prioridadeOcorrencia a partir do innerText do elemento td
                                let tdElement = document.querySelector(`#ctl00_cphBody_GridViewVZ > tbody > tr:nth-child(${i}) > td.gridPrioridade`);
                                if (tdElement) {
                                    newOcorrencia.prioridadeOcorrencia = tdElement.innerText;
                                }
                                else {
                                    newOcorrencia.prioridadeOcorrencia = null;
                                }
                            }
                        }
                        catch (err) {
                            newOcorrencia.prioridadeOcorrencia = null;
                            //console.log("Erro ao obter prioridadeOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            let imgElement = document.querySelector(`#ctl00_cphBody_GridViewVZ > tbody > tr:nth-child(${i}) > td.gridPrioridade`);
                            if (imgElement) {
                                newOcorrencia.textoPrioridadeViatura = imgElement.innerText.substring(0, 10).replace("-", "").trim();
                            }
                        }
                        catch (err) {
                            newOcorrencia.textoPrioridadeViatura = null;
                            //console.log("Erro ao obter textoPrioridadeViatura: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.cidadeOcorrencia = document.querySelector(`#ctl00_cphBody_GridViewVZ_ctl${currentElement}_lblDescCidade`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.cidadeOcorrencia = null;
                            //console.log("Erro ao obter cidadeOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.bairroOcorrencia = document.querySelector(`#ctl00_cphBody_GridViewVZ_ctl${currentElement}_lblDescBairro`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.bairroOcorrencia = null;
                            //console.log("Erro ao obter bairroOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.pacienteOcorrencia = document.querySelector(`#ctl00_cphBody_GridViewVZ_ctl${currentElement}_lblPacNome`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.pacienteOcorrencia = null;
                            //console.log("Erro ao obter pacienteOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.pacienteIdadeOcorrencia = document.querySelector(`#ctl00_cphBody_GridViewVZ_ctl${currentElement}_lblPacIdade`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.pacienteIdadeOcorrencia = null;
                            //console.log("Erro ao obter pacienteIdadeOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.motivoHD = document.querySelector(`#ctl00_cphBody_GridViewVZ_ctl${currentElement}_lblHD`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.motivoHD = null;
                            //console.log("Erro ao obter motivoHD: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.numeroChamado = document.querySelector(`#ctl00_cphBody_GridViewVZ_ctl${currentElement}_lblCodigoDig`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.numeroChamado = null;
                            //console.log("Erro ao obter numeroChamado: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.dataOcorrencia = document.querySelector(`#ctl00_cphBody_GridViewVZ_ctl${currentElement}_lblData`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.dataOcorrencia = null;
                            //console.log("Erro ao obter dataOcorrencia");
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.hchOcorrencia = document.querySelector(`#ctl00_cphBody_GridViewVZ_ctl${currentElement}_lblHoraEvChamada`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.hchOcorrencia = null;
                            //console.log("Erro ao obter hchOcorrencia");
                            //console.log(err.message);
                        }
                        if (newOcorrencia != null)
                            listOfOccurrences.push(newOcorrencia);
                    }
                }
                resolve(listOfOccurrences);
            }).then((listOfOccurrences) => {
                return listOfOccurrences;
            });
        }, config_1.varsSSO);

        var qtdA = 0;
                for(var i of result){
                    if(i.textoPrioridadeViatura == "Ag. VTR"){
                        qtdA++;
                    }
                }
        
            //console.log("QUANTIDADE CRITICAL PATIENTE: " + qtdA)


        return result;
    }
    catch (err) {
        throw new Error(err);
    }
}
exports.getOccurrenceCriticalPatient = getOccurrenceCriticalPatient;
