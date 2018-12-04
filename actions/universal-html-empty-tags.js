const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    try {

        /* If the item is marked for deletion, do nothing */
        if (item.techops.delete === true) {
            callback(null, course, item);
            return;
        }

        /* Array of all tags to be searched */
        var arrayOfTags = ['p', 'span', 'div'];

        /* This is the action that happens if the test is passed */
        function action() {
            /* Log it with this title */
            var logCategory = `${item.techops.type} - Deleted html tags`;

            /* Get the html of the item */
            var $ = cheerio.load(item.techops.getHTML(item) || '');

            /* Filters to the html tags with no attributes nad no text */
            function toNoTextNoAttr(i, ele) {
                return Object.keys(ele.attribs).length === 0 && $(ele).text() === '' && $(ele).children().length === 0;
            }

            /* Create cheerio object and search them with FUNCTION and remove those*/
            arrayOfTags.forEach(function (element) {
                item.techops.log(logCategory, {
                    'Title': item.techops.getTitle(item),
                    'ID': item.techops.getID(item),
                    'Tag': element.tagName
                });
                $(element).filter(toNoTextNoAttr).remove();
            });

            /* Set the HTML to exclude the deleted parts */
            item.techops.setHTML(item, $.html());

            callback(null, course, item);
        }

        /* If HTML exists in the current item, call the action */
        if (item.techops.getHTML(item) !== undefined && item.techops.delete === false) {
            action();
        } else {
            callback(null, course, item);
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-html-empty-tags'
};