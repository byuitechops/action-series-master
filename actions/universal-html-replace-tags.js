/****************************************************************************
 * Universal HTML Replace Tags
 * Description: Some HTML tags in various parts of each course are old and/or
 * deprecated. This Grandchild Module searches the HTML of each item and if
 * an old tag is found, it will be replaced by a newer version of the tag
 ****************************************************************************/
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

        /* Pages to be renamed, in LOWER case */
        var tagsToReplace = [{
            oldTag: /<i>/g,
            newTag: '<em>'
        }, {
            oldTag: /<\/i>/g,
            newTag: '</em>'
        }, {
            oldTag: /<b>/g,
            newTag: '<strong>'
        }, {
            oldTag: /<\/b>/g,
            newTag: '</strong>'
        }];

        /* The test returns TRUE or FALSE - action() is called if true */
        var found = tagsToReplace.find(reTag => reTag.oldTag.test(item.techops.getHTML(item)));


        /* This is the action that happens if the test is passed */
        function action() {
            /* Log it with this title */
            var logCategory = `${item.techops.type} - Replaced html tags`;

            /* Get the html of the item */
            var content = item.techops.getHTML(item);

            /* For each outdated tag, replace it with the new tag */
            tagsToReplace.forEach(tag => {
                content = content.replace(tag.oldTag, tag.newTag);
            });

            /* Set the html that was changed */
            item.techops.setHTML(item, content);

            item.techops.log(logCategory, {
                'Title': item.techops.getTitle(item),
                'ID': item.techops.getID(item),
            });

            callback(null, course, item);
        }

        if (found !== undefined && item.techops.delete === false) {
            action();
        } else {
            callback(null, course, item);
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};