const asyncLib = require('async');
const cheerio = require('cheerio');
const canvas = require('canvas-wrapper');

var xmlAssignments = [];
var canvasAssignments = [];

module.exports = (course, item, callback) => {

    var itemDropboxLink = false;

    //no need to check items that will be deleted
    if (item.techops.delete === true || item.techops.getHTML(item) === null) {
        callback(null, course, item);
        return;
    } else {
        beginProcess((err) => {
            if (err) {
                course.error(err);
                callback(null, course, item);
                return;
            }

            callback(null, course, item);
        });
    }

    /****************************************************************
     * beginProcess
     * 
     * This function acts as a driver for the program. It waterfalls 
     * all of the functions.
    ******************************************************************/
    function beginProcess(beginProcessCallback) {
        var functions = [
            checkArrays,
            parseItem,
            getCorrectLinks,
            repairLinks,
        ];

        asyncLib.waterfall(functions, (waterfallErr) => {
            if (waterfallErr) {
                beginProcessCallback(waterfallErr);
                return;
            }

            beginProcessCallback(null);
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
                    buildXMLArrayCallback(err);
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
        var assignmentsHolder = [];

        canvas.get(`/api/v1/courses/${course.info.canvasOU}/assignments`, (getErr, assignments) => {
            if (getErr) {
                constructCanvasAssignmentsCallback(err);
                return;
            }
            
            // //move the contents from the assignments to canvasAssignments array
            // assignmentsHolder.clone(assignments);
            // canvasAssignments = assignmentsHolder[0];
            canvasAssignments = [...assignments];

            constructCanvasAssignmentsCallback(null);
        });
    }

    /****************************************************************
     * parseItem
     * 
     * @param parseItemCallback - callback
     * 
     * This function goes through and parses the page's body. This 
     * function utilizes cheerio to grab all of the links and analyze
     * each link. If there are no links or dropbox links, this function
     * will cause the grandchild to exit early to move on. 
    ******************************************************************/
    function parseItem(parseItemCallback) {
        var itemPropertiesArray = [];

        //begin parsing the page through the getHTML properties
        var $ = cheerio.load(item.techops.getHTML(item));
        var links = $('a');

        //no links are found on the page so return!
        if (links.length < 0) {
            course.message(`${item.techops.getTitle(item)} page: no links found.`);
            return;
            //links are found. let's check each to see if they are dropbox links
        } else {
            $(links).each((index, link) => {
                if ($(link).attr('href').indexOf('drop_box') != -1) {
                    itemDropboxLink = true;
                }
            });

            //we have found one ore more dropbox links.
            if (itemDropboxLink) {
                course.message(`${item.techops.getTitle(item)} page: identified dropbox links on page.`);

                asyncLib.each($(links), (link, eachCallback) => {
                    var url = $(link).attr('href');

                    //we know here that the link is a dropbox link.
                    if (url.includes('drop_box')) {
                        var srcId = url.split('drop_box_').pop();

                        //identify which XML portion is for which dropbox. 
                        //this is how the matching is done
                        matchXMLAssignments(url, srcId, (matchXMLAssignmentsErr, itemProperties) => {
                            if (matchXMLAssignmentsErr) {
                                parseItem(matchXMLAssignmentsErr);
                                return;
                            }

                            itemPropertiesArray.push(...itemProperties);
                        });
                    }

                    eachCallback(null);
                }, (eachErr) => {
                    if (eachErr) {
                        parseItemCallback(eachErr);
                        return;
                    }

                    parseItemCallback(null);
                });

                parseItemCallback(null, itemPropertiesArray);
                //links are present in the page but none are dropbox links. 
                //call the callback to exit out of grandchild.
            } else {
                course.message(`${item.techops.getTitle(item)} page: links present but no dropbox links found.`);
            }
        }
    }

    /****************************************************************
     * matchXMLAssignments
     * 
     * @param url - string
     * @param srcId - int
     * @param matchXMLAssignmentsCallback - callback
     * 
     * This function goes through all of the xmlAssignments and check to 
     * see if the srcId matches any of them. If it matches, I pull the 
     * properties and build an obj out of it. This object is needed to 
     * be able to access the element of XMLAssignments for the api call
     * in getCorrectLinks()
    ******************************************************************/
    function matchXMLAssignments(url, srcId, matchXMLAssignmentsCallback) {
        var itemProperties = [];

        asyncLib.each(xmlAssignments, (xmlAssignment, eachCallback) => {
            if (srcId === xmlAssignment.id) {
                course.message(`${item.techops.getTitle(item)} page: found a match for dropbox link. About to proceed to fix link.`)

                var obj = {
                    'srcId': srcId,         //srcId to keep track of it
                    'd2l': xmlAssignment,   //xmlAssignment element that matched with srcId
                    'url': url              //page's url for logging
                };

                itemProperties.push(obj);

                eachCallback(null);
            } else {
                eachCallback(null);
            }
        }, (eachErr) => {
            if (eachErr) {
                matchXMLAssignmentsCallback(eachErr);
                return;
            }

            matchXMLAssignmentsCallback(null, itemProperties);
        });
    }

    /****************************************************************
     * getCorrectLinks
     * 
     * @param itemProperties - array => srcId int, d2l XML obj, url string
     * @param getCorrectLinksCallback - callback
     * 
     * This function makes an API call to the assignments to obtain the
     * correct url for the dropbox.
    ******************************************************************/
    function getCorrectLinks(itemProperties, getCorrectLinksCallback) {
        var brokenLinks = [];

        //there may be multiple broken dropbox links on the same page.
        asyncLib.each(itemProperties, (page, eachCallback) => {
            var newUrl = '';

            console.log(`Page: ${JSON.stringify(page)}`);

            asyncLib.each(canvasAssignments, (canvasAssignment, innerEachCallback) => {
                if (canvasAssignment.name === page.d2l.name) {
                    newUrl = canvasAssignment.html_url;
                    innerEachCallback(null);
                } else {
                    innerEachCallback(null);
                }
            }, (innerEachErr) => {
                if (innerEachErr) {
                    eachCallback(innerEachErr);
                    return;
                }

                eachCallback(null);
            });

            console.log(`newURL: ${newUrl}`);
            if (newUrl === '' || typeof newUrl === "undefined") {
                eachCallback(new Error(`${item.techops.getTitle(item)}. Assignment in Canvas not found. Please check the course then try again.`));
                return;
            }

            var obj = {
                'badLink': page.url,
                'newLink': newUrl
            };

            brokenLinks.push(obj);

            eachCallback(null);
        }, (eachErr) => {
            if (eachErr) {
                getCorrectLinksCallback(eachErr);
                return;
            }

            getCorrectLinksCallback(null, brokenLinks);
        });
    }

    /****************************************************************
     * repairLinks
     *
     * @param brokenLinks - array => badLink string, newLink string
     * @param repairLinksCallback - callback
     *  
     * This function goes through and fixes all of the dropbox links
     * inside brokenLinks array.
    ******************************************************************/
    function repairLinks(brokenLinks, repairLinksCallback) {
        var title = item.techops.getTitle(item);

        var $ = cheerio.load(item.techops.getHTML(item));
        var links = $('a');

        console.log(`brokenLinks: ${JSON.stringify(brokenLinks)}`);        

        //this fixes all of the occurrences of the same link 
        brokenLinks.forEach((item) => {
            links.attr('href', (index, link) => {
                return link.replace(item.badLink, item.newLink);
            });

            course.log('Fixed Broken Dropbox Quicklinks', {
                'badLink': item.badLink,
                'newLink': item.newLink,
                'page': title,
            });
        });

        item.techops.setHTML(item, $.html());

        repairLinksCallback(null);
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
        //retrieve the dropbox_d2l.xml file
        var dropbox = course.content.find((file) => {
            return file.name === `dropbox_d2l.xml`;
        });

        //checking to see if the dropbox xml really has been found
        if (typeof dropbox != "undefined") {
            var $ = dropbox.dom;

            //iterate through the xml nodes and retrieve the id and name 
            //of each dropbox folder
            $('dropbox > folder').each((index, folder) => {
                var obj = {
                    name: folder.attribs.name,
                    id: folder.attribs.id
                };

                xmlAssignments.push(obj);
            });
            constructXMLAssigmentsCallback(null);
        } else {
            // course.error(`${item.techops.getTitle(item)}: dropbox_d2l.xml not found. Please check the course files and try again.`);
            constructXMLAssigmentsCallback(new Error(`dropbox_d2l.xml not found`));
        }
    }
}