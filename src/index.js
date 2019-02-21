/**
 * @file 转换总函数
 */
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const FileObj = require('./file/index.js');
const converOthers = require('./converOthers/index.js');
const converJson = require('./converJson/index.js');
const converStyle = require('./converStyle/index.js');
const converJs = require('./converJs/index.js');
const converTempl = require('./converTemplate/index.js');
const util = require('./util.js');


class Converter {

    constructor (entryDir, outDir, aimType) {

        this.entryDir = entryDir;
        outDir = outDir ? outDir : path.join(entryDir, `../${path.basename(entryDir)}_conver_result`);
        this.outDir = outDir;
        this.aimType = aimType;

        // 判断有没有配置文件
        let appConfigPath = path.resolve(entryDir, 'conver.config.json');
        if (fs.pathExistsSync(appConfigPath) && fs.statSync(appConfigPath).isFile()) {
            this.appConfig = fs.readJsonSync(appConfigPath);
        }

        this.paths = this.getPaths(entryDir, aimType, this.appConfig);

        this.files = this.getFiles(this.paths, this.entryDir);
        // 清空输出文件夹
        fs.ensureDirSync(outDir);
        fs.emptyDirSync(outDir);

        this.fire(this.files, aimType, outDir, this.appConfig);
    }

    getPaths(entryDir, aimType, appConfig = null) {
        const globOpt = {
            cwd: entryDir,
            nodir: true,
            matchBase: true,
        };
    
        let paths = glob.sync('**', {
            ...globOpt,
            ignore: ['node_modules/**', '.*']
        });
    
        if (appConfig && appConfig[aimType] && appConfig[aimType].pages && appConfig[aimType].pages.length) {
            let pathsWithNoPages = glob.sync('**', {
                ...globOpt,
                ignore: ['node_modules/**', '.*', 'pages/**']
            });
            let pathsOfPages = [];
            appConfig[aimType].pages.forEach(pathPattern => {
                pathPattern = pathPattern.replace(/^\/(.+)/, '$1');
                pathPattern = pathPattern.replace(/(.+\/)\S+/, '$1**');
                let pathArr = glob.sync(pathPattern, {
                    ...globOpt,
                    ignore: ['node_modules/**', '.*']
                });
                pathsOfPages = pathsOfPages.concat(pathArr);
            });
            paths = [...pathsWithNoPages, ...pathsOfPages];
        }
        return paths;
    }

    getFiles(paths = [], entryDir) {
        let files = {};
        paths.forEach(item => {
            let truePath = path.join(entryDir, item);
            if (fs.pathExistsSync(truePath) && fs.statSync(truePath).isFile()) {
                files[item] = new FileObj(item, entryDir);
            }
        });
        return files;
    }

    fire(files = {}, aimType, outDir, appConfig) {
        for (let file in files) {
            if (files.hasOwnProperty(file)) {
                if (files[file].isJs) {
                    converJs(files[file], aimType, outDir);
                } else if (files[file].isStyle) {
                    converStyle(files[file], aimType, outDir);
                } else if (files[file].isJson) {
                    converJson(files[file], aimType, outDir, appConfig);
                } else if (files[file].isTempl) {
                    converTempl(files[file], aimType, outDir);
                } else {
                    // 如果没匹配上上面的类型，则直接平稳投放
                    converOthers(files[file], aimType, outDir);
                }
            }
        }
    }
}

module.exports = Converter;