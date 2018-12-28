/**
 * @file 文件格式映射
 */

module.exports = {
    baidu: {
        type: 'baidu',
        templ: 'swan',
        json: 'json',
        js: 'js',
        style: 'css',
        class: 'swan',
        api: {},
        twoWayBind: data => `{= ${data} =}`,
        event: eventName => `bind${eventName}`,
        directivePerfix: 's-',
        directiveBrackets: data => data,
        directiveIf: {
            elseif: 'else-if'
        }
    },
    weixin: {
        type: 'weixin',
        templ: 'wxml',
        json: 'json',
        js: 'js',
        style: 'wxss',
        class: 'wx',
        api: {},
        twoWayBind: data => `{{ ${data} }}`,
        directiveBrackets: data => data ? `{{ ${data} }}` : '',
        event: eventName => `bind${eventName}`,
        directivePerfix: 'wx:',
        directiveIf: {
            elseif: 'elif'
        }
    },
    zhifubao: {
        type: 'zhifubao',
        templ: 'axml',
        json: 'json',
        js: 'js',
        style: 'acss',
        class: 'my',
        api: {},
        twoWayBind: data => `{{ ${data} }}`,
        directiveBrackets: data => data ? `{{ ${data} }}` : '',
        event: eventName => {
            eventName = eventName.trim().replace(/^[a-z]/g, (L) => L.toUpperCase());
            return `on${eventName}`;
        },
        directivePerfix: 'a:',
        directiveIf: {
            elseif: 'elif'
        }
    }
};
