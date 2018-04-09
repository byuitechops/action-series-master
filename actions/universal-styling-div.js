const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    //only add the platforms your grandchild should run in
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

        item.techops.log(`${item.techops.type} - Styling Div Inserted`, {
            'Title': item.techops.getTitle(item),
            'ID': item.techops.getID(item)
        });

        callback(null, course, item);
    }


    /* If the item is marked for deletion, has no HTML to work with, or is the front page for the course, do nothing */
    if (item.techops.getHTML(item) === null ||
        item.techops.type === 'Page' && item.front_page === true) {
        callback(null, course, item);
        return;
    } else {
        action();
    }
};