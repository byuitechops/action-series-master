const main = require('./main.js');
const createCourseObject = require('create-course-object');
const reporter = require('conversion-reporter');
const Enquirer = require('enquirer');
var enquirer = new Enquirer();

function reportMe(reportFunction, course) {
    return new Promise((resolve, reject) => {
        reportFunction(course, (err, courseObj) => {
            if (err) return reject(err);
            else resolve(courseObj);
        });
    });
}

enquirer.question('canvasID', 'Canvas Course ID:', { 'default': '7778' });
enquirer.ask()
    .then(answers => {
        createCourseObject({}, (err, course) => {
            course.info.checkStandards = true;
            course.info.canvasOU = answers.canvasID;
            main(course, (err, courseObject) => {
                if (err) console.log(err);
                else {

                    reportMe(reporter.jsonReport, course)
                        .then((courseObj) => {
                            return reportMe(reporter.htmlReport, courseObj);
                        })
                        .then((courseObj) => {
                            return reportMe(reporter.htmlReport, courseObj);
                        })
                        .catch(console.log);

                    /* YOLO */
                    // reporter.jsonReport(courseObj, (err1, courseObj2) => {
                    //     if (err1) {
                    //         console.log(err1);
                    //         return;
                    //     }
                    //     reporter.consoleReport(courseObj2, (err2, courseObj3) => {
                    //         if (err2) {
                    //             console.log(err2);
                    //             return;
                    //         }
                    //         reporter.htmlReport(courseObj3, (err3, courseObj4) => {
                    //             if (err3) {
                    //                 console.log(err3);
                    //                 return;
                    //             }
                    //             console.log(`Course Standards Check for Canvas Course ID ${answers.canvasID} complete.`);
                    //         });
                    //     });
                    // });
                }
            });
        });
    });


