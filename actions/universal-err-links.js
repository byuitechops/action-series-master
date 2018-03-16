const cheerio = require('cheerio');
//var externalResources = require('./externalResources.js');
var externalResources = [
    /addremovecourseassistant/,
    /addremoveteststudent/,
    /aleks/,
    /appfinder/,
    /campuscoursemanagementtool/,
    /cengagemindlinkslaunchhiddenfromusers/,
    /cengagemindlinkssystemcheckhiddenfromusers/,
    /chatwithsupporttickettool/,
    /evolvelink/,
    /financialaidbulk/,
    /financialaidtool/,
    /lumenohm/,
    /macmillancoursebuilderlaunchhiddenfromusers/,
    /macmillancoursetoolslaunchhiddenfromusers/,
    /mapleta/,
    /mcgraw-hillcampus/,
    /mcgraw-hillconnectlaunchhiddenfromusers/,
    /mycourselistlaunchhiddenfromusers/,
    /mylab&masteringlinkslaunchhiddenfromusers/,
    /mylabandmasteringlaunchhiddenfromusers/,
    /notusednowacademichonestyform/,
    /pearsongradesyncanddiagnostics/,
    /pearson\/tpi\/medialti/,
    /pearson\/tpi\/mml_xl/,
    /perusall/,
    /portfolium/,
    /proctorfreeaauditportalhiddenfromusers/,
    /proctorfreecontrolpanelhiddenfromusers/,
    /proctorfreestudentportalhiddenfromusers/,
    /redshelfebook/,
    /redshelfmyshelf/,
    /requesthelptickettool/,
    /secureexamproctor/,
    /simnetlaunchhiddenfromusers/,
    /specialprivilegedaccountstrackerlaunchhiddenfromusers/,
    /taskstream/,
    /vitalsourceebook/,
    /wiggio/,
    /wileyplus/,
    /wileypluscoursebuilderlaunchhiddenfromusers/,
    /google/
];

module.exports = (course, item, callback) => {

    /* This is the action that happens if the test is passed */
    function action() {
        var $ = cheerio.load(item.techops.getHTML(item));
        var links = $('a');
        var foundERR;
        links = links.filter((i, link) => !$(link).attr('href').includes('https://byui.instructure.com'));
        links.each(function (i, link) {
            link = $(link).attr('href').toLowerCase();
            foundERR = externalResources.find(externalResource => externalResource.test(link));
            if (foundERR != undefined) {
                course.log('ERR Identified', {
                    'name': foundERR.toString().replace(/\//g, ''),
                    'url': link,
                    'item': item.techops.getTitle(item),
                    'type': item.techops.type
                });
            }
        });
        callback(null, course, item);
    }


    /* If the item is marked for deletion, do nothing */
    if (item.techops.delete === true || item.techops.getHTML(item) === null) {
        callback(null, course, item);
        return;
    } else {
        action();
    }
};