/**
 * @file 处理模板
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('../util.js');
const config = require('../config.js');
const parse5 = require('parse5');
const twoWayBindTag = {
    'scroll-view': ['scroll-top', 'scroll-left', 'scroll-into-view'],
    'input': ['value'],
    'textarea': ['value'],
    'movable-view': ['x', 'y'],
    'slider': ['value']
};
module.exports = function converJson(dir, aimType) {
    if (!aimType) {
        console.log('No aim type, do nothing...');
        return false;
    }
    console.log('Convering the templ files...');
    util.recursiveReadDir(dir, handleTempl(aimType));
};


function handleTempl(aimType) {
    // 这里可以针对不同的aimType做处理
    const aimFileType = config[aimType].templ;
    return async function (filePath) {
        if (path.extname(filePath) === `.${aimFileType}`) {
            let contentBuffer = await fs.readFile(filePath);
            // 包一层做适配
            let content = `<ast-wraper>${contentBuffer.toString()}</ast-wraper>`
            if (/search.wxml/.test(filePath)) {
                let ast = parse5.parseFragment(content);
                let newAst = traverseTemplAst(ast, config[aimType]);
                let newContent = parse5.serialize(newAst.childNodes[0]);
                
                fs.writeFile(filePath, newContent)
            }
        }
    }
}

function traverseTemplAst(ast, aimConfig) {
    // 数组继续递归
    if (Array.isArray(ast)) {
        return ast.map((item) => {
            traverseTemplAst(item, aimConfig);
        })
    }
    // 非数组进行判断
    let {
        tagName, attrs, childNodes
    } = ast;
    if (/^(?:import|include)$/.test(tagName)) { // 这些模板需要替换后缀
        ast = mapImport(ast, aimConfig.templ);
    } else if (twoWayBindTag[tagName]) { // 这些标签需要处理双向绑定的问题
        const twoWayBindAttr = twoWayBindTag[tagName];
        attrs.forEach((attr, index) => {
            let attrValue = ast.attrs[index].value;
            if (~twoWayBindAttr.indexOf(attr.name) && /{[{=].+[}=]}/.test(attrValue)) {
                ast.attrs[index].value = aimConfig.twoWayBind(attrValue.match(/{[{=](.+)[}=]}/)[1]);
            }
        });
    } else if (false) { // 指令转换

    } else if (false) { // 自定义组件转换

    }

    if (childNodes) {
        traverseTemplAst(ast.childNodes, aimConfig);
    }
    return ast;
}

function mapImport(ast, aimTempl) {
    let {
        attrs
    } = ast;
    for (let i = 0; i < attrs.length; i++) {
        if (attrs[i].name === 'src' && attrs[i].value) {
            attrs[i].value = attrs[i].value.replace(/(?:wxml|swan|axml)$/, aimTempl);
            if (!/\w+\.\w+/.test(attrs[i].value)) {
                attrs[i].value += `.${aimTempl}`;
            }
            break;
        }
    }
    return ast;
}