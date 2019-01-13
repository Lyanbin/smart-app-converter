/**
 * @file 处理json文件的差异
 */
const path = require('path');
const fs = require('fs-extra');
const util = require('../util.js');

module.exports = function converJson(dir, aimType, config) {
    if (!aimType) {
        util.error('No aim type, do nothing...');
        return false;
    }
    util.log('Convering the json files...');
    util.recursiveReadAllFile(dir, handleJson(aimType, dir, config));
};


function handleJson(aimType, dir, config) {
    // 这里可以针对不同的aimType做处理
    if (config) {
        const aimConfig = config[aimType];
        // 对app.json进行处理，不需要的pages
        let appFile = path.resolve(dir, 'app.json');
        let appFileContent = fs.readJSONSync(appFile);
        if (aimConfig.pages && aimConfig.pages.length) {
            appFileContent.pages = aimConfig.pages;
        }
        if (!aimConfig['url-mapping']) {
            delete appFileContent['url-mapping'];
        }
        fs.writeJSONSync(appFile, appFileContent, {
            spaces: 4
        });
    }
    return function (filePath) {
        if (path.extname(filePath) === '.json') {
            // 对其他json处理
            // TODO
            // 可以替换appid、appkey之类的
            // util.log(filePath);
        }
    };
}