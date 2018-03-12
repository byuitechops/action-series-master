const main = require('./main.js');
const createCourseObject = require('create-course-object');
const Enquirer = require('enquirer');
var enquirer = new Enquirer();

enquirer.question('canvasID', 'Canvas Course ID:', { 'default': '7663' });
enquirer.ask()
    .then(answers => {
        createCourseObject({}, (err, course) => {
            course.info.checkStandards = true;
            course.info.canvasOU = answers.canvasID;
            console.log(`course.info: ${JSON.stringify(course.info, null, '\t')}`);
            main(course, (err, courseObj) => {
                if (err) console.log(err);
                else console.log('Check complete');
            });
        });
    });


