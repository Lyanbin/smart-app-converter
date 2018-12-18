/**
 * @file js文件处理
 */

 const path = require('path');
 const util = require('../util.js');
 
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
     return function (filePath) {
         if (path.extname(filePath) === '.js') {
             // 对js处理
             // TODO

         }
     }
 }