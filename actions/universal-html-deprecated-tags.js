const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    try {

        /* If the item is marked for deletion, do nothing */
        if (item.techops.delete === true) {
            callback(null, course, item);
            return;
        }

        var elementsToKill = [
            'main',
            'header',
            'article'
        ];

        /* This is the action that happens if the test is passed */
        function action() {
            // Load our html into cheerio
            var $ = cheerio.load(item.techops.getHTML(item));
            var elements = {};

            // Check if any exist
            var none = (elementsToKill.some(el => elements[el] = $(`#${el}`)));

            // Return if they're all empty
            if (none !== true) {
                callback(null, course, item);
                return;
            }

            // There is currently a problem if there are multiple tags in the same document, it will only delete the first one.
            // Replace the specified element with the contents of the element removing the tag
            // Canvas automatically places a `<p>` tag at the before the img when there is no other tag before
            for (let i = 0; i < elementsToKill.length; i++) {
                $(`#${elementsToKill[i]}`).replaceWith($(`#${elementsToKill[i]}`).contents());
            }

            // Set the new HTML on the object
            item.techops.setHTML(item, $.html());

            // Log it
            item.techops.log(`${item.techops.type} - Deprecated Tags`, {
                'Title': item.techops.getTitle(item),
                'ID': item.techops.getID(item)
            });

            callback(null, course, item);
        }

        /* If the item is marked for deletion, has no HTML to work with, or is the front page for the course, do nothing */
        if (item.techops.getHTML(item) === null ||
            item.techops.type === 'Page' && item.front_page === true) {
            callback(null, course, item);
        } else {
            action();
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-html-deprecated-tags'
};