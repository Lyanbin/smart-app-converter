/**
 * @file 辅助函数
 */
const fs = require('fs-extra');
const path = require('path');

module.exports.recursiveReadDir = function (dir, cb) {
    let dirs = fs.readdirSync(dir);
    dirs.forEach((item) => {
        if (/(?:DS_Store|git|vscode)$/.test(item)) {
            return;
        }
        let resolvedPath = path.join(dir, item);
        let itemStat = fs.statSync(resolvedPath);
        if (itemStat.isDirectory()) {
            module.exports.recursiveReadDir(resolvedPath, cb);
        } else {
            cb(resolvedPath);
        }
    });
}