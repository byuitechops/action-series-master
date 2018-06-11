/*****************************************************
 * Universal Table Classes
 * Description: Give each table its needed CSS 
 * classes (i.e. ic-Table, ic-Table--striped, etc)
 ****************************************************/
const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    try {

        /* If the item is marked for deletion, do nothing */
        if (item.techops.delete === true) {
            callback(null, course, item);
            return;
        }

        /* Run if the test is passed */
        function action() {
            /* Get the html and each table element */
            var $ = cheerio.load(item.techops.getHTML(item));
            var tables = $('table').get();

            /* For each table element, check its CSS classes. If it doesn't have the 'ic-Table' class, add it */
            tables.forEach(table => {
                var classes = $(table).attr('class');
                var icTable = '';

                /* If there are CSS classes, check if one is the 'ic-Table' class */
                if (classes !== undefined) {
                    classes = classes.split(' ');
                    icTable = classes.find(currClass => /^ic-Table$/i.test(currClass));
                }

                /* If there are no CSS classes, or the table element doesn't have the ic-Table class, then add it */
                if (icTable === undefined || classes === undefined) {
                    $(table).addClass('ic-Table');

                    /* Log it */
                    item.techops.log(`${item.techops.type} - ic-Table Class Added`, {
                        'Title': item.techops.getTitle(item),
                        'ID': item.techops.getID(item),
                    });
                }
            });

            /* Set the HTML */
            item.techops.setHTML(item, $.html());
            callback(null, course, item);
        }

        /* If the item has html to check, run action() */
        if (item.techops.getHTML(item) !== null) {
            action();
        } else {
            callback(null, course, item);
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-table-classes'
};