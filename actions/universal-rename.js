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

        /* Pages to be renamed, in LOWER case */
        var itemsToRename = [{
            oldTitle: /setup\s*notes\s*for\s*development\s*team/gi,
            newTitle: '-Setup Notes & Course Settings'
        }, {
            oldTitle: /library\s*research\s*guide/gi,
            newTitle: 'Library Research Guides'
        }, {
            oldTitle: /copyright\s*(and|&)\s*source\s*/gi,
            newTitle: 'Copyright & Source Information'
        }, {
            oldTitle: /course\s*map/gi,
            newTitle: 'Design Workbook'
        }, {
            oldTitle: /^(l|w)\d*\s*lesson\s*\d*\s*notes/gi,
            newTitle: 'Teaching Notes (Do NOT Publish)'
        }];

        /* The test returns TRUE or FALSE - action() is called if true */
        var found = itemsToRename.find(renameItem => renameItem.oldTitle.test(item.techops.getTitle(item)));

        /* This is the action that happens if the test is passed */
        function action() {
            var oldTitle = item.techops.getTitle(item);
            item.techops.setTitle(item, found.newTitle);
            item.techops.log(`${item.techops.type} - Renamed`, {
                'Old Title': oldTitle,
                'New Title': item.techops.getTitle(item),
                'ID': item.techops.getID(item)
            });

            callback(null, course, item);
        }

        if (found != undefined) {
            action();
        } else {
            callback(null, course, item);
        }
    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};