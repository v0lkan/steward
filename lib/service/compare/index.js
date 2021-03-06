/*global exports, console*/

'use strict';

var fs = require('fs');

var config = require('../../config').config;
var inform = require('../mail').send;

var kSnapsBaseDir = config.app.SNAP_BASE_DIR;
var kCheckBaseDir = config.app.CHECK_BASE_DIR;
var kSnapshotCount = config.app.SNAPSHOT_COUNT;
var kMinDiff = config.app.MIN_DIFF_PERCENTAGE_TO_WARN;
var kWarningLimit = config.app.MAX_WARNING_MAIL_COUNT_BEFORE_EXIT;

function populateFiles(ar) {
    var i;

    for(i = 0; i < kSnapshotCount; i++) {

         // TODO: this file type goes to conifg.
         ar.push(i + '.tiff');
    }
}

var mailCounter = 0;

function checkDifference(ar) {
    var file1, file2, i, j, k, diffCounter;

    var start = +(new Date());

    for (i=0; i < kSnapshotCount; i++) {
        for (j = i + 1; j < kSnapshotCount; j++) {
            file1 = fs.readFileSync(kSnapsBaseDir + ar[i]);
            file2 = fs.readFileSync(kSnapsBaseDir + ar[j]);

            diffCounter = 0;

            for (k = 0; k < file1.length; k++) {
                if ( file1[k] !== file2[k] ) {
                    diffCounter++;
                }
            }

            var perCent = (diffCounter/file1.length)*100;

            if (perCent > kMinDiff) {
                fs.writeFileSync(kCheckBaseDir +
                    '_' + perCent + '_' + i + '_' + j + '_' + ar[i] +
                    '_' + start + '_check.tiff', file1);
                fs.writeFileSync(kCheckBaseDir +
                    '_' + perCent + '_' + i + '_' + j + '_' + ar[j] +
                    '_' + start + '_check.tiff', file2);

                inform();

                i = kSnapshotCount + 1;
                j = kSnapshotCount + 1;

                return (++mailCounter) <= kWarningLimit;
            }
        }
    }

    return true;
}

function compareSync(then) {
    var files = [];

    populateFiles(files);

    var shouldProceed = checkDifference(files);

    if (!shouldProceed) {
        console.log('exiting');
        return;
    }

    then();
}

exports.compareSync = compareSync;
