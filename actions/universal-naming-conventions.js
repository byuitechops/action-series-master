/****************************************************************************
 * Universal Naming Conventions
 * Description: The purpose of this module is to standardize each item title
 * to match the format 'Wxx _ActivityType_: Activity Name'. Some items have
 * special naming conventions and others don't need to be standardized at all
 * (i.e. Items in the Instructor Resources or Student Resources modules).
 * This module will work to rename each item title, except for module titles
 * which are taken care of in modules-naming-conventions
 ****************************************************************************/
module.exports = (course, item, callback) => {
    try {
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
                if (title.match(/W\d?\d?\s_ActivityType_:/)) {
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
                    /* If the current word is 'week' or 'lesson' and is followed by a number, get rid of it */
                } else if (/week|lesson/gi.test(currWord) && typeof itemTitleArray[index + 1] !== 'undefined' && !isNaN(itemTitleArray[index + 1])) {
                    /* Replace each non-digit in the title with nothing */
                    /* index + 1 because the week number normally follows the word 'week' or 'lesson' */
                    itemTitleArray.splice(index, 2);
                }
            });

            /* Return the modified title, joining the array on each whitespace */
            return itemTitleArray.join(' ');
        }

        /*******************************************************************
         * Check for already existing postfixes in each module item's title,
         * if it is a duplicate title and has a '-#' at the end
         * Ex: General Lesson Notes-2, Notes from Instructor-4 
         *******************************************************************/
        function removePostfix(title) {
            /* Get each word in the module title */
            var titleArray = title.split(''); // 'Lesson Notes-2' => [ L,e,s,s,o,n, , N,o,t,e,s,-,2 ]

            /* Get the last two letters of the title */
            var duplicateTitle = titleArray.slice(-3); // [ L,e,s,s,o,n, ,N,o,t,e,s,-,2 ] => [ s,-,2 ]
            duplicateTitle = duplicateTitle.join(''); // [ s,-,2 ] => 's-2'

            /* If the last two letters of the title are '-#', return the title without the '-#' */
            if (/-\d\d?$/g.test(duplicateTitle)) {
                duplicateTitle = duplicateTitle.replace(/-\d\d?$/, ''); // 's-2' => 's'
                var modifiedTitle = titleArray.slice(0, -3); // [ L,e,s,s,o,n, ,N,o,t,e,s,-,2 ] => [ L,e,s,s,o,n, ,N,o,t,e ]
                modifiedTitle.push(duplicateTitle); // [ L,e,s,s,o,n, ,N,o,t,e ] => [ L,e,s,s,o,n, ,N,o,t,e,s ]
                return modifiedTitle.join(''); // [ L,e,s,s,o,n, ,N,o,t,e,s ] => 'Lesson Notes'
            }
            /* Else return the title as it was before */
            return title;
        }

        /*********************************************************
         * This is the function that happens if the test is passed 
         *********************************************************/
        function modifyItemTitle() {
            /* Get each word in the module item title, if a title exists */
            var title = item.techops.getTitle(item);
            var itemTitleArray = title.split(' ');

            var weekNum = getWeekNum(title);
            var modifiedTitle = removePrefix(title, itemTitleArray);
            modifiedTitle = removePostfix(modifiedTitle.trim());
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
            } else if (item.type !== undefined && (item.type === 'Quiz' || item.type === 'Discussion')) {
                newTitle = `W${weekNum} ${item.type}: ${modifiedTitle}`;
                doChange = true;
                /* If it doesn't already have the correct prefix, put it on  */
            } else if ((!title.match(/W\d?\d?\s_ActivityType_:/)) &&
                (!title.match(/W\d?\d?\sDiscussion:/)) &&
                (!title.match(/W\d\?d\?sQuiz:/))) {
                newTitle = `W${weekNum} _ActivityType_: ${modifiedTitle}`;
                doChange = true;
            } 

            /* If the last word of the title is the same as the assignment type, delete the word from the title */
            var newTitleArray = newTitle.split(' ');
            if ((item.type === 'Quiz' || item.type === 'Discussion') && item.type === newTitleArray[newTitleArray.length - 1].trim()) {
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
        //only add the platforms your grandchild should run in
        var validPlatforms = ['online', 'pathway', 'campus'];
        var validPlatform = validPlatforms.includes(course.settings.platform)

        /* If the item is marked for deletion, or if it already matches the naming convention, do nothing */
        if (item.techops.delete === true || validPlatform !== true) {
            callback(null, course, item);
            return;
        }

        /* For some reason, there was an item in testing with no title and it threw an error. */
        if (item.techops.getTitle(item) === undefined) {
            course.warning(`The item with ID: ${item.techops.getID(item)} has no title.`);
            callback(null, course, item);
            return;
        }

        /* If it's a quiz or discussion type assignment, skip it because the naming convention will take care */
        /* of it as a quiz or discussion separately, rather than doing it a second time as an assignment */
        if (item.techops.type === 'Assignment' && (item.quiz_id !== undefined || item.discussion_topic !== undefined)) {
            callback(null, course, item);
            return;
        }

        /* If the item is a module item in Instructor Resources, don't apply any changes to it */
        if (item.techops.type === 'Module Item' && item.techops.getTitle(item) !== undefined && /instructor\s*resources?/i.test(item.techops.parentModule.name)) {
            callback(null, course, item);
            return;
        }

        /* items with specific naming conventions, in LOWER case */
        var specialItems = [
            /(teaching|lesson)\s*notes/gi, // W[##] Teaching Notes  (Do NOT Publish)
            /notes\s*from\s*instructor/gi, // W[##] Notes from Instructor
        ];

        /* An array of module items NOT to change */
        var skipItems = [
            /orientation\s*to\s*online\s*learning/gi,
            /syllabus/gi,
        ];

        var title = item.techops.getTitle(item);
        var specialNaming = specialItems.find(reg => reg.test(title)); // True if the current item has a special naming convention
        var skip = skipItems.find(currItem => currItem.test(item.title)); // True if the current item shouldn't run on this grandchild
        var changeItem = /(l|w)(0?\d?\d)(\D|$)/gi.test(title); // True if item title has 'L01, W12, L4, W06, etc'
        var weeklyModule = false;

        /* Changes weeklyModule to TRUE if the item is in a weekly module */
        if (item.techops.parentModule !== undefined) {
            weeklyModule = /(Week|Lesson|L|W)\s*(\d*(\D|$))/gi.test(item.techops.parentModule.name);
        }

        /* if the item is a module item, call one function, else call another */
        if ((item.techops.type === 'Module Item' && weeklyModule && !skip && item.type !== 'SubHeader')) {//||
            // (changeItem && item.techops.type !== 'Module Item' && item.techops.type !== 'Module' && item.techops.type !== 'File')) {
            modifyItemTitle();
        } else {
            callback(null, course, item);
        }


    } catch (e) {
        course.error(new Error(e));
        callback(null, course, item);
    }
};