/**
 * @file 文件收集系统，后续这里会添加文件的依赖关系，特别是图片
 */

const path = require('path');

class FileObj {

    constructor(subPath, entryDir) {
        this.subPath = subPath;
        this.entryDir = entryDir;
        this.truePath = path.join(entryDir, subPath);
        this.ext = path.extname(subPath);
        let fileLike = this.getLikeInfo(this.ext);
        this.isTempl = fileLike.isTempl;
        this.isStyle = fileLike.isStyle;
        this.isJson = fileLike.isJson;
        this.isJs = fileLike.isJs;
        this.isImg = fileLike.isImg;
    }

    getLikeInfo(ext) {
        const like = {
            isTempl: false,
            isStyle: false,
            isJson: false,
            isJs: false,
            isImg: false
        };
        switch (ext) {
            case '.js':
                like.isJs = true;
                break;
            case '.less':
            case '.sass':
            case '.styl':
            case '.scss':
            case '.css':
            case '.wcss':
            case '.acss':
                like.isStyle = true;
                break;
            case '.wxml':
            case '.axml':
            case '.swan':
                like.isTempl = true;
                break;
            case '.json':
                like.isJson = true;
                break;
            case '.svg':
            case '.png':
            case '.bmp':
            case '.gif':
            case '.jpe':
            case '.jpeg':
            case '.jpg':
            case '.webp':
                like.isImg = true;
                break;
        }
        return like;
    }


}

module.exports = FileObj;