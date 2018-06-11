/**************************************************
 * Grandchild description
 * 
 * This module is a replicate of the child module
 * titled, 'repair-quicklinks'. It simply parses the
 * item passed in and checks to see if any dropbox
 * quicklinks exist since all dropbox quicklinks
 * break during import. This will also make the fix
 * if it finds a dropbox quicklink (even if there
 * are multiple occurrences on the same page).
 **************************************************/

const asyncLib = require('async');
const cheerio = require('cheerio');
const canvas = require('canvas-wrapper');

var xmlAssignments = [];
var canvasAssignments = [];

module.exports = (course, item, callback) => {
    try {

        // no need to check items that will be deleted
        if (item.techops.delete === true || item.techops.getHTML(item) === null) {
            callback(null, course, item);
            return;
        }

        beginProcess();

        /****************************************************************
         * beginProcess
         * 
         * This function acts as a driver for the program. It waterfalls 
         * all of the functions and makes sure that they are completed.
         ******************************************************************/
        function beginProcess() {
            // ensure that the arrays are correctly populated before
            // starting the repairLinks grandchild.
            // checkArrays is done in async.
            checkArrays((err) => {
                if (err) {
                    course.error(err);
                    callback(null, course, item);
                    return;
                }

                parseItem();
                callback(null, course, item);
            });
        }

        /****************************************************************
         * checkArrays
         * 
         * @param checkArraysCallback - callback
         * 
         * This function needs to happen before everything. This goes through
         * and ensure that everything has been set up correctly so the program
         * doesn't have to parse the XML or make API calls 9000 times for the 
         * entire grandchild module to run. 
         ******************************************************************/
        function checkArrays(checkArraysCallback) {
            var functions = [
                buildXMLArray,
                buildCanvasArray
            ];

            // waterfall through the functions to help ensure that the 
            // arrays are actually completed.     
            asyncLib.waterfall(functions, (waterfallErr) => {
                if (waterfallErr) {
                    checkArraysCallback(waterfallErr);
                    return;
                }

                checkArraysCallback(null);
            });
        }

        /****************************************************************
         * buildXMLArray
         * 
         * @param buildXMLArrayCallback - callback
         * 
         * This function needs to happen before everything. This goes through
         * and ensure that the XML array has been set up correctly so the program
         * doesn't have to parse the XML 9000 times.
         ******************************************************************/
        function buildXMLArray(buildXMLArrayCallback) {
            if (xmlAssignments.length < 1) {
                constructXMLAssignments((err) => {
                    if (err) {
                        buildXMLArrayCallback(err);
                        return;
                    }

                    buildXMLArrayCallback(null);
                });
            } else {
                buildXMLArrayCallback(null);
            }
        }

        /****************************************************************
         * buildCanvasArrayCallback
         * 
         * @param buildCanvasArrayCallback - callback
         * 
         * This function needs to happen before everything. This goes through
         * and ensure that the canvas array has been set up correctly so the 
         * program doesn't have to make API calls 9000 times.
         ******************************************************************/
        function buildCanvasArray(buildCanvasArrayCallback) {
            if (canvasAssignments.length < 1) {
                constructCanvasAssignments((err) => {
                    if (err) {
                        buildCanvasArrayCallback(err);
                        return;
                    }

                    buildCanvasArrayCallback(null);
                });
            } else {
                buildCanvasArrayCallback(null);
            }
        }

        /****************************************************************
         * constructCanvasAssignments
         * 
         * @param constructCanvasAssignmentsCallback - callback
         * 
         * At this point, we already know that the canvasAssignments array
         * is already empty so we make an API call to retrieve an array 
         * of all the assignments in the course. This helps reduce the need
         * for API calls down to 1 for this entire grandchild.
         ******************************************************************/
        function constructCanvasAssignments(constructCanvasAssignmentsCallback) {
            canvas.get(`/api/v1/courses/${course.info.canvasOU}/assignments`, (getErr, assignments) => {
                if (getErr) {
                    constructCanvasAssignmentsCallback(getErr);
                    return;
                }

                // move the contents from the assignments to canvasAssignments array
                canvasAssignments = [...assignments];

                constructCanvasAssignmentsCallback(null);
            });
        }

        /****************************************************************
         * parseItem
         * 
         * This function goes through and parses the page's body. This 
         * function utilizes cheerio to grab all of the links and analyze
         * each link. If there are no links or dropbox links, this function
         * will cause the grandchild to exit early to move on. 
         ******************************************************************/
        function parseItem() {
            var itemPropertiesArray = [];

            // begin parsing the page through the getHTML properties
            var $ = cheerio.load(item.techops.getHTML(item));
            var links = $('a');

            // no links are found on the page so return!
            if (links.length === 0) {
                return;
                // links are found. let's check each to see if they are dropbox links
            } else {
                var arr = $(links).filter((i, link) => $(link).attr('href') && $(link).attr('href').includes('drop_box'));

                if (arr.length > 0) {
                    arr.each((index, link) => {
                        var url = $(link).attr('href');
                        var srcId = url.split('drop_box_').pop();

                        itemPropertiesArray.push(...matchXMLAssignments(url, srcId));
                    });

                    // pass array in to get correct Canvas dropbox
                    getCorrectLinks(itemPropertiesArray);
                }
            }

            return;
        }

        /****************************************************************
         * matchXMLAssignments
         * 
         * @param url - string
         * @param srcId - int
         * 
         * This function goes through all of the xmlAssignments and check to 
         * see if the srcId matches any of them. If it matches, I pull the 
         * properties and build an obj out of it. This object is needed to 
         * be able to access the element of XMLAssignments for the api call
         * in getCorrectLinks()
         ******************************************************************/
        function matchXMLAssignments(url, srcId) {
            var itemProperties = [];

            xmlAssignments.forEach((xmlAssignment) => {
                if (srcId === xmlAssignment.id) {

                    //build object to make life easier
                    itemProperties.push({
                        'srcId': srcId,
                        'd2l': xmlAssignment,
                        'url': url
                    });
                }
            });

            // return the array to be utilized to find the correct Canvas dropbox
            return itemProperties;
        }

        /****************************************************************
         * getCanvasUrl
         * 
         * @param link - obj => srcId str, d2l str, url str
         * 
         * This function makes an API call to the assignments to obtain the
         * correct url for the dropbox.
         ******************************************************************/
        function getCanvasUrl(link) {
            //find the Canvas assignment that we are looking for.
            return canvasAssignments.find(canvasAssignment => canvasAssignment.name === link.d2l.name);
        }

        /****************************************************************
         * getCorrectLinks
         * 
         * @param itemPropertiesArray - array => srcId int, d2l XML obj, url string
         * 
         * This function makes an API call to the assignments to obtain the
         * correct url for the dropbox.
         ******************************************************************/
        function getCorrectLinks(itemPropertiesArray) {
            var brokenLinks = [];

            itemPropertiesArray.forEach((link) => {
                // retrieve correct Dropbox link
                var newUrl = getCanvasUrl(link);

                // the Canvas Dropbox does not exist in the course
                if (!newUrl) {
                    course.warning('You may want to investigate this course a little bit more since a dropbox is missing.');
                    return;
                }

                // build object and add to array to help repairLinks have an easier time
                brokenLinks.push({
                    'badLink': link.url,
                    'newLink': newUrl.html_url
                });

            });

            repairLinks(brokenLinks);
            return;
        }

        /****************************************************************
         * repairLinks
         *
         * @param brokenLinks - array => badLink string, newLink string
         *  
         * This function goes through and fixes all of the dropbox links
         * inside brokenLinks array.
         ******************************************************************/
        function repairLinks(brokenLinks) {
            var title = item.techops.getTitle(item);
            var logName = 'Fixed Broken Dropbox Links';
            var $ = cheerio.load(item.techops.getHTML(item));
            var links = $('a');

            // this forEach actually goes through each link and replaces the 
            // bad link with the proper link. In addition, the way this is 
            // set up, it'll fix all of the occurrences of the same link
            // if needed.
            brokenLinks.forEach((element) => {
                links.attr('href', (index, link) => {
                    return link.replace(element.badLink, element.newLink);
                });

                // log to make life easier for everyone
                item.techops.log(logName, {
                    'Bad Link': element.badLink,
                    'New Link': element.newLink,
                    'page': title,
                });
            });

            item.techops.setHTML(item, $.html());

            return;
        }

        /****************************************************************
         * constructXMLAssigments
         * 
         * This function retrieves the dropbox_d2l.xml which holds all of
         * the dropbox information through a different function. This 
         * function then parses the xml file and stores all of the 
         * information in an array.
         ******************************************************************/
        function constructXMLAssignments(constructXMLAssigmentsCallback) {
            // retrieve the dropbox_d2l.xml file
            var dropbox = course.content.find(file => file.name === 'dropbox_d2l.xml');

            //checking to see if the dropbox xml really has been found
            if (dropbox !== undefined) {
                var $ = dropbox.dom;

                // iterate through the xml nodes and retrieve the id and name 
                // of each dropbox folder
                $('dropbox > folder').each((index, folder) => {
                    var obj = {
                        name: folder.attribs.name,
                        id: folder.attribs.id
                    };

                    xmlAssignments.push(obj);
                });

                constructXMLAssigmentsCallback(null);
            } else {
                // If there are no dropbox xml files why do we even bother to check the assignments?
                canvas.getAssignments(course.info.canvasOU, (getAssignmentsErr, assignments) => {
                    if (getAssignmentsErr) {
                        constructXMLAssigmentsCallback(getAssignmentsErr);
                        return;
                    }

                    if (assignments.length === 0) {
                        course.warning('No assignments were found in the course.');
                        // is this supposed to be callback, or constructXMLAssigmentsCallback?
                        callback(null, course, item);
                    } else {
                        // We just don't care to throw a warning. Also, this error triggers multiple times for the same reason
                        /* course.error(new Error('Dropboxes exist in the course but there is no dropbox_d2l.xml file to work with.')); */
                        constructXMLAssigmentsCallback(null);
                    }
                });
            }
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-fix-dropbox-links'
};