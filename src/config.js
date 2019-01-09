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
        event: (eventName, eventPerf) => {
            if (eventPerf === 'on') {
                eventPerf = 'bind';
            }
            return `${eventPerf}${eventName}`;
        },
        directivePerfix: 's-',
        directiveBrackets: data => data,
        directiveIf: {
            elseif: 'else-if'
        },
        tag: {
            'richText': true
        },
        templateData: data => `{{{ ${data} }}}`
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
        event: (eventName, eventPerf) => {
            if (eventPerf === 'on') {
                eventPerf = 'bind';
            }
            return `${eventPerf}${eventName}`;
        },
        directivePerfix: 'wx:',
        directiveIf: {
            elseif: 'elif'
        },
        tag: {
            'rich-text': true
        },
        templateData: data => `{{ ${data} }}`
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
        event: (eventName, eventPerf) => {
            eventName = eventName.trim().replace(/^[a-z]/g, (L) => L.toUpperCase());
            if (eventPerf !== 'catch') {
                eventPerf = 'on';
            }
            return `${eventPerf}${eventName}`;
        },
        directivePerfix: 'a:',
        directiveIf: {
            elseif: 'elif'
        },
        tag: {
            'rich-text': false
        },
        templateData: data => `{{ ${data} }}`
    }
};
