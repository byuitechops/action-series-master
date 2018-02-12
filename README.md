# Child Module Title
### *Package Name*: page-standards
### *Child Type*: Post Import
### *Platform*: Online 
### *Required*: Required

This child module is built to be used by the Brigham Young University - Idaho D2L to Canvas Conversion Tool. It utilizes the standard `module.exports => (course, stepCallback)` signature and uses the Conversion Tool's standard logging functions. You can view extended documentation [Here](https://github.com/byuitechops/d2l-to-canvas-conversion-tool/tree/master/documentation).

## Purpose

There is a long list of standards pages need to meet - in title, content, html, javascript, etc. Many of those standards changed when Canvas was brought on as our LMS. This child module attempts to fix issues where pages don't meet certain standards. It also handles situations where the page is no longer needed, needs it's content replaced, and similar concepts. It handles a large variety of page fixes and changes.

## How to Install

```
npm install page-standards
```

## Run Requirements

None

## Options

None so far.

## Outputs

None

## Process

Describe in steps how the module accomplishes its goals.

1. Retrieves pages from the Canvas course
2. Runs each page through a series of tests
3. If it passes a test (i.e. is a page that needs to be deleted) the related action is enacted upon the page
4. The page is updated on Canvas

## Log Categories

List the categories used in logging data in your module.

- Pages Deleted in Canvas
- Page Standards Implemented

## Requirements

Needs to be able to handle a large series of tests, each with a corresponding reaction should a page pass the test. Each test fulfills a requirement.

1. Delete specified pages
2. Rename pages that do not meet new naming conventions
3. Switch out "Lesson" to "Week" where context suggests we can
4. Removes banner image if not an overview page
5. Report images that do not have an alt image
6. Fix external links that do not open in a new tab ("target" attribute set to "_blank")
7. If not already in place, wrap the contents of the page in the new styling div
8. If a broken dropbox link is in the page, point it to the correct place
9. Rename "Setup Notes for Development Team" to "-Setup Notes & Course Settings"
10. Remove empty HTML tags that have no purpose (no class, ID, or content)
11. Remove extra HTML if applicable (this needs more detail)