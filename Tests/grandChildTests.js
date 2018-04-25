/* Dependencies */
const tap = require('tap');
const canvas = require('canvas-wrapper');
const asyncLib = require('async');
const cheerio = require('cheerio');

module.exports = (course, callback) => {
    tap.test('action-series-master', (tapTest) => {
        function universal_alt_attribute(altAttributeCallback) {
            altAttributeCallback(null);
        }

        function universal_broken_quicklinks(brokenQuicklinksCallback) {
            brokenQuicklinksCallback(null);
        }

        function universal_description_quicklinks(descriptionQuicklinksCallback) {
            descriptionQuicklinksCallback(null);
        }

        function universal_err_links(errLinksCallback) {
            errLinksCallback(null);
        }

        function universal_fix_dropbox_links(fixDropboxLinksCallback) {
            fixDropboxLinksCallback(null);
        }

        function universal_html_deprecated_tags(htmlDeprecatedTagsCallback) {
            htmlDeprecatedTagsCallback(null);
        }

        function universal_html_empty_tags(htmlEmptyTagsCallback) {
            htmlEmptyTagsCallback(null);
        }

        function universal_html_replace_tags(htmlReplaceTagsCallback) {
            htmlReplaceTagsCallback(null);
        }

        function universal_naming_conventions(namingConventionsCallback) {
            namingConventionsCallback(null);
        }

        function universal_references(referencesCallback) {
            referencesCallback(null);
        }

        function universal_remove_banner(removeBannerCallback) {
            removeBannerCallback(null);
        }

        function universal_rename(renameCallback) {
            renameCallback(null);
        }

        function universal_set_external_links(setExternalLinksCallback) {
            setExternalLinksCallback(null);
        }

        function universal_styling_div(stylingDivCallback) {
            stylingDivCallback(null);
        }

        function universal_target_attributes(targetAttributesCallback) {
            targetAttributesCallback(null);
        }

        /* An array of functions for each associated action in action-series-master */
        var myFunctions = [
            universal_alt_attribute,
            universal_broken_quicklinks,
            universal_description_quicklinks,
            universal_err_links,
            universal_fix_dropbox_links,
            universal_html_deprecated_tags,
            universal_html_empty_tags,
            universal_html_replace_tags,
            universal_naming_conventions,
            universal_references,
            universal_remove_banner,
            universal_rename,
            universal_set_external_links,
            universal_styling_div,
            universal_target_attributes,
        ];

        /* Run each universal grandchilds' test in its own function, one at a time */
        asyncLib.series(myFunctions, (seriesErr) => {
            if (seriesErr) {
                course.error(seriesErr);
            }
            tapTest.end();
        });
    });

    callback(null, course);
};