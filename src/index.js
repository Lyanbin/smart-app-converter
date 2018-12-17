/**
 * @file 转换总函数
 */
const fs = require('fs-extra');
const path = require('path');
const converExtname = require('./converExtname/index.js');
const converJson = require('./converJson/index.js');
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
    // copy整个项目
    console.log('Copying the total dir...');
    fs.copySync(entryDir, outDir);
    await converExtname(outDir, aimType);
    await converJson(outDir, aimType);
}

