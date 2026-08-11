"use strict";
/* ScrapSSO 1.0 */
/* Cisbaf - Sistemas de Informação 2024 - ₢ NJ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.varsSSO = exports.varsEnviroment = void 0;
const varsEnviroment = {
    production: true,
    page: null,
    //Pagina Url paga entrar no SSO
    PageUrl: "http://192.168.1.252/SSONovaIguacu/_Sistema/ConsultaRegulacao.aspx",
    //PAGINA DE LOGIN
    PageLogin: "http://192.168.1.252/SSONOVAIGUACU/Login.aspx",
    //Elemento do input de login
    ElementInputLoginEntrada: "txtLogin",
    //Elemento do input de password
    ElementInputPasswordEntrada: "txtSenha",
    //Usuario para fazer login
    InputUserToLogin: "",
    //Senha do usuario para login
    InputLoginPassword: "",
    //Elemento de botao submit login para entrar
    ElementSubmitLogin: "btnLogin",
};
exports.varsEnviroment = varsEnviroment;
const varsSSO = {
    //VARIAVEIS PARA getOccurrenceTransfers()
    listaVeiculos: "#ctl00_cphBody_tblStatusVTR tbody tr td",
    listaMunicipiosPercorrer: [
        "BELFORD ROXO",
        "DUQUE DE CAXIAS - HOSPITAL MOACIR DO CARMO",
        "ITAGUAI",
        "JAPERI",
        "MAGE",
        "MESQUITA",
        "NILOPOLIS",
        "NOVA IGUAÇU - SEMUS",
        "PARACAMBI",
        "QUEIMADOS",
        "SAO JOAO DE MERITI",
        "SEROPEDICA",
        "FROTA PRÓPRIA UNIDADE",
        "EQUIPE CERTIFICADORA DE ÓBITO"
    ],
    //VARIAVEIS PARA getOccurrenceTransfers
    listaOcorrenciasTransferidas: "#ctl00_cphBody_GridViewTIH tbody tr",
    listaOcorrenciasEmergenciasUrgencias: "#ctl00_cphBody_gvVTRCampinas > tbody > tr",
    listaOcorrenciasPacienteCritico: "#ctl00_cphBody_tabVTRVZ tbody tr",
};
exports.varsSSO = varsSSO;
