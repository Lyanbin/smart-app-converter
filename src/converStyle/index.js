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
module.exports = function converStyle(dir, aimType) {
    if (!aimType) {
        util.error('No aim type, do nothing...');
        return false;
    }
    util.log('Convering the style files...');
    util.recursiveReadAllFile(dir, handleStyle(aimType, dir));
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
                    util.error(`${filePath} \n Build to css failed...`);
                    util.error(e);
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
                if (/^background(?:-image)?$/.test(declNode.prop)) {
                    let isSourceReg = /url\((['"]?)((?!(data:|https?:|'|"|\/\/)).*?)\1\)/;
                    let imagePath = declNode.value.match(isSourceReg) ? declNode.value.match(isSourceReg)[2] : null;
                    while (imagePath) {
                        let truePath = path.resolve(path.dirname(filePath), imagePath);
                        if (/^\//.test(imagePath)) {
                            truePath = path.resolve(`${dir}${imagePath}`);
                        }
                        let pathExists = fs.pathExistsSync(truePath);
                        if (pathExists) {
                            let base64 = await resolver.data(truePath);
                            declNode.value = declNode.value.replace(isSourceReg, `url(${base64})`);
                            imagePath = declNode.value.match(isSourceReg) ? declNode.value.match(isSourceReg)[2] : null;
    
                        } else {
                            util.error(`${filePath} \n ${imagePath} is not a legal path.`);
                            break;
                        }
                    }
                    return declNode;
                }
            }));
            // 微信小程序里不支持通配符，百度的支持，这里给通配符统一转换下，可能有问题，避免使用
            if (item.selector === '*') {
                item.selector = 'block, view, scroll-view, swiper, movable-area, cover-view, cover-image, icon, text, rich-text, progress, animation-view, button, checkbox, form, input, label, picker, radio, slider, switch, textarea, navigator, audio, image, video, camera, live-player, map, canvas';
            }
        }
        return item;
    }));
    return {
        ...astObj,
        nodes: ast
    };
}