/**
 * @file 处理json文件的差异
 */
const path = require('path');
const fs = require('fs-extra');
const util = require('../util.js');
const config = require('../config');

module.exports = function converJson(fileObj, aimType, outDir, converConfig) {
    const aimConfig = config[aimType];
    let fileContent = fs.readJSONSync(fileObj.truePath);
    if (fileObj.subPath === 'app.json') {
        if (!aimConfig['url-mapping']) {
            delete fileContent['url-mapping'];
        }
        if (converConfig) {
            const aimConverConfig = converConfig[aimType];
            if (aimConverConfig.pages && aimConverConfig.pages.length) {
                fileContent.pages = aimConverConfig.pages;
            }
        }
    }
    let outTruePath = path.join(outDir, fileObj.subPath);
    fs.ensureFileSync(outTruePath);
    fs.writeJSONSync(outTruePath, fileContent, {
        spaces: 4
    });

    util.logOutPut(fileObj.truePath, outTruePath);
}
