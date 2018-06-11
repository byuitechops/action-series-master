module.exports = (course, item, callback) => {
    try {




        /* If the item is marked for deletion, do nothing */
        if (item.techops.delete === true) {
            callback(null, course, item);
            return;
        }

        /* This is the action that happens if the test is passed */
        function action() {

            var references = [{
                reg: /!\[CDATA[\s\S]*\]\]/gi,
                type: 'Javascript'
            }, {
                reg: /(brightspace)(?!\.com)/gi,
                type: 'Brightspace References'
            }, {
                reg: /brainhoney/ig,
                type: 'Brainhoney References'
            }, {
                reg: /adobe\s*connect/ig,
                type: 'Adobe Connect References'
            }, {
                reg: /((google\s*)?hangouts?(\s*on\s*air)?)|(HOA)/ig,
                type: 'Hangouts on Air References'
            }, {
                reg: /<a[^>]*href=("|')[^"']*\.swf("|')\s*>/ig,
                type: '.swf Files'
            }, {
                reg: /<style>/g,
                type: 'Inline Styling'
            }];

            /* Check each regex to see if the item contents has any matches */
            references.forEach(ref => {
                /* Get all the matches */
                var matches = item.techops.getHTML(item).match(ref.reg);
                /* See if it contains any of what we're looking for... */
                if (matches != null) {
                    matches.forEach(match => {
                        item.techops.log(`${item.techops.type} - Contains ${ref.type}`, {
                            'Title': item.techops.getTitle(item),
                            'ID': item.techops.getID(item),
                            'Match': match
                        });
                    });
                }
            });

            callback(null, course, item);
        }

        /* If the item is marked for deletion, do nothing */
        if (item.techops.getHTML(item) == null) {
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
    title: 'universal-references'
};