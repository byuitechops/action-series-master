const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    //check to see if the item is set to be deleted. if it is,
    //we just need to move on. This also checks to see if the
    //page is an overview page. We are not to delete the banner
    //from overview pages.
    if (item.techops.delete === true ||
        item.techops.getHTML(item) === null ||
        /overview/gi.test(item.techops.getTitle(item))) {
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
};