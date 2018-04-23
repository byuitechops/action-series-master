/****************************************************************************
 * Universal Target Attributes
 * Description: The purpose of this module is to help each external link open
 * in a new tab. This can be done by searching for 'byui.instructure' in the
 * URI and setting the target attribute to '_blank' for these links
 ****************************************************************************/
const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    /* Only add the platforms your grandchild should run in */
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

        /* Get the target attribute for each <a></a> tag */
        var links = $('a').get();

        /* If there are links in the item and if the links are external, set target attribute to '_blank' */
        if (links.length !== 0) {
            var oldTarget = '';
            links.forEach(link => {
                /* An array of each character in the href */
                var eachChar = $(link).attr('href').split('');

                if ($(link).attr('target')) {
                    oldTarget = $(link).attr('target');
                }
                /* Link is external if it does not include 'byui.instructure' in the href attribute, 
                and it isn't a stand alone #id, and it isn't a uri (ex. /modules/23213/item/12339) 
                and it's uri doesn't start with '%' which would likely mean it is a broken link that
                is fixed in another grandchild module */
                if ($(link).attr('href') && !$(link).attr('href').includes('byui.instructure') && eachChar[0] !== '#' && eachChar[0] !== '/'&& eachChar[0] !== '%') {
                    /* If their is no 'target' attribute, or it is set to anything but '_blank'... */
                    if ($(link).attr('target') !== '_blank') {
                        /* Set new target to _blank */
                        $(link).attr('target', '_blank');

                        /* Log it to the console and our report */
                        item.techops.log(`${item.techops.type} - External Link Target Attribute Set to _blank`, {
                            'Title': item.techops.getTitle(item),
                            'ID': item.techops.getID(item),
                            'URL': $(link).attr('href'),
                            'Old Target': oldTarget,
                        });
                    }
                }
            });
        }

        /* Set the new html of the put item */
        item.techops.setHTML(item, $.html());

        /* Next item or grandchild module */
        callback(null, course, item);
    }

    /* If the item is marked for deletion, do nothing */
    if (item.techops.getHTML(item) === null) {
        callback(null, course, item);
        return;
    } else {
        action();
    }
};