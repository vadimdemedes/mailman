/**
 * Dependencies
 */

'use strict';

var fs = require('fs');

/**
 * Expose utilities
 */

var _exports = module.exports;

_exports.walk = walk;

/**
 * Utilities
 */

function walk(path) {
	var files = [];

	// readdir returns only file names
	// convert them to full path
	files = fs.readdirSync(path).map(function (file) {
		return path + '/' + file;
	});

	var index = 0;
	var file = undefined;

	while (file = files[index++]) {
		var stat = fs.lstatSync(file);
		// if directory append its contents
		// after current array item
		if (stat.isDirectory()) {
			var args = walk(file);
			args.unshift(index - 1, 1);
			files.splice.apply(files, args);
		}
	}

	return files;
}
