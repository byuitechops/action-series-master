const asyncLib = require('async');
const cheerio = require('cheerio');
var xmlAssignments = [];
var canvasAssignments = [];

//returns a boolean value on the emptiness of the array
Array.prototype.isEmpty = function () {
    return this || this.length < 1
}

//perform a *destructive* deep copy from one array to another
//working example: https://jsfiddle.net/jnpscauo/12/
Array.prototype.clone = function (arr) {
    //benchmarks prove that .splice with zero index is the
    //most efficient way to perform a copy
    //https://jsperf.com/new-array-vs-splice-vs-slice/19
    if (arr instanceof Array) {
        return this.push(arr.splice(0));
    } else if (typeof arr === "undefined") {
        throw "ERROR: the array you are trying to clone is undefined.";
    } else {
        throw "ERROR: ${arr} is not an array.";
    }
}

module.exports = (course, item, callback) => {

    var itemDropboxLink = false;

    //no need to check items that will be deleted
    if (item.techops.delete === true || item.techops.getHTML() === null) {
        callback(null, course, item);
        return;
    } else {
        beginProcess();
    }

    /****************************************************************
     * beginProcess
     * 
     * This function acts as a driver for the program. It waterfalls 
     * all of the functions.
    ******************************************************************/
    function beginProcess() {
        var functions = [
            checkArrays,
            parseItem,
            getCorrectLinks,
            repairLinks,
        ];

        asyncLib.waterfall(functions, (waterfallErr) => {
            if (waterfallErr) {
                course.error(waterfallErr);
            }

            callback(null, course, item);
        });
    }

    /****************************************************************
     * checkArrays
     * 
     * @param buildXMLArrayCallback - callback
     * 
     * This function needs to happen before everything. This goes through
     * and ensure that everything has been set up correctly so the program
     * doesn't have to parse the XML or make API calls 9000 times for the 
     * entire grandchild module to run. 
    ******************************************************************/
    function checkArrays(buildXMLArrayCallback) {
        if (xmlAssignments.isEmpty()) {
            constructXMLAssigments();
        }

        if (canvasAssignments.isEmpty()) {
            constructCanvasAssignments((err) => {
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
                constructCanvasAssignmentsCallback(err);
                return;
            }

            try {
                //move the contents from the assignments to canvasAssignments array
                canvasAssignments.clone(assignments);
            } catch (e) {
                course.error(e);
            }

            course.message(`Successfully retrieved all assignmnets from canvas and is now stored on canvasAssignments.`);
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
        var $ = cheerio.load(item.getHTML());
        var links = $('a');

        //no links are found on the page. call the callback to exit out of grandchild
        if (links.length < 0) {
            course.message(`${item.getTitle()}: no links found.`);
            callback(null, course, item);
            //links are found. let's check each to see if they are dropbox links
        } else {
            $(links).each((index, link) => {
                if ($(link).attr('href').indexOf('drop_box') != -1) {
                    itemDropboxLink = true;
                }
            });

            //we have found one ore more dropbox links.
            if (itemDropboxLink) {
                course.message(`${item.getTitle()}: identified dropbox links on page.`);

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

                            try {
                                itemPropertiesArray.clone(itemProperties);
                            } catch (e) {
                                course.error(e);
                            }
                        });
                    }

                    eachCallback(null);
                }, (eachErr) => {
                    if (eachErr) {
                        parseItemCallback(eachErr);
                        return;
                    }
                });
                //links are present in the page but none are dropbox links. 
                //call the callback to exit out of grandchild.
            } else {
                course.message(`${item.getTitle()}: links present but no dropbox links found.`);
                callback(null, course, item);
            }

            parseItemCallback(null, itemPropertiesArray);
        }
    }

    /****************************************************************
     * matchXMLAssignments
     * 
     * @param - url string
     * @param - srcId int
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
                course.message(`${item.getTitle()}: found a match for dropbox link. About to proceed to fix link.`)

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

            asyncLib.each(canvasAssignments, (canvasAssignment, innerEachCallback) => {
                if (canvasAssignment.name === page.d2l.name) {
                    newUrl = assignment.html_url;
                    innerEachCallback(null);
                } else {
                    innerEachCallback(null);
                }
            }, (innerEachErr) => {
                if (innerEachErr) {
                    eachCallback(innerEachErr);
                    return;
                }
            });

            if (newUrl === '' || typeof newUrl !== "undefined") {
                course.error(`${item.getTitle()}. Assignment not found. Please check the course then try again.`);
                callback(null, course, item);
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
        var title = item.getTitle();

        asyncLib.each(brokenLinks, (brokenLink, eachCallback) => {
            var $ = cheerio.load(item.getHTML());
            var links = $('a');

            //this fixes all of the occurrences of the same link 
            brokenLink.forEach((item) => {
                links.attr('href', (index, link) => {
                    return link.replace(item.badLink, item.newLink);
                });

                course.log('Fixed Broken Dropbox Quicklinks', {
                    'badLink': item.badLink,
                    'newLink': item.newLink,
                    'page': title,
                });
            });
        }, (eachErr) => {
            if (eachErr) {
                repairLinksCallback(eachErr);
                return;
            }

            repairLinksCallback(null);
        });
    }

    /****************************************************************
     * getDropboxFile
     * 
     * This function retrieves the dropbox_d2l.xml from the 
     * course.content so it can be parsed.
    ******************************************************************/
    function getDropboxFile() {
        var file = course.content.find((file) => {
            return file.name === `dropbox_d2l.xml`;
        });

        return file;
    }

    /****************************************************************
     * constructXMLAssigments
     * 
     * This function retrieves the dropbox_d2l.xml which holds all of
     * the dropbox information through a different function. This 
     * function then parses the xml file and stores all of the 
     * information in an array.
    ******************************************************************/
    function constructXMLAssigments() {
        //retrieve the dropbox_d2l.xml file
        var dropbox = getDropboxFile();

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
        } else {
            course.error(`${item.getTitle()}: dropbox_d2l.xml not found. Please check the course files and try again.`);
            callback(null, course, item);
        }
    }
}