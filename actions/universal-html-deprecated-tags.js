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

        // Get the divs
        var elements = elementsToKill.map(elName => $(`#${elName}`));

        var topLevel = true;
        if ($('.byui').length > 0) {
            topLevel = false;
        }

        elements.forEach(el => {
            var contents = $(el).html();
            if (topLevel === true) {
                // Append to the top level element
                $.root().append(contents).html();
            } else {
                // Append to the byui styling div
                $('.byui').append(contents).html();
            }
        });

        // Delete the divs
        elements.forEach(el => $(el).remove());

        // Set the new HTML on the object
        item.techops.setHTML(item, $('body').html());

        // Log it
        item.techops.log(`${item.techops.type} - Styling Div Inserted`, {
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