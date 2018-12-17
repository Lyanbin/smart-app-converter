/**
 * @file 处理json文件的差异
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('../util.js');

module.exports = function converJson(dir, aimType) {
    if (!aimType) {
        console.log('No aim type, do nothing...');
        return false;
    }
    console.log('Convering the json files...');
    util.recursiveReadDir(dir, handleJson(aimType));
}


function handleJson(aimType) {
    // 这里可以针对不同的aimType做处理
    return function (filePath) {
        if (path.extname(filePath) === '.json') {
            // 对json处理
            // TODO
            console.log(filePath);
        }
    }
}