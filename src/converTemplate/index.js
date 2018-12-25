/**
 * @file 处理模板
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('../util.js');
const config = require('../config.js');
const htmlparser = require("htmlparser2");
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
            let content = `<ast-wraper>${contentStr}</ast-wraper>`;
            // TODO 这里if做例子，后续删除
            if (/search.wxml/.test(filePath)) {
                const DomHandler = new htmlparser.DomHandler();
                const Parser = new htmlparser.Parser(DomHandler, {
                    xmlMode: false,
                    lowerCaseAttributeNames: false,
                    recognizeSelfClosing: true,
                    lowerCaseTags: false
                });
                Parser.end(content);
                let ast = DomHandler.dom;
                let newAst = traverseTemplAst(ast, config[aimType]);
                let newContent = returnHtmlFromAst(newAst);
                fs.writeFile(filePath, newContent);
            }
        }
    };
}

function traverseTemplAst(ast, aimConfig) {
    // 数组继续递归
    if (Array.isArray(ast)) {
        ast.map(item => {
            return traverseTemplAst(item, aimConfig);
        });
    }
    // 非数组进行判断
    let {
        name,
        attribs,
        children
    } = ast;
    if (/^(?:import|include)$/.test(name)) { // 这些模板需要替换后缀
        ast = mapImport(ast, aimConfig.templ);
    }
    if (twoWayBindTag[name]) { // 这些标签需要处理双向绑定的问题
        const twoWayBindAttr = twoWayBindTag[name];
        Object.keys(attribs).forEach((attrKey) => {
            let attrValue = attribs.attrKey;
            if (~twoWayBindAttr.indexOf(attrKey) && /{[{=].+[}=]}/.test(attrValue)) {
                ast.attribs.attrKey = aimConfig.twoWayBind && aimConfig.twoWayBind(attrValue.match(/{[{=](.+)[}=]}/)[1]);
            }
        });
    }
    // 事件每家小程序都不太一样，要转换下
    ast = mapEvent(ast, aimConfig.event);
    if (false) { // 指令转换

    }
    if (false) { // 自定义组件转换

    }
    if (children && children.length) {
        traverseTemplAst(ast.children, aimConfig);
    }
    return ast;
}

function mapImport(ast, aimTempl) {
    let attrs = ast.attribs;
    for (let item in attrs) {
        if (item === 'src' && attrs[item]) {
            attrs[item] = attrs[item].replace(/(?:wxml|swan|axml)$/, aimTempl);
            if (!/\w+\.\w+/.test(attrs[item])) {
                attrs[item] += `.${aimTempl}`;
            }
            break;
        }
    }
    return ast;
}

function mapEvent(ast, aimEvent) {
    let attribs = ast.attribs;
    let reg = /(?:bind|catch|on):?(\w+)/;
    for (let item in attribs) {
        if (reg.test(item)) {
            let eventName = item.match(reg)[1];
            let event = attribs[item];
            let newEventName = aimEvent && aimEvent(eventName);
            attribs[newEventName] = event;
            delete attribs[item];
        }
    }
    return ast;
}


function returnHtmlFromAst(ast) {
    if (!ast) {
        return '';
    }
    if (Array.isArray(ast)) {
        let res = '';
        ast.map((item, index) => {
            res += returnHtmlFromAst(item);
        });
        return res;
    }
    let {
        type,
        data,
        name,
        children
    } = ast;
    switch (type) {
        case 'tag': {
            if (name === 'ast-wraper') {
                return returnHtmlFromAst(children);
            }
            let str = '';
            children.map((item, index) => {
                str += returnHtmlFromAst(item);
            });
            return astNodeToString(ast, str);
        }
        case 'text':
            return data;
        case 'comment':
            return `<!--${data}-->`;
    }
}

function astNodeToString(astNode, content) {
    let {
        name,
        attribs,
        singleQuoteAttribs = {},
        selfClose
    } = astNode;
    let attrStr = attrsToString(attribs, singleQuoteAttribs);
    let tempStr = `${name} ${attrStr}`
    return selfClose && !content ? `<${tempStr} />` : `<${tempStr}>${content}</${name}>`
}


function attrsToString(attrs = {}, singleQuoteAttribs) {
    let resArr = [];
    for (let item in attrs) {
        let value = attrs[item];
        resArr.push(`${item}="${value}"`);
    }
    return resArr.join(' ');
}
