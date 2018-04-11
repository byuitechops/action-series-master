/****************************************************************************
 * Universal Broken Quicklinks
 * Description: In D2L there are internal links that have 'quickLink' in the
 * URI which when converted to Canvas, break. This Grandchild Module logs 
 * these broken links so that we can have a report with all of these links
 ****************************************************************************/
const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
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
        /* Create a cheerio object to parse for each property where a broken link might be found */
        var $ = cheerio.load(item.techops.getHTML(item) || '');

        /* Get each <a> tag */
        var links = $('a').get();

        /* If there are links in the quiz item and if the links are d2l quickLinks, then log it */
        if (links.length !== 0) {
            links.forEach(link => {
                /* Link is likely broken if it includes 'quickLink' in the href attribute */
                if ($(link).attr('href').includes('quickLink')) {
                    /* Log it to the console and our report */
                    item.techops.log(`${item.techops.type} - D2L QuickLinks Logged`, {
                        'Title': item.techops.getTitle(item),
                        'item ID': item.techops.getID(item),
                        'Quiz ID': item.quiz_id,
                        'Broken URL': $(link).attr('href'),
                    });
                }
            });
        }

        /* Next item or grandchild module */
        callback(null, course, item);
    }

    action();
};