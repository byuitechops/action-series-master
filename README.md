# Action Series Master
### *Package Name*: action-series-master
### *Child Type*: Post Import
### *Platform*: Online 
### *Required*: Required

This child module is built to be used by the Brigham Young University - Idaho D2L to Canvas Conversion Tool. It utilizes the standard `module.exports => (course, stepCallback)` signature and uses the Conversion Tool's standard logging functions. You can view extended documentation [Here](https://github.com/byuitechops/d2l-to-canvas-conversion-tool/tree/master/documentation).

## Purpose

This module abstracts the pattern used by the action-series model.

The action-series model takes a single object returned by a GET request and puts it through a series of submodules, each containing a condition and an action. If the condition passes, the action is committed on the object, and then passed on. If the condition fails, the action is not ran and the object is passed on to the next submodule. When all of the submodules have completed, the object is then converted into a PUT object, and then sent to Canvas to implement the new changes to the object. This model prevents the need for additional API calls, prevents many module coordination issues, and speeds up the conversion process.

## How to Install

```
npm install action-series-master
```

## Run Requirements

None

## Options

None

## Outputs

None

## Process

This module takes in a series of "templates" (action-series-pages, action-series-discussions, action-series-quizzes, etc.) and runs an asynchronous forEach on them. Each template provides methods and data used to complete the action-series model. Since retrieving quizzes and updating quizzes is a different format than retrieving pages and updating pages in Canvas, it has been left to the template to provide the methods to do so. action-series-master just contains the action-series pattern and enacts it using each template.

## Log Categories

Please review the documentation for each action-series template.

## Requirements

Please review the documentation for each action-series template.

