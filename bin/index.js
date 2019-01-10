#!/usr/bin/env node
const packageJson = require('../package.json');
const program = require('commander');
const path = require('path');
const converApp = require('../src/index.js');
const util = require('../src/util.js');
program.version(packageJson.version)
    .option('-w --weixin <entryDir> [outputDir]', 'Get weixin mini program')
    .option('-z --zhifubao <entryDir> [outputDir]', 'Get zhifubao mini program')
    .option('-b --baidu <entryDir> [outputDir]', 'Get baidu mini program')
    .usage('<command> <entryDir> [outputDir]');

program.parse(process.argv);
if (program.weixin) {
    parseParam(program.weixin, 'weixin');
} else if (program.baidu) {
    parseParam(program.baidu, 'baidu');
} else if (program.zhifubao) {
    parseParam(program.zhifubao, 'zhifubao');
}

function parseParam(entryDir, aim) {
    if (!aim) {
        util.error('what do u want?');
        return;
    }
    let resolvedEntryDir = path.resolve(entryDir);
    let resolvedOutDir = program.args[0] ? path.resolve(program.args[0]) : null;
    converApp(resolvedEntryDir, resolvedOutDir, aim);
}