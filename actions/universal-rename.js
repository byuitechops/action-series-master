module.exports = (course, item, callback) => {
    try {




        /* If the item is marked for deletion, do nothing */
        if (item.techops.delete === true) {
            callback(null, course, item);
            return;
        }

        /* Pages to be renamed, in LOWER case */
        var itemsToRename = [{
            oldTitle: /Setup\s*(notes)?\sfor\sdevelopment\s*team/i,
            newTitle: '-Setup Notes & Course Settings'
        }, {
            oldTitle: /library\s*research\s*guide/i,
            newTitle: 'Library Research Guides'
        }, {
            oldTitle: /copyright\s*(and|&)\s*source\s*/i,
            newTitle: 'Copyright & Source Information'
        }, {
            oldTitle: /^(l|w)?\d*\s*lesson\s*\d*\s*notes/i,
            newTitle: 'Teaching Notes (Do NOT Publish)'
        }, {
            oldTitle: /general\s*lesson\s*notes/i,
            newTitle: 'General Teaching Notes'
        }, {
            oldTitle: /\s*\d*\s*(Week|Lesson|L|W)\s*\d*\D?\d*\s*overview\s*$/i,
            newTitle: 'Introduction'
        }, {
            oldTitle: /overview\s*\d*\s*(Week|Lesson|L|W)\s*\d*\s*$/i,
            newTitle: 'Introduction'
        }];

        /* The test returns TRUE or FALSE - action() is called if true */
        var found = itemsToRename.find(renameItem => renameItem.oldTitle.test(item.techops.getTitle(item)));

        /* This is the action that happens if the test is passed */
        function action() {
            if (item.techops.getTitle(item) !== found.newTitle) {
                var oldTitle = item.techops.getTitle(item);
                item.techops.setTitle(item, found.newTitle);

                var categoryTitle = course.info.checkStandards ? `${item.techops.type} - Needs to be Renamed` : `${item.techops.type} - Renamed`;

                item.techops.log(categoryTitle, {
                    'Old Title': oldTitle,
                    'New Title': item.techops.getTitle(item),
                    'ID': item.techops.getID(item)
                });
            }
            callback(null, course, item);
        }

        if (found != undefined && item.techops.type !== 'File') {
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
    title: 'universal-rename'
};