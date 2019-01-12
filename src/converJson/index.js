/**
 * @file 处理json文件的差异
 */
const path = require('path');
const util = require('../util.js');

module.exports = function converJson(dir, aimType, config) {
    if (!aimType) {
        util.error('No aim type, do nothing...');
        return false;
    }
    util.log('Convering the json files...');
    util.recursiveReadAllFile(dir, handleJson(aimType, config));
};


function handleJson(aimType, config) {
    // 这里可以针对不同的aimType做处理
    const aimConfig = config[aimType];
    return function (filePath) {
        if (path.extname(filePath) === '.json') {
            // 对json处理
            // TODO
            // 可以替换appid、appkey之类的
            // util.log(filePath);
        }
    };
}