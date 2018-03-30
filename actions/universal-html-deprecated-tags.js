const cheerio = require('cheerio');

module.exports = (course, item, callback) => {

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
        var none = true;
        elementsToKill.forEach(el => {
            elements[el] = $(`#${el}`);
            if ($(elements[el]).length !== 0) none = false;
        })

        // Return if they're all empty
        if (none === true) {
            callback(null, course, item);
            return;
        }

        // Decide where to copy to
        var topLevel = true;
        if ($('.byui').length > 0) {
            topLevel = false;
        }


        // Object.keys(elements).forEach(key => {

        $('#main').replaceWith($('#main').contents());


        //     var contents = $(elements[key]).html();
        //     console.log(key, contents.length);
        //     if (topLevel === true) {
        //         // Append to the top level element
        //         $.root().append(contents);
        //     } else {
        //         // Append to the byui styling div
        //         $('.byui').append(contents);
        //     }
        // });
        console.log($.html());

        // // Delete the divs
        // elementsToKill.forEach(el => {
        //     $(`#${el}`).remove();
        // });

        // // remove the div attribute
        // elementsToKill.forEach(el => {
        //     $(`#${el}`).removeAttr('div');
        // });

        // replace the div with the content of the div
        // elementsToKill.forEach(el => {
        //     $(`#${el}`).replaceWith($(`#${el}`).html());
        // })

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
    if (item.techops.delete === true ||
        item.techops.getHTML(item) === null ||
        item.techops.type === 'Page' && item.front_page === true) {
        callback(null, course, item);
    } else {
        action();
    }
};