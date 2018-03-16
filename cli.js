const main = require('./main.js');
const createCourseObject = require('create-course-object');
const Logger = require('logger');
const logger = new Logger;
const canvas = require('canvas-wrapper');
const Enquirer = require('enquirer');
var enquirer = new Enquirer();

function getPristine() {
    return new Promise((resolve, reject) => {
        canvas.get('/api/v1/accounts/1/courses?search_term=1 (Pristine)', (getErr, foundCourse) => {
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
            resolve(givenCourse);
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

            /* Run the action-series model on the course */
            main(course, (err, courseObject) => {
                if (err) return reject(err);
                resolve(courseObject);
            });
        });
    });
}

async function promptUser(foundCourse) {
    /* Register the question with the found gauntlet as the default */
    enquirer.question('canvasID', 'Canvas Course ID:', { 'default': foundCourse.id });

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
    })
    .catch(console.error);



