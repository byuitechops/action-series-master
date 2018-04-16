/* Module Description */
/* Collects all of the pages and runs them through a series of tests and changes to switch them to new standards */

const asyncLib = require('async');

/* Templates */
var templates = [
    require('action-series-pages'),
    require('action-series-module-items'),
    require('action-series-files'),
    require('action-series-modules'),
    require('action-series-assignments'),
    require('action-series-discussions'),
    require('action-series-quizzes'),
    require('action-series-quiz-questions'),
];

/* Universal item actions */
var universal = [
    require('./actions/universal-styling-div.js'),
    require('./actions/universal-html-deprecated-tags.js'),
    require('./actions/universal-rename.js'),
    require('./actions/universal-references.js'),
    require('./actions/universal-target-attributes.js'),
    require('./actions/universal-alt-attribute.js'),
    require('./actions/universal-set-external-links.js'),
    require('./actions/universal-err-links.js'),
    require('./actions/universal-remove-banners.js'),
    require('./actions/universal-fix-dropbox-links.js'),
    require('./actions/universal-html-replace-tags.js'),
    // require('./actions/universal-description-quicklinks.js'),
    require('./actions/universal-html-empty-tags.js'),
    require('./actions/universal-naming-conventions.js'),
    require('./actions/universal-broken-quicklinks.js'),
];

module.exports = (course, stepCallback) => {

    function runSeries(template, seriesCallback) {

        function confirmLogs(item) {
            item.techops.logs.forEach(log => {
                course.log(log.title, log.details);
            });
        }

        /* After tests/actions have run, PUT the object up to Canvas */
        function putTheItem(item, eachCallback) {
            if (course.info.checkStandards === true) {
                confirmLogs(item);
                eachCallback(null);
                return;
            }
            template.putItem(course, item, (err) => {
                if (err) {
                    eachCallback(err);
                    return;
                }
                confirmLogs(item);
                eachCallback(null);
            });
        }

        /* Run each of the tests on an individual item */
        function runTests(item, eachCallback) {

            /* Copy of the item so we can see if any changes were made in the grandchildren modules*/
            var originalItem = Object.assign({}, item);

            /* Builds a full list of all the actions to run on the item.
             * The first function is just to inject the needed values into the waterfall.
             * "universal" adds in the grandchildren that need to run on every category.
             * "template.actions" adds in the category's grandchildren. */
            var actions = [asyncLib.constant(course, item), ...universal, ...template.actions];

            setTimeout(() => {
                asyncLib.waterfall(actions, (waterErr, course, finalItem) => {
                    if (waterErr) {
                        eachCallback(waterErr);
                        return;
                    }

                    /* Compare the original to the finalItem to see if we need to update it in Canvas */
                    let diff = Object.keys(finalItem)
                        .find(key => originalItem[key] !== finalItem[key] || finalItem.techops.delete === true);

                    if (diff) {
                        putTheItem(finalItem, eachCallback);
                    } else {
                        eachCallback(null);
                    }
                });
            }, 0);
        }

        /* Retrieve items from canvas, then send each to runTest() */
        template.getItems(course, (err, items) => {
            if (err) {
                course.error(err);
                seriesCallback(null);
                return;
            }

            /* Loop each item through their tests/actions */
            asyncLib.eachLimit(items, 20, runTests, (eachErr) => {
                if (eachErr) {
                    course.error(eachErr);
                }
                seriesCallback(null);
            });
        });
    }

    asyncLib.eachSeries(templates, runSeries, (err) => {
        if (err) {
            course.error(err);
            stepCallback(err, course);
        } else {
            stepCallback(null, course);
        }
    });
};
