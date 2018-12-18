/**
 * @file 转换下文件后缀
 */
const fs = require('fs-extra');
// const path = require('path');
const config = require('../config.js');
const util = require('../util.js');
module.exports = async function converExtname(dir, aimType) {
    if (!aimType) {
        console.log('No aim type, do nothing...');
        return false;
    }
    console.log('Convering the extnames...');
    util.recursiveReadDir(dir, changeExtname(aimType));
}

function changeExtname(aimType) {
    const aimFileType = config[aimType];
    return function (filePath) {
        const templReg = /(?:wxml|swan|axml)$/;
        const styleReg = /(?:wxss|css|acss)$/;
        if (filePath.match(templReg)) {
            // 模板
            let newPath = filePath.replace(templReg, aimFileType.templ);
            fs.renameSync(filePath, newPath);
        } else if (filePath.match(styleReg)) {
            // 样式
            let newPath = filePath.replace(styleReg, aimFileType.style);
            fs.renameSync(filePath, newPath);
        }
    }
}