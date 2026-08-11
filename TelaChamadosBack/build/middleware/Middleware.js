"use strict";
/* ScrapSSO 1.0 */
/* Cisbaf - Sistemas de Informação 2024 - ₢ NJ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware = void 0;
const middleware = (req, res, next) => {
    ////console.log('Nova requisição:', Date.now());
    next();
};
exports.middleware = middleware;
