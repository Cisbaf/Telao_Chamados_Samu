"use strict";
const fs = require("fs");
async function newLog(err) {
    var dataDayAndHour = new Date().toLocaleString('pt-br');
    if (fs.existsSync("log.txt")) {
        fs.appendFile("log.txt", err + dataDayAndHour + "\n\n", function (err) {
            if (err)
                return
        });
    }
}
module.exports = { newLog };
