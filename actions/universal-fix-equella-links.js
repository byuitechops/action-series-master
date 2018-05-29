/****************************************************************************
 * Universal Fix Equella Links
 * Description: The purpose of this module is to help each Equella link take
 * the user to the most current version of the document in Equella. This is 
 * done by inserting the /integ/gen/ path into each link.
 * 
 * Syllubi are the exception, and their links are not to be modified.
 ****************************************************************************/
const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    try {
        /* Only add the platforms your grandchild should run in */
        var validPlatforms = ['online', 'pathway', 'campus'];
        var validPlatform = validPlatforms.includes(course.settings.platform);

        /* If the item isn't a valid platform or is marked for deletion then return */
        if (item.techops.delete === true || validPlatform !== true) {
            callback(null, course, item);
            return;
        }

        /* This is the action that happens if the test is passed */
        function changeHtmlLinks() {
            /* Get the target attribute for each <a></a> tag */
            var $ = cheerio.load(item.techops.getHTML(item));
            var links = $('a').get();

            /* If there aren't any links in the item then return */
            if (links.length === 0) {
                callback(null, course, item);
                return;
            }

            links.forEach(link => {
                var oldUrl = '';
                /* Assign the oldUrl name for logging purposes */
                if ($(link).attr('href')) {
                    oldUrl = $(link).attr('href');
                }

                /* Check if the link has an href, and if it is already the correct href */
                if ($(link).attr('href') &&
                    $(link).attr('href').includes('content.byui.edu/file/') &&
                    !$(link).attr('href').includes('content.byui.edu/integ/gen/')) {
                    var tempUrl = $(link).attr('href');
                    tempUrl = tempUrl.replace(/\/file\//i, '/integ/gen/');
                    tempUrl = tempUrl.replace(/\/\d+\//i, '/0/');

                    /* Set new href to the new URL */
                    $(link).attr('href', tempUrl);

                    /* Log it to the console and our report */
                    item.techops.log(`${item.techops.type} - Equella link updated to /integ/gen/`, {
                        'Title': item.techops.getTitle(item),
                        'ID': item.techops.getID(item),
                        'URL': tempUrl,
                        'Old Target': oldUrl,
                    });
                }
            });

            /* Set the new html of the put item */
            item.techops.setHTML(item, $.html());

            /* Next item or grandchild module */
            callback(null, course, item);
        }

        function changeModuleItem() {
            /* If it's a module item, treat it differently here */
            var oldUrl = item.external_url;
            if (item.external_url.includes('content.byui.edu/file/') &&
                !item.external_url.includes('content.byui.edu/integ/gen/')) {
                var tempUrl = oldUrl;
                tempUrl = tempUrl.replace(/\/file\//i, '/integ/gen/');
                tempUrl = tempUrl.replace(/\/\d+\//i, '/0/');
                item.external_url = tempUrl;

                /* Log it to the console and our report */
                item.techops.log(`${item.techops.type} - Equella link updated to /integ/gen/`, {
                    'Title': item.techops.getTitle(item),
                    'ID': item.techops.getID(item),
                    'URL': item.external_url,
                    'Old Target': oldUrl,
                });
            }
            callback(null, course, item);
        }

        /* If the item is has no html, or it is the syllabus, do nothing */
        if (item.techops.type === 'Module Item' && item.type === 'ExternalUrl' && !/syllabus|syllabi/i.test(item.techops.getTitle(item))) {
            changeModuleItem();
        } else if (item.techops.getHTML(item) === null || /syllabus|syllabi/i.test(item.techops.getTitle(item))) {
            callback(null, course, item);
            return;
        } else {
            changeHtmlLinks();
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-fix-equella-links'
};