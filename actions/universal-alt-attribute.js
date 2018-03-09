const cheerio = require('cheerio');

module.exports = (course, item, callback) => {

    /* This is the action that happens if the test is passed */
    function action() {
        var $ = cheerio.load(item.techops.getHTML(item));
        var images = $('img');

        images.each(function (i, image) {
            image = $(image);
            var alt = image.attr('alt');
            if (!alt || alt === '') {
                course.log('Images without Alt Text', {
                    'Filename': `${item.title}`,
                    'Page URL': `https://${course.info.domain}.instructure.com/courses/${course.info.canvasOU}/pages/${item.id}`,
                    'Image Source': `${image.attr('src')}`
                });
            }
        });

        callback(null, course, item);
    }


    /* If the item is marked for deletion, do nothing */
    if (item.techops.delete == true || item.techops.getHTML(item) == null) {
        callback(null, course, item);
        return;
    } else {
        action();
    }
};