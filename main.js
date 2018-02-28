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
];

/* Universal item actions */
var universal = [
    require('./actions/universal-styling-div.js'),
    require('./actions/universal-rename.js'),
    require('./actions/universal-references.js'),
];

module.exports = (course, stepCallback) => {

    function runSeries(template, seriesCallback) {

        /* After tests/actions have run, PUT the object up to Canvas */
        function putTheItem(item, eachCallback) {
            template.putItem(course, item, (err) => {
                if (err) {
                    eachCallback(err);
                    return;
                }
                eachCallback(null);
            });
        }

        /* Run each of the tests on an individual item */
        function runTests(item, eachCallback) {

            /* Builds a full list of all the actions to run on the item.
             * The first function is just to inject the needed values into the waterfall.
             * "universal" adds in the grandchildren that need to run on every category.
             * "template.actions" adds in out the category's grandchildren. */
            var actions = [asyncLib.constant(course, item), ...universal, ...template.actions];

            asyncLib.waterfall(actions, (waterErr, course, finalItem) => {
                if (waterErr) {
                    eachCallback(waterErr);
                    return;
                }
                putTheItem(finalItem, eachCallback);
            });

        }

        /* Retrieve items from canvas, then send each to runTest() */
        template.getItems(course, (err, items) => {
            if (err) {
                course.error(err);
                seriesCallback(null);
                return;
            }

            /* Loop each item through their tests/actions */
            asyncLib.eachLimit(items, 30, runTests, (eachErr) => {
                if (eachErr) {
                    course.error(eachErr);
                }
                seriesCallback(null);
            });
        });
    }

    asyncLib.eachSeries(templates, runSeries, (err) => {
        if (err) {
            console.log(err);
            stepCallback(err, course);
        } else {
            stepCallback(null, course);
        }
    });
};