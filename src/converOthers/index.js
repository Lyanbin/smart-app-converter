/**
 * @file 转换下文件后缀
 */
const fs = require('fs-extra');
const config = require('../config.js');
const util = require('../util.js');
const path = require('path');


module.exports = function converOthers(fileObj, aimType, outDir) {
    // const aimConfig = config[aimType];
    let outTruePath = path.join(outDir, fileObj.subPath);
    fs.ensureFileSync(outTruePath);
    fs.copyFileSync(fileObj.truePath, outTruePath);
    util.logOutPut(fileObj.truePath, outTruePath);
}
