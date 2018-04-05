module.exports = (course, item, callback) => {
    /************************************************************************************
     * Find the week number for each module item from its parent module's title. If the 
     * week number is only one digit long, append a zero to the beginning of the number.
     ************************************************************************************/
    function getWeekNum(title) {
        var weekNum = '';

        /* If the parent module doesn't have a name, or if the module 
        item is not housed in a module at all, return an empty string */
        if (item.techops.type === 'Module Item' && typeof item.techops.parentModule === 'undefined') {
            return weekNum;
        }

        /* Get the module title if it is a module item */
        if (item.techops.type === 'Module Item') {
            title = item.techops.parentModule.name;
        }

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

                /* If the current word is 'week' or 'lesson' */
            } else if (/week|lesson/gi.test(currWord) && typeof titleArray[index + 1] !== 'undefined') {
                /* Replace each non-digit in the title with nothing */
                /* index + 1 because the week number normally follows the word 'week' or 'lesson' */
                weekNum = titleArray[index + 1].replace(/\D+/g, '');
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
    function removePrefix(title, itemTitleArray) {
        /* If it is a discussion or quiz AND it already has the prefix 'Wxx _ActivityType_:' then get rid of the prefix */
        if (item.techops.type === 'Discussion' || item.techops.type === 'Quiz') {
            if (title.match(/W\d\d\s_ActivityType_:/)) {
                itemTitleArray.splice(0, 2);
                return itemTitleArray.join(' ');
            }
        }

        /* If the title is only one word or less, don't modify it */
        if (itemTitleArray.length <= 1) {
            return title;
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
        var title = '';
        var itemTitleArray = '';

        /* Get each word in the module item title, if a title exists */
        if (item.techops.getTitle(item) !== undefined) {
            title = item.techops.getTitle(item);
            itemTitleArray = title.split(' ');
        }

        var weekNum = getWeekNum(title);
        var modifiedTitle = removePrefix(title, itemTitleArray);
        var oldTitle = title;
        var newTitle = '';
        var doChange = false; // Will be set to true if any changes are to be made to the title in the following if statements

        /* Decide how to format the new title */
        /* If it is an item with a special naming convention */
        if (specialNaming) {
            newTitle = `W${weekNum} ${modifiedTitle}`;
            doChange = true;
            /* If it is a quiz or discussion, put the type in the title */
        } else if (item.techops.type === 'Quiz' || item.techops.type === 'Discussion') {
            newTitle = `W${weekNum} ${item.techops.type}: ${modifiedTitle}`;
            doChange = true;
            /* If it doesn't already have the correct prefix, put it on  */
        } else if ((!title.match(/W\d\d\s_ActivityType_:/)) &&
            (!title.match(/W\d\d\sDiscussion:/)) &&
            (!title.match(/W\d\d\sQuiz:/))) {
            newTitle = `W${weekNum} _ActivityType_: ${modifiedTitle}`;
            doChange = true;
        }

        /* If the last word of the title is the same as the assignment type, delete the word from the title */
        var newTitleArray = newTitle.split(' ');
        if (item.type === newTitleArray[newTitleArray.length - 1].trim()) {
            newTitleArray.splice(-1, 1);
        }

        /* Join on the blank spaces */
        newTitle = newTitleArray.join(' ');

        if (doChange) {
            /* Set the new title for the PUT object */
            item.techops.setTitle(item, newTitle);

            item.techops.log(`${item.techops.type} - Naming Conventions Added`, {
                'Old Title': oldTitle,
                'New Title': newTitle,
                'ID': item.techops.getID(item),
            });
        }
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

    /* items with specific naming conventions, in LOWER case */
    var specialItems = [
        /lesson\s*notes/gi, // W[##] Lesson Notes  (Do NOT Publish)
        /notes\s*from\s*instructor/gi, // W[##] Notes from Instructor
    ];

    /* An array of module items NOT to change */
    var skipItems = [
        /orientation\s*to\s*online\s*learning/gi,
        /syllabus/gi,
    ];

    var title = '';
    if (item.techops.getTitle(item) !== undefined) {
        title = item.techops.getTitle(item);
    }
    var changeItem = /(l|w)(0?\d?\d)(\D|$)/gi.test(title); // True if item title has 'L01, W12, L4, W06, etc'
    var specialNaming = specialItems.find(special => special.test(item.title)); // True if the current item has a special naming convention
    var skip = skipItems.find(currItem => currItem.test(item.title)); // True if the current item shouldn't run on this grandchild
    var weeklyModule = false;

    /* Changes weeklyModule to TRUE if the item is in a weekly module */
    if (typeof item.techops.parentModule !== 'undefined') {
        weeklyModule = /(Week|Lesson|L|W)\s*(\d*(\D|$))/gi.test(item.techops.parentModule.name);
    }

    /* If it's a quiz or discussion type assignment, skip it because the naming convention will take care */
    /* of it as a quiz or discussion separately, rather than doing it a second time as an assignment */
    if (item.techops.type === 'Assignment' && (item.quiz_id !== undefined || item.discussion_topic !== undefined)) {
        callback(null, course, item);
        return;
    }

    /* if the item is a module item, call one function, else call another */
    if ((item.techops.type === 'Module Item' && weeklyModule && !skip && item.type !== 'SubHeader') ||
        (changeItem && item.techops.type !== 'Module Item' && item.techops.type !== 'Module' && item.techops.type !== 'File')) {
        modifyItemTitle();
    } else {
        callback(null, course, item);
    }
};