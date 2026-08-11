"use strict";
/* ScrapSSO 1.0 */
/* Cisbaf - Sistemas de Informação 2024 - ₢ NJ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetStatistic = void 0;
const getVeiclesInfo_1 = require("../controls/getVeiclesInfo");
const getOccurrenceEmergencyOrUrgency_1 = require("../controls/getOccurrenceEmergencyOrUrgency");
const getOccurrenceTransfers_1 = require("../controls/getOccurrenceTransfers");
const getOccurrenceCriticalPatient_1 = require("../controls/getOccurrenceCriticalPatient");
class GetStatistic {
    static async pegarDados(page) {
        //console.log("Obtendo data...");
        var RelatorioOcorrenciasUrgentes = (async () => {
            while (this.erros < 3) {
                try {
                    const data = await (0, getOccurrenceEmergencyOrUrgency_1.getOccurrenceEmergencyOrUrgency)(page);
                    this.erros = 0;
                    return data;
                }
                catch (err) {
                    this.erros++;
                    //console.log(`Ocorreu um erro ao tentar pegar o relatorio de ocorrencias urgentes: ${err}`);
                    if (this.erros > 1) {
                        throw new Error(`3ª tentativa de chamada para o método -GetStatistic.ts getOccurrenceEmergencyOrUrgency() falhou`);
                    }
                }
            }
        })();
        var RelatorioPacientesCriticos = (async () => {
            while (this.erros < 3) {
                try {
                    const data = await (0, getOccurrenceCriticalPatient_1.getOccurrenceCriticalPatient)(page);
                    this.erros = 0;
                    return data;
                }
                catch (err) {
                    this.erros++;
                    //console.log(`Ocorreu um erro ao tentar pegar o relatorio de pacientes críticos: ${err}`);
                    if (this.erros > 1) {
                        throw new Error(`3ª tentativa de chamada para o método -GetStatistic.ts getOccurrenceCriticalPatient() falhou`);
                    }
                }
            }
        })();
        var RelatorioOcorrenciasTransferidas = (async () => {
            while (this.erros < 3) {
                try {
                    const data = await (0, getOccurrenceTransfers_1.getOccurrenceTransfers)(page);
                    this.erros = 0;
                    return data;
                }
                catch (err) {
                    this.erros++;
                    //console.log(`Ocorreu um erro ao tentar pegar o relatorio de ocorrências transferidas: ${err}`);
                    if (this.erros > 1) {
                        throw new Error(`3ª tentativa de chamada para o método -GetStatistic.ts getOccurrenceTransfers() falhou`);
                    }
                }
            }
        })();
        var RelatorioViaturas = (async () => {
            while (this.erros < 3) {
                try {
                    const data = await (0, getVeiclesInfo_1.getVeiclesInfo)(page);
                    this.erros = 0;
                    return data;
                }
                catch (err) {
                    this.erros++;
                    //console.log(`Ocorreu um erro ao tentar pegar o relatorio de veículos: ${err}`);
                    if (this.erros > 1) {
                        throw new Error(`3ª tentativa de chamada para o método -GetStatistic.ts getVeiclesInfo() falhou`);
                    }
                }
            }
        })();
        try {
            const DataRelatorioOcorrenciasUrgentes = await RelatorioOcorrenciasUrgentes;
            const DataRelatorioPacientesCriticos = await RelatorioPacientesCriticos;
            const DataRelatorioOcorrenciasTransferidas = await RelatorioOcorrenciasTransferidas;
            const DataRelatorioViaturas = await RelatorioViaturas;
            const relatorio = {
                RelatorioOcorrenciasUrgentes: DataRelatorioOcorrenciasUrgentes,
                RelatorioPacientesCriticos: DataRelatorioPacientesCriticos,
                RelatorioOcorrenciasTransferidas: DataRelatorioOcorrenciasTransferidas,
                RelatorioViaturas: DataRelatorioViaturas
            };
            this.erros = 0;
            //console.log("Relatório pego com sucesso.");
            return relatorio;
        }
        catch (err) {
            throw new Error(`Erro capturado no método GetStatistic.ts - pegarDados: ${err}`);
        }
    }
}
exports.GetStatistic = GetStatistic;
GetStatistic.erros = 0;
