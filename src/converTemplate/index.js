/**
 * @file 处理模板
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('../util.js');
const config = require('../config.js');
const htmlparser = require('htmlparser2');
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
            await fs.writeFile(filePath, newContent);
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
    if (/^(?:ad|track-log)$/.test(name) && aimConfig.type !== 'baidu') { // 广告和统计是百度私有的
        ast.name = 'view';
        ast.attribs = {};
        ast.children = [];
    }
    if (/^(?:template)$/.test(name)) { // 百度小程序data扩展需要三个花括号
        ast = mapTemplate(ast, aimConfig.templateData);
    }
    // 后续有问题的组件，都写在这里
    if (/^(?:rich-text)$/.test(name)) {
        let tag = name.match(/^(rich-text)$/)[1];
        ast.name = aimConfig.tag[tag] ? name : 'view';
        if (!aimConfig.tag[tag]) {
            console.log(`${tag} is not supported for your aim app...`);
        }
    }
    if (twoWayBindTag[name]) { // 这些标签需要处理双向绑定的问题
        const twoWayBindAttr = twoWayBindTag[name];
        Object.keys(attribs).forEach((attrKey) => {
            let attrValue = attribs[attrKey];
            if (~twoWayBindAttr.indexOf(attrKey) && /{[{=].+[}=]}/.test(attrValue)) {
                ast.attribs[attrKey] = aimConfig.twoWayBind && aimConfig.twoWayBind(attrValue.match(/{[{=](.+)[}=]}/)[1]);
            }
        });
    }
    // 事件每家小程序都不太一样，要转换下
    ast = mapEvent(ast, aimConfig.event);
    // 指令转换
    ast = mapDirection(ast, aimConfig);
    // TODO自定义组件的一些处理，这里各家小程序gap比较大，没想好
    if (false) {

    }
    if (children && children.length) {
        traverseTemplAst(ast.children, aimConfig);
    }

    // 条件和循环同时出现了，要处理下，放在处理children之后处理，避免重复循环
    ast = handleIfWithFor(ast);

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

function mapTemplate(ast, aimTemplateData) {
    let data = ast.attribs.data;
    if (data) {
        // 扒掉括号
        while (/{((?:.|\s)*)}/gm.test(data)) {
            data = data.match(/{((?:.|\s)*)}/)[1];
        }
        ast.attribs.data = aimTemplateData(data);
    }
    return ast;
}

function mapEvent(ast, aimEvent) {
    let attribs = ast.attribs;
    let reg = /^(?:bind|catch|on):?(\w+)$/;
    for (let item in attribs) {
        if (reg.test(item)) {
            let eventName = item.match(reg)[1];
            let event = attribs[item];
            let newEventName = aimEvent && aimEvent(eventName);
            delete attribs[item];
            attribs[newEventName] = event;
        }
    }
    return ast;
}

function mapDirection(ast, aimConfig) {
    let attribs = ast.attribs;
    let aimPerfix = aimConfig.directivePerfix;
    let reg = /(wx:|a:|s-)(elif|else-if|if|else|for|for-index|for-item|key)/;
    let bracketsReg = /{{([^{]+)}}/;
    let baiduForReg = /^\s*(\w+)(?:\s*,\s*(\w+))?\s+in\s+(\S+)(?:\s+trackBy\s+(\S+))?\s*$/;
    for (let item in attribs) {
        if (reg.test(item)) {
            // 括号扒掉
            // attribs[item] = attribs[item].replace(bracketsReg, '$1');
            let newValue = attribs[item].replace(bracketsReg, '$1');
            let dirName = item.match(reg)[2];
            let newDir = `${aimPerfix}${dirName}`;
            delete attribs[item];
            if (/^(?:else-if|elif)$/.test(dirName)) {
                newDir = `${aimPerfix}${aimConfig.directiveIf.elseif}`;
            }
            attribs[newDir] = aimConfig.directiveBrackets(newValue);
            if (baiduForReg.test(newValue) && aimPerfix !== 's-') {
                let regRes = newValue.match(baiduForReg);
                let forArr = regRes[3];
                let forIndex = regRes[2];
                let forItem = regRes[1];
                let forKey = regRes[4];
                attribs[`${aimPerfix}for`] = aimConfig.directiveBrackets(forArr);
                forIndex && forIndex !== 'index' && (attribs[`${aimPerfix}for-index`] = forIndex);
                forItem && forItem !== 'item' && (attribs[`${aimPerfix}for-item`] = forItem);
                forKey && (attribs[`${aimPerfix}key`] = forKey);
            }
        }
    }
    return ast;
}

function handleIfWithFor(ast) {
    let {
        attribs,
        parent
    } = ast;
    let ifReg = /(wx:|a:|s-)(elif|else-if|if|else)/;
    let forReg = /(wx:|a:|s-)(for)/;
    let ifItmeName = '';
    let forItmeName = '';
    for (let item in attribs) {
        if (ifReg.test(item)) {
            ifItmeName = item;
        }
        if (forReg.test(item)) {
            forItmeName = item;
        }
    }
    if (ifItmeName && forItmeName) {
        let vNode = {
            type: 'tag',
            name: 'block',
            attribs: {},
            children: [ast],
            parent
        }
        vNode.attribs[ifItmeName] = attribs[ifItmeName];
        delete ast.attribs[ifItmeName];
        ast.parent.children = [vNode];
        return vNode;
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
    let tempStr = `${name} ${attrStr}`;
    return selfClose && !content ? `<${tempStr} />` : `<${tempStr}>${content}</${name}>`;
}


function attrsToString(attrs = {}, singleQuoteAttribs) {
    let resArr = [];
    for (let item in attrs) {
        let value = attrs[item];
        let attStr = value ? `${item}="${value}"` : item;
        resArr.push(attStr);
    }
    return resArr.join(' ');
}
