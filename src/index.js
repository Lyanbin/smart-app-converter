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
const minimatch = require('minimatch');

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

        [this.paths, this.pathPatterns] = this.genPaths(entryDir, this.appConfig);

        this.files = this.genFiles(this.paths, this.entryDir);
        // 清空输出文件夹
        fs.ensureDirSync(outDir);
        fs.emptyDirSync(outDir);

        this.fire(this.files);
    }

    genPaths(entryDir, appConfig = null) {
        const globOpt = {
            cwd: entryDir,
            nodir: true,
            matchBase: true,
        };
        const aimType = this.aimType;
        let paths = glob.sync('**', {
            ...globOpt,
            ignore: ['node_modules/**', '.*']
        });
        let pathPatterns = [];
        if (appConfig && appConfig[aimType] && appConfig[aimType].pages && appConfig[aimType].pages.length) {
            let pathsWithNoPages = glob.sync('**', {
                ...globOpt,
                ignore: ['node_modules/**', '.*', 'pages/**']
            });
            let pathsOfPages = [];
            appConfig[aimType].pages.forEach(pathPattern => {
                pathPattern = pathPattern.replace(/^\/(.+)/, '$1').replace(/(.+\/)\S+/, '$1**');
                pathPatterns.push(pathPattern);
                let pathArr = glob.sync(pathPattern, {
                    ...globOpt,
                    ignore: ['node_modules/**', '.*']
                });
                pathsOfPages = pathsOfPages.concat(pathArr);
            });
            paths = [...pathsWithNoPages, ...pathsOfPages];
        }
        return [
            paths,
            pathPatterns
        ];
    }

    genFiles(paths = [], entryDir) {
        let files = {};
        paths.forEach(item => {
            let truePath = path.join(entryDir, item);
            if (fs.pathExistsSync(truePath) && fs.statSync(truePath).isFile()) {
                files[item] = new FileObj(item, entryDir);
            }
        });
        return files;
    }

    digest(type, truePath) {
        let entryDir = this.entryDir;
        let subPath = truePath.replace(entryDir + path.sep, '');
        if (type === 'change' && this.files[subPath]) {
            let file = this.genFiles([subPath], entryDir);
            this.files[subPath] = file;
            this.fire(file);
        } else if (type === 'add') {
            let pageReg = new RegExp(`^${entryDir}\\/pages`);
            if (pageReg.test(truePath) && this.pathPatterns.length) {
                this.pathPatterns.forEach(pattern => {
                    let isNeedFile = minimatch(subPath, pattern);
                    if (isNeedFile) {
                        let file = this.genFiles([subPath], entryDir);
                        this.paths.push(subPath);
                        this.files[subPath] = file;
                        this.fire(file);
                    }
                })
            } else {
                let file = this.genFiles([subPath], entryDir);
                this.paths.push(subPath);
                this.files[subPath] = file;
                this.fire(file);
            }
        } else if (type === 'unlink') {
            this.deleFile(subPath);
        } else if (type === 'unlinkDir') {
            this.deleteDir(subPath);
        }
    }

    fire(files = {}) {
        for (let file in files) {
            if (files.hasOwnProperty(file)) {
                if (files[file].isJs) {
                    converJs(files[file], this.aimType, this.outDir);
                } else if (files[file].isStyle) {
                    converStyle(files[file], this.aimType, this.outDir);
                } else if (files[file].isJson) {
                    converJson(files[file], this.aimType, this.outDir, this.appConfig);
                } else if (files[file].isTempl) {
                    converTempl(files[file], this.aimType, this.outDir);
                } else {
                    // 如果没匹配上上面的类型，则直接平稳投放
                    converOthers(files[file], this.aimType, this.outDir);
                }
            }
        }
    }

    deleFile(subPath) {
        let index = this.paths.indexOf(subPath);
        if (~index) {
            delete this.files[subPath];
            this.paths.splice(1, index);

            let outputTruePath = path.join(this.outDir, subPath);
            fs.unlinkSync(outputTruePath);
            util.logOutPut(outputTruePath, 'deleted.');
        }
    }

    deleteDir(subPath) {
        let outDir = this.outDir;
        let truePath = path.join(outDir, subPath);
        let pathPattern = `${subPath}/**`;
        let paths = glob.sync(pathPattern, {
            cwd: outDir,
            nodir: true,
            matchBase: true
        });
        paths.forEach(subItem => {
            this.deleFile(subItem);
        });
        fs.rmdirSync(truePath);
        util.logOutPut(truePath, 'deleted.');
    }
}

module.exports = Converter;