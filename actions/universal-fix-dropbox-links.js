const asyncLib = require('async');
const cheerio = require('cheerio');
var xmlAssignments = [];

/************POLLYFILLS********/

//creating isEmpty array function
Array.prototype.isEmpty = function () {
    return this || this.length < 1
}

module.exports = (course, item, callback) => {

    var itemDropboxLink = false;

    //no need to check items that will be deleted
    if (item.techops.delete === true || item.techops.getHTML === null) {
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
            buildXMLArray,
            parseItem,
            getCorrectLinks,
        ];

        asyncLib.waterfall(functions, (waterfallErr) => {
            if (waterfallErr) {
                course.error(waterfallErr);
            }

            callback(null, course, item);
        })
    }

    /****************************************************************
     * buildXMLArray
     * 
     * This function happens before the page parsing. This checks to see
     * if the xmL has been parsed and the object has been built. If it
     * hasn't, it will then proceed to call the function to build it.
    ******************************************************************/
    function buildXMLArray(buildXMLArrayCallback) {
        if (xmlAssignments.isEmpty()) {
            constructXMLAssigments();
        }

        buildXMLArrayCallback(null);
    }

    /****************************************************************
     * parseItem
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
            course.message(`${item.getTitle()}: no links found. Closing out of module.`)
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
                        
                        matchXMLAssignments(url, srcId, (matchXMLAssignmentsErr, itemProperties) => {
                            if (matchXMLAssignmentsErr) {
                                parseItem(matchXMLAssignmentsErr);
                                return;
                            }

                            itemPropertiesArray = itemProperties;
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
                course.message(`${item.getTitle()}: no dropbox links found. Closing out of module.`);
                callback(null, course, item);
            }

            parseItemCallback(null, itemPropertiesArray);
        }
    }

    /****************************************************************
     * matchXMLAssignments
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
     * This function makes an API call to the assignments to obtain the
     * correct url for the dropbox.
    ******************************************************************/
    function getCorrectLinks(itemProperties, getCorrectLinksCallback) {
        var brokenLinks = [];

        //should only iterate once because there is only one object in the array
        asyncLib.each(itemProperties, (page, eachCallback) => {
            var newUrl = '';

            canvas.get(`/api/v1/courses/${course.info.canvasOU}/assignments?search_term=${page.d2l.name}`, (getErr, assignments) => {
                if (getErr) {
                    eachCallback(getErr);
                    return;
                }

                if (assignments.length > 1) {
                    assignments.forEach((assignment) => {
                        if (assignment.name === page.d2l.name) {
                            newUrl = assignment.html_url;
                        }
                    });
                } else {
                    if (assignments[0].name === page.d2l.name) {
                        newUrl = assignments[0].html_url;
                    }
                }
            });

            if (newUrl === '' || typeof newUrl !== "undefined") {
                course.error(`${item.getTitle()}. Assignment not found. Please check the course.`);
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

            getCorrectLinksCallback(null);
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