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
            let contentStr = contentBuffer.toString();
            // 对保留的内容标识符修改
            let needReg = new RegExp(`\\<\\!--${aimType} begin--\\>([\\s\\S]*?)\\<\\!--${aimType} end--\\>`, 'g');
            contentStr = contentStr.replace(needReg, `<!--${aimType} only begin-->$1<!--${aimType} only end-->`);
            // 正则删掉独有的内容
            contentStr = contentStr.replace(/\<\!--(weixin|baidu|zhifubao) begin--\>[\s\S]*?\<\!--\1 end--\>/g, '');
            // 包一层做适配
            let content = `<ast-wraper>${contentStr}</ast-wraper>`
            // TODO 这里if做例子，后续删除
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
        tagName, attrs, childNodes, nodeName, data
    } = ast;
    // if (nodeName === '#comment' && data === 'wx begin') { // 删除片段
    //     let parentNode = ast.parentNode || {};
    //     let peerNode = parentNode.childNodes || [];
    //     ast.parentNode.childNodes = removeIncoherentNode(peerNode, aimConfig);
    // }
    if (/^(?:import|include)$/.test(tagName)) { // 这些模板需要替换后缀
        ast = mapImport(ast, aimConfig.templ);
    }
    if (twoWayBindTag[tagName]) { // 这些标签需要处理双向绑定的问题
        const twoWayBindAttr = twoWayBindTag[tagName];
        attrs.forEach((attr, index) => {
            let attrValue = ast.attrs[index].value;
            if (~twoWayBindAttr.indexOf(attr.name) && /{[{=].+[}=]}/.test(attrValue)) {
                ast.attrs[index].value = aimConfig.twoWayBind(attrValue.match(/{[{=](.+)[}=]}/)[1]);
            }
        });
    }

    if (false) { // 指令转换

    }
    if (false) { // 自定义组件转换

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

// function removeIncoherentNode(astArr, config) {
//     let type = config.type;
//     let beginFlag = `${type} begin`;
//     let endFlag = `${type} end`;
//     let beginIndex = -1;
//     let endIndex = -1;

//     for (let i = 0; i < astArr.length; i++) {
//         const node = astArr[i];
//         if (node.nodeName === '#comment') {
//             if (node.data === beginFlag) {
//                 beginIndex = i;
//             }
//             if (node.data === endFlag) {
//                 endIndex = i;
//             }
//         }
//     }
//     if (~beginIndex && endIndex > beginIndex) {
//         astArr
//     }
// }