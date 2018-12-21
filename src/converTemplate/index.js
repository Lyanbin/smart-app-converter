/**
 * @file 处理模板
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('../util.js');
const config = require('../config.js');
const parse5 = require('parse5');
module.exports = function converJson(dir, aimType) {
    if (!aimType) {
        console.log('No aim type, do nothing...');
        return false;
    }
    console.log('Convering the templ files...');
    util.recursiveReadDir(dir, handleTempl(aimType));
}


function handleTempl(aimType) {
    // 这里可以针对不同的aimType做处理
    const aimFileType = config[aimType].templ;
    return async function (filePath) {
        if (path.extname(filePath) === `.${aimFileType}`) {
            let contentBuffer = await fs.readFile(filePath);
            let content = contentBuffer.toString();
            let ast = parse5.parse(content);
            if (/search.wxml/.test(filePath)) {
                console.log(filePath);
                console.log(ast.childNodes[0].childNodes[1]);
            }
        }
    }
}
