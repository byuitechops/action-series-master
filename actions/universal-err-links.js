const cheerio = require('cheerio');
//var externalResources = require('./externalResources.js');
var externalResources = [
    /addremovecourseassistant/,
    /addremoveteststudent/,
    /aleks/,
    /appfinder/,
    /basicintegration/,
    /campuscoursemanagementtool/,
    /cengagemindlinks/,
    /chatwithsupporttickettool/,
    /d2l\/launchpadintegration/,
    /deeplink/,
    /equella/,
    /evolvelink/,
    /financialaidbulk/,
    /financialaidtool/,
    /iclicker/,
    /kaltura/,
    /labsim/,
    /lumenohm/,
    /macmillan/,
    /mapleta/,
    /maplesoft/,
    /mcgraw-hillcampus/,
    /mcgraw-hillconnect/,
    /mycourselist/,
    /mylab/,
    /myshelf/,
    /mymathlab\/myeconlab/,
    /notusednowacademichonestyform/,
    /pearsongradesyncanddiagnostics/,
    /pearson\/tpi\/medialti/,
    /pearson\/tpi\/mml_xl/,
    /perusall/,
    /portfolium/,
    /proctor/,
    /proctorio/,
    /qualtrics/,
    /redshelfebook/,
    /redshelfmyshelf/,
    /requesthelptickettool/,
    /secureexamproctor/,
    /simnet/,
    /specialprivilegedaccountstracker/,
    /taskstream/,
    /tophat/,
    /turnitin/,
    /vitalsource/,
    /vitalsourceebook/,
    /wiggio/,
    /wileyplus/,
    /zoom/
];

module.exports = (course, item, callback) => {

    /* This is the action that happens if the test is passed */
    function action() {
        var $ = cheerio.load(item.techops.getHTML(item));
        var links = $('a');
        var foundERR;
        if (links != undefined) {
            links = links.filter((i, link) => {
                if($(link).attr('href') !== undefined) {
                    return !$(link).attr('href').includes('https://byui.instructure.com');
                } else {
                    course.message('Link without href attribute found');
                    return false;
                }
            });
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
        }
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