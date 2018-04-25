/* Dependencies */
const asyncLib = require('async');

const universalTests = require('./grandChildTests.js');
const assignmentTests = require('../../action-series-assignments/Tests/grandChildTests.js');
const discussionTests = require('../../action-series-discussions/Tests/grandChildTests.js');
const fileTests = require('../../action-series-files/Tests/grandChildTests.js');
const moduleItemTests = require('../../action-series-module-items/Tests/grandChildTests.js');
const moduleTests = require('../../action-series-modules/Tests/grandChildTests.js');
const pageTests = require('../../action-series-pages/Tests/grandChildTests.js');
const quizQuestionTests = require('../../action-series-quiz-questions/Tests/grandChildTests.js');
const quizTests = require('../../action-series-quizzes/Tests/grandChildTests.js');

module.exports = (course, callback) => {

    myFunctions = [
        asyncLib.constant(course),
        // universalTests(course, callback),
        assignmentTests,
        discussionTests,
        // fileTests(course, callback),
        // moduleItemTests(course, callback),
        // moduleTests(course, callback),
        // pageTests(course, callback),
        // quizQuestionTests,
        // quizTests,
    ];

    asyncLib.waterfall(myFunctions, waterfallErr => {
        if (waterfallErr) {
            course.error(waterfallErr);
        }
        callback(null, course);
    });
};