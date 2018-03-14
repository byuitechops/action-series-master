module.exports = (course, item, callback) => {

    /* If the item is marked for deletion, do nothing */
    if (item.techops.delete == true) {
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
    }];

    /* The test returns TRUE or FALSE - action() is called if true */
    var found = itemsToRename.find(renameItem => renameItem.oldTitle.test(item.techops.getTitle(item)));

    /* This is the action that happens if the test is passed */
    function action() {
        let oldTitle = item.techops.getTitle(item);
        let newTitle = found.newTitle;
        let itemID = item.techops.getID(item);
        let logCategory = 'Renamed';

        /* If we're running a standards check and not doing any changes... */
        if (course.info.checkStandards === true) {
            logCategory = 'Needs to be Renamed';
        } else {
            item.techops.setTitle(item, found.newTitle);
        }

        course.log(logCategory, {
            'Type': item.techops.type,
            'Current Title': oldTitle,
            'New Title': newTitle,
            'ID': itemID
        });
        callback(null, course, item);
    }

    if (found != undefined) {
        action();
    } else {
        callback(null, course, item);
    }

};