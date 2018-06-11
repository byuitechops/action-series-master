/********************************
 * Grandchild Description
 * 
 * This grandchild goes through 
 * the item that is passed in and 
 * checks to see if all of the 
 * quicklinks work. If a quicklink
 * does not work, it will also go
 * ahead and make the fix on the 
 * quicklink.
 ********************************/

const canvas = require('canvas-wrapper');
const cheerio = require('cheerio');

const check = 'CANVAS_COURSE_REFERENCE';

var xmlArray = [];
var canvasPagesArray = [];

module.exports = (course, item, callback) => {
    try {
        var pageLink = false;

        if (item.techops.delete === true ||
            item.techops.getHTML(item) === null) {

            callback(null, course, item);
            return;
        } else {
            beginProcess();
        }

        /****************************************************************
         * beginProcess()
         *
         * This function begins the process and ensures that the arrays
         * are correctly populated before moving ahead with the quicklink
         * fixes.
         ******************************************************************/
        function beginProcess() {
            checkArrays((checkArraysErr) => {
                if (checkArraysErr) {
                    course.error(checkArraysErr);
                    callback(null, course, item);
                }

                checkPages();
                callback(null, course, item);
            });
        }

        /****************************************************************
         * checkArrays()
         *
         * @param checkArraysCallback - callback
         *  
         * This function ensures that the arrays are correctly populated.
         ******************************************************************/
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

                    checkArraysCallback(null);
                });
            } else {
                checkArraysCallback(null);
            }
        }

        /****************************************************************
         * checkPages()
         *
         * This function goes through the page and checks to see if there 
         * are any links. If links do exist, does the link contain 
         * CANVAS_COURSE_REFERENCE? If it does, the link is broken.
         ******************************************************************/
        function checkPages() {
            var pageProperties = [];

            var $ = cheerio.load(item.techops.getHTML(item));
            var links = $('a');

            //if there are no links, we can just move on...
            if (links.length < 1) {
                return;
            } else {
                //checking to see if a link meetings the criteria
                $(links).each((i, link) => {
                    if ($(link).attr('href')) {

                        if ($(link).attr('href').includes(check)) {
                            pageLink = true;
                        }
                    }
                });

                //one or more links meets the criteria. let's move to fix the links
                if (pageLink) {
                    $(links).each((i, link) => {
                        var url = $(link).attr('href');

                        //get the ID and XML properties
                        if (url && url.includes(check)) {
                            var obj = matchXMLPages(url, url.split('/').pop());

                            //check to see if obj is empty object
                            if (Object.keys(obj).length === 0) {
                                course.warning('Hmm, there is a problem with the course. An assignment never existed in Brightspace but is trying to exist in Canvas somehow.');
                                return;
                            } else {
                                pageProperties.push(obj);
                            }
                        }
                    });

                    //we have finished getting all of the properties we need to fix the link
                    getCorrectLinks(pageProperties);
                }
            }

            return;
        }

        /****************************************************************
         * matchXMLPages()
         * 
         * @param url - str
         * @param srcId - int
         * 
         * This function goes through the XML array and matches the srcId
         * with each XML code. If it matches, we have found the correct
         * page so we just build an object of stuff we need and return it.
         ******************************************************************/
        function matchXMLPages(url, srcId) {
            var returnObj = {};

            xmlArray.forEach((xml) => {
                if (srcId === xml.code) {
                    returnObj = {
                        'srcId': srcId,
                        'url': url,
                        'd2l': xml,
                    };
                }
            });

            return returnObj;
        }

        /****************************************************************
         * getCorrectLinks()
         * 
         * @param pageProperties - array of objects
         * 
         * This function acts as a driver for obtaining the correct link
         * for the page then creating an object to be added to the array 
         * of broken links. 
         ******************************************************************/
        function getCorrectLinks(pageProperties) {
            var brokenLinks = [];

            //go through each object in pageProperties and set up
            //obj to be fixed.
            pageProperties.forEach((link) => {
                var newUrl = getCanvasUrl(link);

                if (!newUrl) {
                    course.warning(`${link.d2l.page} has been removed from it's module for an unknown reason, but still exists in the course.`);
                    return;
                }

                brokenLinks.push({
                    'badLink': link.url,
                    'newLink': newUrl.html_url
                });
            });

            repairLinks(brokenLinks);
            return;
        }

        /****************************************************************
         * getCanvasUrl()
         * 
         * @param link - pageProperties object
         * 
         * This function goes through the Canvas array and finds the 
         * correct page and returns the link for that page.
         ******************************************************************/
        function getCanvasUrl(link) {
            var thingsToNotTouch = [
                'Dropbox',
                'Assignment',
            ];

            var isThingToNotTouch = thingsToNotTouch.find(element => link.d2l.page.includes(element));

            if (isThingToNotTouch === undefined) {
                var page = canvasPagesArray.find(canvasPage => link.d2l.page.includes(canvasPage.title));

                return page;
            }

            return null;
        }

        /****************************************************************
         * repairLinks()
         * 
         * @param brokenLinks - array of objects
         * 
         * This function is what makes this whole grandchild work. This 
         * function goes through and replaces all occurrences of each broken
         * link with the new, working link. After replacement, a log is then
         * added for report tracking. Once this has been completed, the HTML
         * is then set for replacement so it can be uploaded to Canvas.
         ******************************************************************/
        function repairLinks(brokenLinks) {
            var title = item.techops.getTitle(item);
            var logName = 'Broken Description Quicklinks';
            var $ = cheerio.load(item.techops.getHTML(item));
            var links = $('a');

            //this replaces ALL occurrences of the same link if
            //multiple links appear in the same page.
            brokenLinks.forEach((element) => {
                links.attr('href', (i, link) => {
                    if (link) {
                        return link.replace(element.badLink, element.newLink);
                    }
                });

                //for report tracking
                course.log(logName, {
                    'badLink': element.badLink,
                    'newLink': element.newLink,
                    'page': title,
                });
            });

            //set the item to be pushed to Canvas
            item.techops.setHTML(item, $.html());
            return;
        }

        /****************************************************************
         * buildXMLArray()
         * 
         * @param buildXMLArrayCallback - callback
         * 
         * This function goes through and builds the XML array with the 
         * stuff that we need for the grandchild.
         ******************************************************************/
        function buildXMLArray(buildXMLArrayCallback) {
            //find file location
            var file = course.content.find(file => file.name === 'imsmanifest.xml');

            //error handling
            if (file === undefined) {
                buildXMLArrayCallback(new Error('imsmanifest.xml not found'));
                return;
            }

            var $ = file.dom;

            $('item item').each((index, element) => {
                xmlArray.push({
                    'page': $(element).children('title').text(),
                    'code': element.attribs.identifier
                });
            });

            buildXMLArrayCallback(null);
        }

        /****************************************************************
         * buildCanvasArray()
         * 
         * @param buildCanvasArrayCallback - callback
         * 
         * This function goes through and builds the Canvas array with the 
         * stuff that we need for the grandchild.
         ******************************************************************/
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
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-description-quicklinks'
};