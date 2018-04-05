const canvas = require('canvas-wrapper');
var chalk = require('chalk');

var groupCategories = [];
var retrievedGroups = false;

module.exports = (course, item, callback) => {

    function action() {

        if (item.group_category_id !== null) {
            var result = groupCategories.filter(element => element.name === 'Project Groups')
                .filter(element => element.id === item.group_category_id);
        }

        var logCategory = `${item.techops.type} - Group Assignments/Discussions`;

        item.techops.log(logCategory, {
            'Title': item.techops.getTitle(item),
            'ID': item.techops.getID(item),
        });

        callback(null, course, item);
    }

    function condition() {
        if (item.techops.type === 'Discussion' || item.techops.type === 'Assignment' && item.techops.delete === false) {
            action();
        } else {
            callback(null, course, item);
        }
    }

    if (!retrievedGroups) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/group_categories`, (err, categories) => {
            if (err) {
                console.error(err);
                callback(null);
            } else {
                groupCategories = categories;
                retrievedGroups = true;
                condition();
            }
        });
    } else {
        condition();
    }
};