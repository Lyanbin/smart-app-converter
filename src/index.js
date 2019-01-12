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
const util = require('./util.js');
module.exports = async function converApp(entryDir, outDir, aimType) {
    // 目录判断，参数判断是否正确
    outDir = outDir ? outDir : path.join(entryDir, `../${path.basename(entryDir)}_conver_result`);
    if (!fs.pathExistsSync(entryDir) || !fs.statSync(entryDir).isDirectory()) {
        util.error('Wrong entry path.');
        return false;
    }

    // 判断有没有配置文件
    let appConfigPath = path.resolve(entryDir, 'conver.config.json');
    let appConfig = null;
    if (fs.pathExistsSync(appConfigPath) && fs.statSync(appConfigPath).isFile()) {
        appConfig = fs.readJsonSync(appConfigPath);
    }

    // 清空输出文件夹
    fs.ensureDirSync(outDir);
    fs.emptyDirSync(outDir);
    // copy整个项目，考虑到前期开发方便，直接暴力复制即可，后续为了性能可以逐个文件复制，复制同时做处理，这里先这么做吧
    util.log('Copying the total dir...');
    fs.copySync(entryDir, outDir);
    // 根据配置删除一些不要的目录
    if (appConfig) {
        try {
            let aimConfigObj = appConfig[aimType] || {};
            // 这些页面是我需要的
            let needPaths = aimConfigObj.path;
            // 如果配置了则生效，没配置就不生效了
            if (needPaths && needPaths.length > 0) {
                let outPagePath = path.resolve(outDir, 'pages');
                // 这些页面是从pages目录读到的文件夹名字
                let outPages = fs.readdirSync(outPagePath);
                outPages.forEach(outPath => {
                    // 拼成真实的目录
                    let checkingPath = path.resolve(outPagePath, outPath);
                    let needFlag = false;
                    needPaths.forEach(needPath => {
                        let targetPath =  path.resolve(outDir, needPath, '..');
                        // 如果待查的目录，是实际目录的一部分，则说明目录有效
                        if (targetPath.indexOf(checkingPath) === 0 && fs.statSync(targetPath).isDirectory()) {
                            needFlag = true;
                        }
                    });
                    if (!needFlag) {
                        fs.removeSync(checkingPath);
                        util.log(`${checkingPath} is not in the path of conver.config.js`);
                    }
                });
            }
        } catch(e) {
            util.error(e);
        }
    }
    
    try {
        // 这里await暂时无效，后续调整下
        await converExtname(outDir, aimType);
        await converJson(outDir, aimType, appConfig);
        await converStyle(outDir, aimType);
        await converJs(outDir, aimType);
        await converTempl(outDir, aimType);
    } catch (e) {
        util.error(e);
    }
}

