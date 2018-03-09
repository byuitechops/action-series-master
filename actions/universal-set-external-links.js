const cheerio = require('cheerio');

module.exports = (course, item, callback) => {

    /* If the item is marked for deletion, do nothing */
    if (item.techops.delete === true) {
        callback(null, course, item);
        return;
    }

    // TESTING UNTIL OPTION IS ADDED
    course.info.designWorkbookURL = 'https://www.google.com';

    /* Potential matches in LOWER case */
    var urlsToChange = [{
        url: /University\s*Polic/gi,
        newUrl: 'https://content.byui.edu/integ/gen/d24f576f-d34b-47be-a466-d00bd4792fb6/0/universitypolicies.html'
    }, {
        url: /online\s*support\s*center/gi,
        newUrl: 'https://content.byui.edu/integ/gen/8872d2b2-91d5-4953-a357-3097ef2aa5d0/0/?.vi=file&attachment.uuid=e509c91c-e500-4d6d-9a20-b8ff1b0186f9'
    }, {
        url: /library\s*research\s*guide/gi,
        newUrl: 'https://content.byui.edu/integ/gen/8872d2b2-91d5-4953-a357-3097ef2aa5d0/0/?.vi=file&attachment.uuid=3b1239c4-a857-431b-b633-94d3fdbe396e'
    }, {
        url: /academic\s*support\s*center/gi,
        newUrl: 'https://content.byui.edu/integ/gen/8872d2b2-91d5-4953-a357-3097ef2aa5d0/0/?.vi=file&attachment.uuid=91d9ec86-03ef-4c49-805f-65d488a1085c'
    }, {
        url: /copyright\s*(and|&)\s*source\s*/gi,
        newUrl: 'https://docs.google.com/a/byui.edu/spreadsheets/d/156Y7L6XbeWHpNvK4h1oVpAOTAr141IonyKT_qLeSUZg/edit?usp=sharing'
    }, {
        url: /course\s*map|design\s*workbook/gi,
        newUrl: course.info.designWorkbookURL
    }];


    var $ = cheerio.load(item.techops.getHTML(item));
    var links = $('a').get();
    var found = undefined;



    /* This is the action that happens if the test is passed */
    function action(link) {
        item.external_url = item.newUrl;
        item.new_tab = true;

        course.log(`${item.techops.type} - External Links in HTML Entities Set`, {
            'Title': item.title,
            'ID': item.id,
            'New URL': item.external_url
        });

        callback(null, course, item);
    }

    /* For each external link found, test to see if it matches one that needs to be changed from urlsToChange */
    links.forEach(link => {
        urlsToChange.forEach(currURL => {
            if ($(link).attr('href') === currURL.url) {
                action(link, currURL);
            }
        });


        /* If the find function doesn't find anything, we know there isn't a match. */
        found = urlsToChange.find(currUrl => {
            currUrl.url.test($(link).attr('href'))
        });

        /* The test returns TRUE or FALSE - action() is called if true */
        if (found != undefined) {
            action(link);
        } else {
            callback(null, course, item);
        }
    });

};