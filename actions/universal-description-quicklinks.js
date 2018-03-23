const asyncLib = require('async');
// const canvas = require('canvas');
const cheerio = require('cheerio');

var xmlArray = [];

module.exports = (course, item, callback) => {
    if (item.techops.delete === true ||
        item.techops.getHTML(item) === null) {
            callback(null, course, item);
            return;
    } else {
        beginProcess();
        callback(null, course, item);
    }

    function beginProcess() {
        buildXMLArray((err) => {
            if (err) {
                course.error(err);
                return;
            }

            return;
        });
    }

    function buildXMLArray(buildXMLArrayCallback) {
        //this is the path for the module in imsmanifest.xml
        var path = 'manifest > organizations > organization > item';

        var file = course.content.find((file) => {
            return file.name === 'imsmanifest.xml';
        });

        if (typeof file === 'undefined') {
            buildXMLArrayCallback(new Error('imsmanifest.xml not found'));
            return;
        }

        var $ = file.dom;
        $(path).each((index, module) => {
            var code = module.attribs.identifier;
            var page = module;
        });

    

        buildXMLArrayCallback(null);
    }
}