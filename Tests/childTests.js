/* Dependencies */
const async = require('async');

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
        universalTests(course, callback),
        assignmentTests(course, callback),
        discussionTests(course, callback),
        // fileTests(course, callback);
        // moduleItemTests(course, callback);
        // moduleTests(course, callback);
        // pageTests(course, callback);
        // quizQuestionTests(course, callback);
        // quizTests(course, callback);
    ];

    async.waterfall(myFunctions, waterfallErr => {
        if (seriesErr) {
            course.error(seriesErr);
        }
        callback(null, course);
    });
};