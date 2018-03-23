const asyncLib = require('async');
const canvas = require('canvas');
const cheerio = require('cheerio');

var xmlArray = [];
var canvasPagesArray = [];

module.exports = (course, item, callback) => {
    if (item.techops.delete === true ||
        item.techops.getHTML(item) === null) {
            callback(null, course, item);
            return;
    } else {
        beginProcess();
    }

    function beginProcess() {
        checkArrays((checkArraysErr) => {
            if (checkArraysErr) {
                course.err(checkArraysErr);
                callback(null, course, item);
            }
        });
    }

    function checkArrays(checkArraysCallback) {
        if (xmlArray.length < 1) {
            buildXMLArray((err) => {
                if (err) {
                    checkArraysCallback(err);
                    return;
                }
            });
        }

        if (canvasPagesArray.length < 1) {
            buildCanvasArray((err) => {
                if (err) {
                    checkArraysCallback(err);
                    return;
                }
            });
        }

        checkArraysCallback(null);
    }

    function buildXMLArray(buildXMLArrayCallback) {
        //this is the path for the module in imsmanifest.xml
        var path = 'manifest > organizations > organization > item > item';

        var file = course.content.find((file) => {
            return file.name === 'imsmanifest.xml';
        });

        if (typeof file === 'undefined') {
            buildXMLArrayCallback(new Error('imsmanifest.xml not found'));
            return;
        }

        var $ = file.dom;
        $(path).each((index, module) => {
            var obj = {
                'code': module.attribs.identifier,
                'page': module.children[1].children[0].data,
            }

            // console.log(module.children[1].children);

            xmlArray.push(obj);
        });

        buildXMLArrayCallback(null);
    }

    function buildCanvasArray(buildCanvasArrayCallback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/pages`, (getErr, pages) => {
            if (getErr) {
                buildCanvasArrayCallback(getErr);
                return;
            }

            canvasPagesArray = [...pages];

            buildCanvasArrayCallback(null);
        });
    }
}