"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOccurrenceEmergencyOrUrgency = void 0;
const config_1 = require("../config/config");
async function getOccurrenceEmergencyOrUrgency(page) {
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
                //LISTA CORRENCIAS EMERGENCIAS 
                var lista = document.querySelectorAll(varsSSO.listaOcorrenciasEmergenciasUrgencias);
                for (var i = 0; i <= lista.length; i++) {
                    const ItemParaChecarSeExiste = document.querySelector(`#ctl00_cphBody_gvVTRCampinas > tbody > tr:nth-child(${i}) > td.gridPrioridade`);
                    if (ItemParaChecarSeExiste && ItemParaChecarSeExiste != "") {
                        let currentElement = (i).toString().padStart(2, '0');
                        var newOcorrencia = Object.create(newObjectOccurrence);
                        try {
                            let imgElement = document.querySelector(`#ctl00_cphBody_gvVTRCampinas > tbody > tr:nth-child(${i}) > td.gridPrioridade > img`);
                            if (imgElement) {
                                newOcorrencia.prioridadeOcorrencia = imgElement.getAttribute("title").substring(0, 9).replace("-", "").trim();
                            }
                            else {
                                let tdElement = document.querySelector(`#ctl00_cphBody_gvVTRCampinas > tbody > tr:nth-child(${i}) > td.gridPrioridade`);
                                if (tdElement) {
                                    newOcorrencia.prioridadeOcorrencia = tdElement.innerText.replace("-", "").trim().substring(0, 9);
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
                            let imgElement = document.querySelector(`#ctl00_cphBody_gvVTRCampinas > tbody > tr:nth-child(${i}) > td.gridPrioridade`);
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
                            if(!document.querySelector(`#ctl00_cphBody_gvVTRCampinas > tbody > tr:nth-child(${i}) > td:nth-child(6) > span > a > font`).innerText){
                                throw new Error("ELEMENTO DE TEXTO querySelector HTML NOME CIDADE NÃO ENCONTRADO NA PAGINA!! - 2323AA");
                            }
                            newOcorrencia.cidadeOcorrencia = document.querySelector(`#ctl00_cphBody_gvVTRCampinas > tbody > tr:nth-child(${i}) > td:nth-child(6) > span > a > font`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.cidadeOcorrencia = null;
                            //console.log("Erro ao obter cidadeOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.bairroOcorrencia = document.querySelector(`#ctl00_cphBody_gvVTRCampinas_ctl${currentElement}_lblDescBairro`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.bairroOcorrencia = null;
                            //console.log("Erro ao obter bairroOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.pacienteOcorrencia = document.querySelector(`#ctl00_cphBody_gvVTRCampinas_ctl${currentElement}_lblPacNome`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.pacienteOcorrencia = null;
                            //console.log("Erro ao obter pacienteOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.pacienteIdadeOcorrencia = document.querySelector(`#ctl00_cphBody_gvVTRCampinas_ctl${currentElement}_lblPacIdade`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.pacienteIdadeOcorrencia = null;
                            //console.log("Erro ao obter pacienteIdadeOcorrencia: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.motivoHD = document.querySelector(`#ctl00_cphBody_gvVTRCampinas_ctl${currentElement}_lblHD`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.motivoHD = null;
                            //console.log("Erro ao obter motivoHD: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.numeroChamado = document.querySelector(`#ctl00_cphBody_gvVTRCampinas_ctl${currentElement}_lblCodigoDig`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.numeroChamado = null;
                            //console.log("Erro ao obter numeroChamado: " + err.toString());
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.dataOcorrencia = document.querySelector(`#ctl00_cphBody_gvVTRCampinas_ctl${currentElement}_lblData`).innerText;
                        }
                        catch (err) {
                            newOcorrencia.dataOcorrencia = null;
                            //console.log("Erro ao obter dataOcorrencia");
                            //console.log(err.message);
                        }
                        try {
                            newOcorrencia.hchOcorrencia = document.querySelector(`#ctl00_cphBody_gvVTRCampinas_ctl${currentElement}_lblHoraEvChamada`).innerText;
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

    //console.log("QUANTIDADE EMERGENCY: " + qtdA)

        return result;
    }
    catch (err) {
        throw new Error(err);
    }
}
exports.getOccurrenceEmergencyOrUrgency = getOccurrenceEmergencyOrUrgency;
