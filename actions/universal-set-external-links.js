const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    try {
        //only add the platforms your grandchild should run in
        var validPlatforms = ['online', 'pathway'];
        var validPlatform = validPlatforms.includes(course.settings.platform);

        /* If the item is marked for deletion or isn't a valid platform type, do nothing */
        if (item.techops.delete === true || validPlatform !== true) {
            callback(null, course, item);
            return;
        }

        /* Potential matches in LOWER case. This will look for either the link text between <a></a> tags */
        /* (i.e. the 'title' attribute below) or the Old URL (i.e. the 'url' attribute below), and must be provided a 'newUrl' */
        var urlsToChange = [{
            /* This is an example for the gauntlet. Delete and replace with actual urls */
            url: 'https://www.123test.com/iq-test/',
            newUrl: 'https://www.google.com/',
        }, {
            title: /University\s*Polic/gi,
            newUrl: 'https://content.byui.edu/integ/gen/d24f576f-d34b-47be-a466-d00bd4792fb6/0/universitypolicies.html'
        }, {
            title: /online\s*support\s*center/gi,
            newUrl: 'https://content.byui.edu/integ/gen/8872d2b2-91d5-4953-a357-3097ef2aa5d0/0/?.vi=file&attachment.uuid=e509c91c-e500-4d6d-9a20-b8ff1b0186f9'
        }, {
            title: /library\s*research\s*guide/gi,
            newUrl: 'https://content.byui.edu/integ/gen/8872d2b2-91d5-4953-a357-3097ef2aa5d0/0/?.vi=file&attachment.uuid=3b1239c4-a857-431b-b633-94d3fdbe396e'
        }, {
            title: /academic\s*support\s*center/gi,
            newUrl: 'https://content.byui.edu/integ/gen/8872d2b2-91d5-4953-a357-3097ef2aa5d0/0/?.vi=file&attachment.uuid=91d9ec86-03ef-4c49-805f-65d488a1085c'
        }, {
            title: /copyright\s*(and|&)\s*source\s*/gi,
            newUrl: 'https://docs.google.com/a/byui.edu/spreadsheets/d/156Y7L6XbeWHpNvK4h1oVpAOTAr141IonyKT_qLeSUZg/edit?usp=sharing'
        }, {
            title: /course\s*map|design\s*workbook/gi,
            newUrl: course.info.designWorkbookURL
        }];

        /* If there isn't any html in the item, call the callback */
        if (!item.techops.getHTML(item)) {
            callback(null, course, item);
            return;
        }

        /* Get all of the links in the html */
        var $ = cheerio.load(item.techops.getHTML(item));
        var links = $('a').get();

        /* This is the action that happens if the test is passed. URL in newURL is capitalized here */
        function action(link, newURL) {
            if ($(link).attr('href') !== newURL) {
                var oldLink = $(link).attr('href');
                $(link).attr('href', newURL);
                $(link).attr('target', '_blank');

                var categoryTitle = course.info.checkStandards ? `${item.techops.type} - External Link Needs to be Changed` : `${item.techops.type} - External Link Set`;

                item.techops.log(`${item.techops.type} - External Link Set`, {
                    'Title': item.techops.getTitle(item),
                    'ID': item.techops.getID(item),
                    'Old URL': oldLink,
                    'New URL': newURL,
                });
            }
        }

        /* The if statement is the test to run action on each individual link */
        /* For each external link found, test to see if it matches one that needs to be changed from urlsToChange */
        links.forEach(link => {
            urlsToChange.forEach(externalURL => {
                if (externalURL.url !== undefined && $(link).attr('href') === externalURL.url) {
                    action(link, externalURL.newUrl);
                } else if (externalURL.title !== undefined && externalURL.title.test($(link).text())) {
                    action(link, externalURL.newUrl)
                }
            });
        });

        /* Set the new html of the put item */
        item.techops.setHTML(item, $.html());

        /* Call the callback after running through each link in the item */
        callback(null, course, item);
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-set-external-links'
};