const cheerio = require('cheerio');

module.exports = (course, item, callback) => {

    function action() {
        var $ = cheerio.load(item.techops.getHTML(item));
        var images = $('img');

        //This boolean variable ensures that the
        //update to the HTML only happens when an image is 
        //taken out of the page.
        var changeBool = false;

        if (images.length < 0) {
            callback(null, course, item);
        } else {
            images.each((index, image) => {
                var alt = $(image).attr('alt');

                if (alt.match(/banner/gi)) {
                    //"If you set an attribute's value to null, you remove that attribute." --Cheerio documentation
                    $(image) = null;
                    
                    changeBool = true;
                }
            });

            if (changeBool) {
                item.techops.setHTML(item, $.html());
            }

            callback(null, course, item);
        }
    }
    
    //check to see if the item is set to be deleted. if it is,
    //we just need to move on. This also checks to see if the
    //page is an overview page. We are not to delete the banner
    //from overview pages.
    if (item.techops.delete ||
        item.techops.getTitle(item).match(/overview/gi)) {
        callback(null, course, item);
        return;
    } 
    
    action();
}