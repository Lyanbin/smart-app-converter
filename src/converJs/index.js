/**
 * @file js文件处理
 */

const path = require('path');
const util = require('../util.js');
const traverse = require('@babel/traverse').default;
const parser = require('@babel/parser');
const fs = require('fs-extra');
const config = require('../config');
const generator = require('@babel/generator').default;
module.exports = function converJs(dir, aimType) {
    if (!aimType) {
        console.log('No aim type, do nothing...');
        return false;
    }
    console.log('Convering the js files...');
    util.recursiveReadDir(dir, handleJs(aimType));
}


function handleJs(aimType) {
    // 这里可以针对不同的aimType做处理
    const aimClassType = config[aimType].class;
    return async function (filePath) {
        if (path.extname(filePath) === '.js') {
            // 对js处理
            let contentBuffer = await fs.readFile(filePath);
            let content = contentBuffer.toString();
            // 对保留的内容标识符修改
            let needReg = new RegExp(`/\\*{3}${aimType} begin\\*{3}/([\\s\\S]*?)/\\*{3}${aimType} end\\*{3}/`, 'g');
            content = content.replace(needReg, `/**${aimType}**/$1/**${aimType}**/`);
            // 正则删掉独有的内容
            content = content.replace(/\/\*{3}(weixin|baidu|zhifubao) begin\*{3}\/[\s\S]*?\/\*{3}\1 end\*{3}\//g, '');
            let ast = parser.parse(content, {
                sourceType: 'module'
            });
            traverse(ast, {
                Identifier(path) {
                    // 对不支持的api收集，给出log提示
                    // TODO

                    // 替换总命名空间，应该最后做
                    let nodeName = path.node.name;
                    if (/^(swan|my|wx)$/.test(nodeName)) {
                        path.node.name = aimClassType;
                    }
                }
            });
            let newCode = generator(ast, {});
            fs.writeFile(filePath, newCode.code);
        }
    }
}