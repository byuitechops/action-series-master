/********************************************************
 * Grandchild Description - remove-banners
 * 
 * This grandchild checks to see if the item is an Overview
 * page. If it is not, it moves on; otherwise, it will go
 * ahead and remove the course banner from the page.
 ********************************************************/

const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    try {
        //only add the platforms your grandchild should run in
        var validPlatforms = ['online', 'pathway', 'campus'];
        var validPlatform = validPlatforms.includes(course.settings.platform);

        //check to see if the item is set to be deleted. if it is,
        //we just need to move on. This also checks to see if the
        //page is an overview page. We are not to delete the banner
        //from overview pages.
        if (item.techops.delete === true ||
            item.techops.getHTML(item) === null ||
            /overview/gi.test(item.techops.getTitle(item)) ||
            validPlatform !== true) {
            callback(null, course, item);
            return;
        } else {
            processItem();
            callback(null, course, item);
        }

        function processItem() {
            var $ = cheerio.load(item.techops.getHTML(item));
            var images = $('img');

            //This boolean variable ensures that the
            //update to the HTML only happens when an image is 
            //taken out of the page.
            var changeBool = false;

            if (images.length === 0) {
                return;
            } else {
                images.each((index, image) => {
                    var alt = $(image).attr('alt');

                    if (alt !== '' && alt === 'undefined') {
                        if (/course banner/gi.test(alt)) {
                            $(image).remove();
                            changeBool = true;
                        }
                    }
                });

                if (changeBool) {
                    item.techops.setHTML(item, $.html());

                    item.techops.log('Banner Removal', {
                        'Title': item.techops.getTitle(item)
                    });
                }

                return;
            }
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, file);
    }
};

module.exports.details = {
    title: 'universal-remove-banners'
};