const cheerio = require('cheerio');

module.exports = (course, item, callback) => {
    try {
        /* If the item is marked for deletion, do nothing */
        if (item.techops.delete === true) {
            callback(null, course, item);
            return;
        }

        /* This is the action that happens if the test is passed */
        function action() {

            if (item.techops.getHTML(item) === null) {
                item.techops.setHTML(item, '');
            }
            var $ = cheerio.load(item.techops.getHTML(item));

            /* Give us the class for the course code */
            var courseCode = course.info.fileName.split(' ');
            courseCode = courseCode[0] + courseCode[1];
            courseCode = courseCode.toLowerCase().replace(/\s+/g, '');
            courseCode = courseCode.replace(/:/g, '');

            if (course.info.instructorEmail) {
                courseCode += `-${course.info.instructorEmail.split('@')[0]}`;
            }

            /* If this already contains the styling, just skip it */
            if ($(`.byui.${courseCode} `).length > 0) {
                callback(null, course, item);
                return;
            }

            $('body').html(`<div class="byui ${courseCode}"> ${$.html()}</div>`);

            item.techops.setHTML(item, $('body').html());

            item.techops.log(`${item.techops.type} - Styling Div Inserted`, {
                'Title': item.techops.getTitle(item),
                'ID': item.techops.getID(item)
            });

            callback(null, course, item);
        }

        validTypes = [
            'Quiz',
            'Quiz Question',
            'Assignment',
            'Page',
            'Discussion'
        ];

        /* If the item is marked for deletion, has no HTML to work with, or is the front page for the course, do nothing */
        if (!validTypes.includes(item.techops.type) ||
            item.techops.type === 'Page' && item.front_page === true) {
            callback(null, course, item);
            return;
        } else {
            action();
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};

module.exports.details = {
    title: 'universal-styling-div'
};