/**
 * Dependencies
 */

var fs = require('fs');


/**
 * Expose utilities
 */

var exports = module.exports;

exports.walk = walk;


/**
 * Utilities
 */

function walk (path) {
	let files = [];
	
	// readdir returns only file names
	// convert them to full path
	files = fs.readdirSync(path).map(file => `${path}/${file}`);
	
	let index = 0;
	let file;
	
	while (file = files[index++]) {
		let stat = fs.lstatSync(file);
		// if directory append its contents
		// after current array item
		if (stat.isDirectory()) {
			let args = walk(file);
			args.unshift(index - 1, 1);
			files.splice.apply(files, args);
		}
	}
	
	return files;
}
