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

function runActionSeries(foundCourse) {
    return new Promise((resolve, reject) => {
        /* Register the question with the found gauntlet as the default */
        enquirer.question('canvasID', 'Canvas Course ID:', { 'default': foundCourse.id });

        /* Ask the user what course to run the action-series on */
        enquirer.ask()
            .then(answers => {
                createCourseObject({}, (err, course) => {
                    course.info.checkStandards = true;
                    course.info.canvasOU = answers.canvasID;

                    /* Run the action-series model on the course */
                    main(course, (err, courseObject) => {
                        if (err) return reject(err);
                        resolve(courseObject);
                    });
                });
            });
    });
}

getPristine()
    .then(runActionSeries)
    .then(courseObject => {
        console.log('Success');
    })
    .catch(console.error);



