const cheerio = require('cheerio');

module.exports = (course, item, callback) => {

    /* This is the action that happens if the test is passed */
    function action() {
        var $ = cheerio.load(item.techops.getHTML(item));

        /* Give us the class for the course code */
        var courseCode = course.info.fileName.split(' ');
        courseCode = courseCode[0] + courseCode[1];
        courseCode = courseCode.toLowerCase().replace(/\s+/g, '');
        courseCode = courseCode.replace(/:/g, '');

        /* If this already contains the styling, just skip it */
        if ($(`.byui.${courseCode}`).length > 0) {
            callback(null, course, item);
            return;
        }

        $('body').html(`<div class="byui ${courseCode}">${$.html()}</div>`);

        item.techops.setHTML(item, $('body').html());

        course.log('Styling HTML Inserted', {
            'Title': item.techops.getTitle(item),
            'ID': item.techops.getID(item)
        });

        callback(null, course, item);
    }


    /* If the item is marked for deletion, do nothing */
    if (item.techops.delete == true || item.techops.getHTML(item) == null) {
        callback(null, course, item);
        return;
    } else {
        action();
    }
};