"use strict";
/* ScrapSSO 1.0 */
/* Cisbaf - Sistemas de Informação 2024 - ₢ NJ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buttonClick_ID = void 0;
async function buttonClick_ID(page, element) {
    return await page.evaluate((element) => {
        var _a;
        try {
            (_a = document.getElementById(element)) === null || _a === void 0 ? void 0 : _a.click();
        }
        catch (err) {
            throw err + "sendEvent.ts";
        }
    }, element);
}
exports.buttonClick_ID = buttonClick_ID;
