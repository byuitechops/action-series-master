/*********************************************************************************************
 * Universal Alt Attribute
 * Description: Reports the images that have no alt attribute or whose alt attribute is empty
 *********************************************************************************************/
const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    try {
        //only add the platforms your grandchild should run in
        var validPlatforms = ['online', 'pathway', 'campus'];
        var validPlatform = validPlatforms.includes(course.settings.platform);

        /* If the item is marked for deletion or isn't a valid platform type, do nothing */
        if (item.techops.delete === true || validPlatform !== true) {
            callback(null, course, item);
            return;
        }

        /* This is the action that happens if the test is passed */
        function action() {
            var $ = cheerio.load(item.techops.getHTML(item));
            var images = $('img');

            images.each(function (i, image) {
                image = $(image);
                var alt = image.attr('alt');
                if (!alt || alt === '') {
                    item.techops.log('Images without Alt Text', {
                        'Filename': `${item.title}`,
                        'Page URL': `https://${course.info.domain}.instructure.com/courses/${course.info.canvasOU}/pages/${item.id}`,
                        'Image Source': `${image.attr('src')}`
                    });
                }
            });

            callback(null, course, item);
        }

        /* If the item is marked for deletion, do nothing */
        if (item.techops.getHTML(item) === null) {
            callback(null, course, item);
            return;
        } else {
            action();
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-alt-attributes'
};