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
        url: 'https://www.123test.com/iq-test/',
        newUrl: 'https:/www.google.com/',
    }];

    if (!item.techops.getHTML(item)) {
        callback(null, course, item);
        return;
    }

    var $ = cheerio.load(item.techops.getHTML(item));
    var links = $('a').get();
    console.log(`There are ${links.length} links in this item`);
    // var found = undefined;

    /* This is the action that happens if the test is passed */
    function action(link, newURL) {
        var oldLink = $(link).attr('href');
        $(link).attr('href', newURL);
        $(link).attr('target', '_blank');

        course.log(`${item.techops.type} - External Links in HTML Entities Set`, {
            'Title': item.title,
            'ID': item.id,
            'Old URL': oldLink,
            'New URL': newURL,
        });

        // callback(null, course, item);
    }

    /* For each external link found, test to see if it matches one that needs to be changed from urlsToChange */
    links.forEach(link => {
        urlsToChange.forEach(externalURL => {
            if ($(link).attr('href') === externalURL.url) {
                action(link, externalURL.newUrl);
            }
        });
    });

    /* Set the new html of the put item */
    item.techops.setHTML(item, $.html());
    
    /* Call the callback after running through each link in the item */
    callback(null, course, item);
};
//         /* If the find function doesn't find anything, we know there isn't a match. */
//         found = urlsToChange.find(currUrl => {
//             currUrl.url.test($(link).attr('href'))
//         });

//         /* The test returns TRUE or FALSE - action() is called if true */
//         if (found != undefined) {
//             action(link);
//         } else {
//             callback(null, course, item);
//         }
//     });

// };