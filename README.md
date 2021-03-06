# smart app converter
## 使用方式
```
git clone
npm link
killswan -w <srcPath> [outputPath]
```
## 使用前提
- 对于```template```的传参，请使用扩展符```{{...data}}```，如果实在你憋不住使用了```{{a:1,b:2}}```这种写法，对象逗号之间请不要换行，后续考虑支持下，暂时没时间了
- 对于```template```，请不要给这个标签上加```class```
- 一切模板到```js```的内容，请使用```{{}}```包裹，不管当前有没有报错，都要这么处理，不然会gg
- 样式文件中，请尽量不要使用通配符```*```，否则会给将```*```转换为所有的组件名字
- 请定时查阅小程序官方文档，使用推荐语法开发
- ```setData()```的参数，请使用```setData({a: 1})```这样的写法，不要写```setData(a, 1)```，没空转了

## 脚本都做了啥
### 模板相关
- 使用```<!--weixin begin--> your code <!--weixin end-->```来标注独占功能
- 对```import```模板的后缀名修改
- 对不支持的组件替进行替换，目前替换成```<view>```
- 对双向绑定的语法进行替换
- 对事件的语法进行替换
- 对指令的语法进行替换
- 如果模板中一个标签内，同时使用```if、elseif、else```和```for```会将条件判断进行提升，并使用```block```包裹
### js相关
- 使用```/***weixin begin***/ your code /***weixin end***/```来标注独占功能
- 使用以上语法可能再无法通过```eslint```，例如同时对一个变量使用```let```会提示错误，那么在```globalData```里注入了```__type__```，页面可以根据这个值来进行判断
- 对命名空间进行替换

### 样式相关
- ~~支持less（注：less会替换到当前文件夹下的css文件~~
- 由于微信小程序不允许样式文件中```background```引用本地资源，统一做了base64转换
- 对通配符```*```做了替换

### 其他
- 对文件后缀名替换
- 在项目根目录添加```conver.config.json```文件，目前支持配置pages参数，配置后，会在转换时将```pages```目录下不相关目录删除，同时会删除```app.json```下的```pages```变量，示例：
```json
{
    "baidu": {
        "pages": [
            "pages/index/index",
        ]
    },
    "weixin": {
        "pages": [
            "pages/index/index",
        ]
    },
    "zhifubao": {
        "pages": [
            "pages/index/index",
        ]
    }
}
```
## TODO
- 对不支持的api需要warning
- 对自定义组件需要优化
- 对自闭合标签需要收集，目前只处理了```import, include, input ```
- 对json的配置需要优化
- 没有对模板语法中的括号进行递归判断，默认用户的输入是合法的