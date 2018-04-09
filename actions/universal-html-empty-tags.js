const cheerio = require('cheerio');



module.exports = (course, item, callback) => {
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
            return Object.keys(ele.attribs).length === 0 && $(ele).text() === '';
        }

        /* Create cheerio object and search them with FUNCTION and remove those*/
        arrayOfTags.forEach(function (element) {
            $(element).filter(toNoTextNoAttr).remove();
        });

        /* Set the HTML to exclude the deleted parts */
        item.techops.setHTML(item, $.html());

        item.techops.log(logCategory, {
            'Title': item.techops.getTitle(item),
            'ID': item.techops.getID(item),
        });

        callback(null, course, item);
    }

    var validPlatforms = ['Campus', 'Online', 'Pathway'];

    /* If HTML exists in the current item, call the action */
    if ((typeof item.techops.getHTML(item) != 'undefined' || item.techops.getHTML(item) != null && item.techops.delete === false) && validPlatforms.includes(course.settings.platform)) {
        action();
    } else {
        callback(null, course, item);
    }

};
