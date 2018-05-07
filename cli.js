const main = require('./main.js');
const createCourseObject = require('create-course-object');
const Logger = require('logger');
const logger = new Logger;
const canvas = require('canvas-wrapper');
const indexer = require('index-directory').conversionTool;
const quizInstructions = require('quiz-instructions');
const writeCourse = require('write-course');
const Enquirer = require('enquirer');
var enquirer = new Enquirer();

function coursePrep() {

}

function buildHeader(course) {
    return `
        <h2>Course Standards</h2>
        <p>Here are all of the course standards that are currently not being met within the course.</p>
        <p>Course ID: ${course.info.canvasOU}</p>
        <a target="_blank" href="https://byui.instructure.com/courses/${course.info.canvasOU}">https://byui.instructure.com/courses/${course.info.canvasOU}</a>
    `;
}

function getPristine() {
    return new Promise((resolve, reject) => {
        canvas.get(`/api/v1/accounts/1/courses?search_term=1 (Pristine)`, (getErr, foundCourse) => {
            if (getErr) return reject(getErr);
            if (foundCourse.length < 1) return reject(new Error('Cannot find Pristine Gauntlet.'));
            resolve(foundCourse[0]);
        });
    });
}

function getUserCourse(courseID) {
    return new Promise((resolve, reject) => {
        canvas.get(`/api/v1/accounts/1/courses/${courseID}`, (err, givenCourse) => {
            if (err) return reject(err);
            resolve(givenCourse[0]);
        });
    });
}

function runActionSeries(foundCourse) {
    return new Promise((resolve, reject) => {
        createCourseObject({}, (err, course) => {
            course.info.fileName = foundCourse.course_code;
            course.info.courseCode = foundCourse.course_code;
            course.info.courseName = foundCourse.name;
            course.info.checkStandards = true;
            course.info.canvasOU = foundCourse.id;
            course.info.usedFiles = [];
            course.info.unusedFiles = [];
            course.info.unzippedPath = './course-unzipped';
            course.info.processedPath = './course-processed';

            /* Index the course object */
            indexer(course, (indexErr, indexedCourse) => {
                if (indexErr) return reject(indexErr);
                /* Fix the quiz instructions */
                quizInstructions(indexedCourse, (quizErr, fixedCourse) => {
                    if (quizErr) return reject(quizErr);
                    /* Write the course files */
                    writeCourse(fixedCourse, (writeErr, writtenCourse) => {
                        if (writeErr) return reject(writeErr);
                        /* Run the action-series model on the course */
                        main(writtenCourse, (err, courseObject) => {
                            if (err) return reject(err);
                            resolve(courseObject);
                        });
                    })
                })
            });

        });
    });
}

async function promptUser(foundCourse) {
    /* Register the question with the found gauntlet as the default */
    enquirer.question('canvasID', 'Canvas Course ID:', {
        'default': foundCourse.id
    });

    /* Ask the user what course to run the action-series on */
    var answers = await enquirer.ask();

    if (answers.canvasID !== foundCourse.id) {
        foundCourse = await getUserCourse(answers.canvasID);
    }
    return runActionSeries(foundCourse);
}

getPristine()
    .then(promptUser)
    .then(courseObject => {
        console.log(`${courseObject.info.courseName} completely checked.`);

        // Report Set for Corey's Team
        courseObject.logger.createReportSet('LMS Team', [
            'Page - Contains Brightspace References',
            'Quiz Question - Contains Brightspace References',
            'Quiz - Contains Brightspace References',
            'Discussion - Contains Brightspace References',
            'Assignment - Contains Brightspace References',
            'Page - Contains Brainhoney References',
            'Quiz Question - Contains Brainhoney References',
            'Quiz - Contains Brainhoney References',
            'Discussion - Contains Brainhoney References',
            'Assignment - Contains Brainhoney References',
            'Page - Contains Adobe Connect References',
            'Quiz Question - Contains Adobe Connect References',
            'Quiz - Contains Adobe Connect References',
            'Discussion - Contains Adobe Connect References',
            'Assignment - Contains Adobe Connect References',
            'Page - Contains Adobe Flash References',
            'Quiz Question - Contains Adobe Flash References',
            'Quiz - Contains Adobe Flash References',
            'Discussion - Contains Adobe Flash References',
            'Assignment - Contains Adobe Flash References',
        ]);

        // Set the Report Header
        courseObject.setReportHeader(buildHeader(courseObject));
        // Generate the Console Report
        courseObject.consoleReport();
        // Generate the JSON Report
        courseObject.jsonReport('./reports');
        // Generate the HTML Report
        courseObject.htmlReport('./reports');
        // Generate specific report set reports
        courseObject.htmlReport('./reports', 'LMS Team');
    })
    .catch(console.log);