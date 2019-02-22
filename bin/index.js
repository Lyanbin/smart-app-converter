#!/usr/bin/env node
const packageJson = require('../package.json');
const program = require('commander');
const path = require('path');
const Converter = require('../src/index.js');
const util = require('../src/util.js');
const fs = require('fs-extra');
const chokidar = require('chokidar');
program.version(packageJson.version)
    .option('-w --weixin <entryDir> [outputDir]', 'Get weixin mini program')
    .option('-z --zhifubao <entryDir> [outputDir]', 'Get zhifubao mini program')
    .option('-b --baidu <entryDir> [outputDir]', 'Get baidu mini program')
    .option('-x --xxx', 'xxxxxx')
    .action((...args) => {
        let options = args[args.length - 1];
        // 判断输出的类型
        let aimType = '';
        if (options.weixin) {
            aimType = 'weixin';
        } else if (options.baidu) {
            aimType = 'baidu';
        } else if (options.zhifubao) {
            aimType = 'zhifubao';
        }

        if (!aimType) {
            util.error('what do u want?');
            return;
        }

        if (options.xxx) {
            watchParseParam(options, aimType);
        } else {
            parseParam(options, aimType);
        }
    })
    .usage('<command> <entryDir> [outputDir]');

program.parse(process.argv);


function parseParam(options, aim) {
    let entryDir = options[aim];
    let resolvedEntryDir = path.resolve(entryDir);

    // 判断入口是否正常，正常的小程序都有app.json文件
    let entryDirCheckFile = path.resolve(entryDir, 'app.json');
    if (!fs.pathExistsSync(entryDirCheckFile) || !fs.statSync(entryDirCheckFile).isFile()) {
        util.error('Illegal enterDir.');
        return;
    }

    let resolvedOutDir = options.args[0] ? path.resolve(options.args[0]) : null;

    return new Converter(resolvedEntryDir, resolvedOutDir, aim)
}

function watchParseParam(options, aim) {
    let cvter = parseParam(options, aim);
    if (!cvter) {
        return;
    }
    chokidar.watch(cvter.entryDir, {
        ignored: /(^|[\/\\])\../,
        ignoreInitial: true,
        persistent: true
    }).on('add', listen('add', cvter))
    .on('change', listen('change', cvter))
    .on('unlink', listen('unlink', cvter))
    .on('unlinkDir', listen('unlinkDir', cvter))
    .on('error', err => {
        util.error(`Watcher error: ${err}`);
    });
}

function listen(type, cvter) {
    return (path) => {
        cvter.digest(type, path);
    }
}