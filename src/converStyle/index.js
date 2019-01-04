/**
 * @file 处理style文件的差异
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('../util.js');
const config = require('../config.js');
const less = require('less');
const postcss = require('postcss');
const Assets = require('assets');
module.exports = function converJson(dir, aimType) {
    if (!aimType) {
        console.log('No aim type, do nothing...');
        return false;
    }
    console.log('Convering the style files...');
    util.recursiveReadDir(dir, handleStyle(aimType, dir));
};


function handleStyle(aimType, dir) {
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
            // content = content.replace(/\.(?:wxss|css|acss)/ig, `.${aimFileType}`);

            let astObj = postcss.parse(content);
            let newAstObj = await handleCssAst(astObj, aimFileType, filePath, dir);
            let resContent = '';
            postcss.stringify(newAstObj, (str) => {
                resContent += str;
            });
            // 最后目标文件的路径
            let cssPath = filePath.replace(/.less$/, `.${aimFileType}`);
            fs.removeSync(filePath);
            fs.ensureFileSync(cssPath);
            fs.writeFileSync(cssPath, resContent);
        }
    };
}

async function handleCssAst(astObj, aimFileType, filePath, dir) {
    let ast = astObj.nodes || [];
    let resolver = new Assets();
    await Promise.all(ast.map(async (item) => {
        if (item.type === 'atrule' && item.name === 'import') {
            item.params = item.params.replace(/\.(?:wxss|css|acss)/ig, `.${aimFileType}`);
        } else if (item.type === 'rule') {
            await Promise.all(item.nodes.map(async (declNode) => {
                if (/^background(?:-image)?$/.test(declNode.prop) && /url\((['"]?)([^'"]*?)\1\)/.test(declNode.value)) {
                    let originValue = declNode.value;
                    let imagePath = originValue.match(/url\((['"]?)([^'"]*?)\1\)/)[2];
                    let isNetSource = /^((?:http|https):)?\/\//.test(imagePath.trim());
                    if (!isNetSource) {
                        // 这里要base64
                        let truePath = path.resolve(path.dirname(filePath), imagePath);
                        if (/^\//.test(imagePath)) {
                            truePath = path.resolve(`${dir}${imagePath}`);
                        }
                        let base64 = await resolver.data(truePath);
                        declNode.value = `url(${base64})`;
                        return declNode;
                    }
                }
            }));
        }
        return item;
    }));
    return {
        ...astObj,
        nodes: ast
    };
}