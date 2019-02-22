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
const T = require('@babel/types');

module.exports = function converJs(fileObj, aimType, outDir) {
    const aimConfig = config[aimType];
    let aimClassType = aimConfig.class;
    // 对js处理
    let contentBuffer = fs.readFileSync(fileObj.truePath);
    let content = contentBuffer.toString();
    // 对保留的内容标识符修改
    let needReg = new RegExp(`/\\*{3}${aimType} begin\\*{3}/([\\s\\S]*?)/\\*{3}${aimType} end\\*{3}/`, 'g');
    content = content.replace(needReg, `/**${aimType} only begin**/$1/**${aimType} only end**/`);
    // 正则删掉独有的内容
    content = content.replace(/\/\*{3}(weixin|baidu|zhifubao) begin\*{3}\/[\s\S]*?\/\*{3}\1 end\*{3}\//g, '');
    let ast = parser.parse(content, {
        sourceType: 'module'
    });
    traverse(ast, {
        // 对不支持的api收集，给出log提示
        // TODO

        // 替换给swan当参数传入
        CallExpression(path) {
            path.node.arguments.forEach(item => {
                if (T.isIdentifier(item)) {
                    if (/^(swan|my|wx)$/.test(item.name)) {
                        item.name = aimClassType;
                    }
                }
            });
        },
        // 替换swan.XXX，应该最后做
        MemberExpression(path) {
            if (T.isIdentifier(path.node.object)) {
                // 替换swan.xx、swan[xx],屏蔽swan.swan['xx']
                let nodeTemp = path.node.object;
                let nodeName = nodeTemp.name;
                if (/^(swan|my|wx)$/.test(nodeName)) {
                    nodeTemp.name = aimClassType;
                }
            }
        },
        // 对globalData填充，塞进去一个当前的type
        ExpressionStatement(path) {
            if (T.isCallExpression(path.node.expression) && T.isIdentifier(path.node.expression.callee) && path.node.expression.callee.name === 'App') {
                let expressionPath = path.get('expression');
                let paramsArrPath = expressionPath.get('arguments');
                let vNode = T.objectProperty(T.identifier('__type__'), T.StringLiteral(aimType));
                if (paramsArrPath.length === 0) {
                    // 没有参数的情况，强塞个进去
                    let arg = T.objectExpression([T.objectProperty(T.identifier('globalData'), T.objectExpression([vNode]))]);
                    expressionPath.pushContainer('arguments', arg);
                } else {
                    let findGlobalData = false;
                    // 一般只有1个参数，对参数0进行处理
                    if (T.isObjectExpression(paramsArrPath[0])) {
                        let argPropertiesPath = paramsArrPath[0].get('properties');
                        argPropertiesPath.map(argPropertyPath => {
                            if (T.isObjectProperty(argPropertyPath) && T.isIdentifier(argPropertyPath.node.key) && argPropertyPath.node.key.name === 'globalData') {
                                findGlobalData = true;
                                argPropertyPath.get('value').pushContainer('properties', vNode);
                            }
                            return argPropertiesPath;
                        });
                        if (!findGlobalData) {
                            let vNodeFather = T.objectProperty(T.identifier('globalData'), T.objectExpression([vNode]));
                            paramsArrPath[0].pushContainer('properties', vNodeFather);
                        }
                    }
                }
            }
        }
    });
    let newCode = generator(ast, {});
    let outTruePath = path.join(outDir, fileObj.subPath);
    fs.ensureFileSync(outTruePath);
    fs.writeFileSync(outTruePath, newCode.code);

    util.logOutPut(fileObj.truePath, outTruePath);
}
