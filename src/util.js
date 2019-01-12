/**
 * @file 辅助函数
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports.recursiveReadAllFile = function (dir, cb) {
    let dirs = fs.readdirSync(dir);
    dirs.forEach((item) => {
        if (/(?:DS_Store|git|vscode)$/.test(item)) {
            return;
        }
        let resolvedPath = path.join(dir, item);
        let itemStat = fs.statSync(resolvedPath);
        if (itemStat.isDirectory()) {
            module.exports.recursiveReadAllFile(resolvedPath, cb);
        } else {
            cb(resolvedPath);
        }
    });
}

module.exports.warning = function (context) {
    console.log(chalk.yellow(`[warning]: ${context}`));
}

module.exports.error = function (context) {
    console.log(chalk.red(`[error]: ${context}`));
}

module.exports.log = function(context) {
    console.log(`[log]: ${context}`);
}

module.exports.success = function (context) {
    console.log(chalk.green(`[success]: ${context}`));
}