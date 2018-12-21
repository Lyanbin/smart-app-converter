/**
 * @file 转换总函数
 */
const fs = require('fs-extra');
const path = require('path');
const converExtname = require('./converExtname/index.js');
const converJson = require('./converJson/index.js');
const converStyle = require('./converStyle/index.js');
const converJs = require('./converJs/index.js');
const converTempl = require('./converTemplate/index.js');
module.exports = async function converApp(entryDir, outDir, aimType) {
    // 目录判断，参数判断是否正确
    outDir = outDir ? outDir : path.join(entryDir, `../${path.basename(entryDir)}_conver_result`);
    let entryPathCheck = await fs.pathExists(entryDir);
    let entryExist = false;
    if (entryPathCheck) {
        let entryDirStat = await fs.stat(entryDir);
        if (entryDirStat.isDirectory()) {
            entryExist = true;
        }
    }
    if (!entryExist) {
        console.log('Wrong entry path.');
        return false;
    }
    fs.ensureDirSync(outDir);
    fs.emptyDirSync(outDir);
    // copy整个项目，考虑到前期开发方便，直接暴力复制即可，后续为了性能可以逐个文件复制，复制同时做处理，这里先这么做吧
    console.log('Copying the total dir...');
    fs.copySync(entryDir, outDir);
    await converExtname(outDir, aimType);
    await converJson(outDir, aimType);
    await converStyle(outDir, aimType);
    await converJs(outDir, aimType);
    await converTempl(outDir, aimType);
}

