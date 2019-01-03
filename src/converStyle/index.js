/**
 * @file 处理style文件的差异
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('../util.js');
const config = require('../config.js');
const less = require('less');
module.exports = function converJson(dir, aimType) {
    if (!aimType) {
        console.log('No aim type, do nothing...');
        return false;
    }
    console.log('Convering the style files...');
    util.recursiveReadDir(dir, handleJson(aimType));
};


function handleJson(aimType) {
    // 这里可以针对不同的aimType做处理
    const aimFileType = config[aimType].style;
    return async function (filePath) {
        if (path.extname(filePath) === `.${aimFileType}` || path.extname(filePath) === '.less') {
            let content = fs.readFileSync(filePath).toString();
            // 如果是less的话，处理下
            if (path.extname(filePath) === '.less') {
                let lessRes = '';
                try {
                    lessRes = await less.render(content, {
                        paths: [
                            './',
                            path.dirname(filePath)
                        ]
                    });
                } catch (e) {
                    console.log(`${filePath} build failed...`);
                    console.log(e);
                }
                content = lessRes ? lessRes.css : content;
            }
            content = content.replace(/\.(?:wxss|css|acss)/ig, `.${aimFileType}`);
    
            let cssPath = filePath.replace(/.less$/, `.${aimFileType}`);
            await fs.remove(filePath);
            await fs.ensureFile(cssPath);
            await fs.writeFile(cssPath, content);
        }
    };
}
