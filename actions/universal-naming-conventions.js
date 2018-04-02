module.exports = (course, item, callback) => {

    /************************************************************************************
     * Find the week number for each module item from its parent module's title. If the 
     * week number is only one digit long, append a zero to the beginning of the number.
     ************************************************************************************/
    function getWeekNum() {
        var weekNum = '';

        /* Get the item title */
        var title = item.techops.getTitle(item);
        /* Get each word in the module title */
        var titleArray = title.split(' ');

        /* Get the week number from the module title */
        /* Add 0 to week number if not present */
        titleArray.forEach((currWord, index) => {
            /* If the current word follows this convention: L14, W01, L2, W9, etc */
            if (/(l|w)(0?\d?\d)(\D|$)/gi.test(currWord)) {
                /* Spit the current word into a character array */
                var eachChar = currWord.split('');
                eachChar.forEach(theChar => {
                    /* If the character is a number, append it to weekNum */
                    if (!isNaN(theChar) && theChar !== ' ') {
                        weekNum += theChar;
                    }
                });
            }

            /* Add 0 to the beginning of the number if weekNum is a single digit */
            if (weekNum.length === 1) {
                weekNum = weekNum.replace(/^/, '0');
            }
        });

        return weekNum;
    }

    /*******************************************************************
     * Check for already existing prefixes in each module item's title.
     * If one exists, delete it before creating a new one in modifyModuleItemTitle().
     * Ex: L1, W02, Lesson 03, Week 4 
     *******************************************************************/
    function checkForPrefix() {
        /* Get each word in the module item title */
        if (typeof item.techops.getTitle(item) !== 'undefined') {
            var title = item.techops.getTitle(item);
            var itemTitleArray = title.split(' ');
        } else {
            var itemTitleArray = '';
        }

        /* If the title is only one word or less, don't modify it */
        if (itemTitleArray.length <= 1) {
            return item.title;
        }

        /* Check for already existing prefixes in the titles */
        itemTitleArray.forEach((currWord, index) => {
            /* Get rid of L02, W14:, L3, W4 etc. */
            if (/(l|w)(0?\d?\d)(\D|$)/gi.test(currWord)) {
                itemTitleArray.splice(index, 1);
            }
        });

        /* Return the modified title, joining the array on each whitespace */
        return itemTitleArray.join(' ');
    }

    /*********************************************************
     * This is the function that happens if the test is passed 
     *********************************************************/
    function modifyItemTitle() {
        var weekNum = getWeekNum();
        var modifiedTitle = checkForPrefix();
        var oldTitle = item.techops.getTitle(item);
        var newTitle = '';

        /* If the activity type is Quiz or Discussion, put it in the title. Else, put '_ActivityType_' */
        if (item.techops.type === 'Quiz' || item.techops.type === 'Discussion') {
            newTitle = `W${weekNum} ${item.techops.type}: ${modifiedTitle}`;
        } else {
            newTitle = `W${weekNum} _ActivityType_: ${modifiedTitle}`;
        }

        /* Set the new title for the PUT object */
        item.techops.setTitle(item, newTitle);

        item.techops.log(`${item.techops.type} - Naming Conventions Added`, {
            'Old Title': oldTitle,
            'New Title': newTitle,
            'ID': item.techops.getID(item),
        });

        callback(null, course, item);
    }

    /**************************************************************
     *                      Start Here                            * 
     **************************************************************/
    /* If the item is marked for deletion, or if it already matches the naming convention, do nothing */
    if (item.techops.delete === true) {
        callback(null, course, item);
        return;
    }

    /* If the item title has 'L01, W12, L4, W06, etc', then we will change the name */
    var changeItem = /(l|w)(0?\d?\d)(\D|$)/gi.test(item.techops.getTitle(item));

    /* items with specific naming conventions, in LOWER case */
    var specialItems = [
        /lesson\s*notes/gi, // W[##] Lesson Notes  (Do NOT Publish)
        /notes\s*from\s*instructor/gi, // W[##] Notes from Instructor
    ];

    /* if the item is in a weekly module, call modifyModuleItemTitle() */
    if (changeItem && item.techops.type !== 'Module' && item.techops.type !== 'File') {
        modifyItemTitle();
    } else {
        callback(null, course, item);
    }
};