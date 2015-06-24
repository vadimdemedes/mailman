/**
 * Dependencies
 */

var Class = require('class-extend');

var nodemailer = require('nodemailer');
var thunkify = require('thunkify');
var basename = require('path').basename;
var views = require('co-views');
var util = require('./util');

var walk = util.walk;


/**
 * Mailman
 */

class Mailman {
  static configure (service, auth) {
    let transport;

  	// if service is a string, assume that it's
  	// one of the nodemailer-wellknown
  	// supported services
  	// see https://github.com/andris9/nodemailer-wellknown#supported-services
  	if ('string' === typeof service) {
  		transport = nodemailer.createTransport({
  			service: service,
  			auth: {
  				user: auth.user,
  				pass: auth.password
  			}
  		});
  	}

  	if ('object' === typeof service) {
  		if ('undefined' === typeof service.sendMail) {
  			// if no sendMail property, assume
  			// that it's just normal object

  			transport = nodemailer.createTransport(service);
  		} else {
  			// else, it must be initialized
  			// 3rd-party transport
  			transport = service;
  		}
  	}

  	// transform sendMail into co-compatible fn
  	transport.sendMail = thunkify(transport.sendMail);

  	// set this transport as a default
  	return this.transport = transport;
  }

  static scanViews () {
    let path = this.options.views.path;

  	if (!path) {
  		throw new Error('Mailman.options.views.path is empty');
  	}

  	let files = walk(path);
  	let views = {};

  	files.forEach(file => {
  		// /views/mailer_name/view_name.ejs => mailer_name
  		let [mailerName] = file.replace(path + '/', '').split('/');

  		// /views/mailer_name/view_name.ejs => view_name
  		let viewName = basename(file).replace(/\.[a-z]{3,4}$/g, '');

  		// under_score to camelCase
  		viewName = viewName.replace(/\_[a-z0-9]/gi, function ($1) {
  			return $1.slice(1).toUpperCase();
  		});

  		if (!views[mailerName]) views[mailerName] = {};

  		// register view and store it's relative path
  		views[mailerName][viewName] = mailerName + '/' + basename(file);
  	});

  	this.views = views;
  }

  static renderView (path, locals) {
    if (!this.render) {
      let options = this.options.views;

  		this.render = views(options.path, {
  			cache: options.cache,
  			default: options.default,
  			map: options.map
  		});
  	}

  	return this.render(path, locals);
  }

  static send (options) {
    return this.transport.sendMail(options);
  }
}

Mailman.options = {
	views: {
		path: '',
		cache: false,
		default: '',
		map: {}
	}
};


/**
 * Mail
 */


class Mail {
  constructor (options = {}, locals = {}) {
    this.options = options;
    this.locals = locals;
  }

  * deliver () {
    // clone this.options
		let options = Object.assign({}, this.options);

		// render email body
		options.html = yield Mailman.renderView(options.view, this.locals);

		yield Mailman.send(options);
  }
}


/**
 * Mailer
 */

// list of supported nodemailer options
var supportedOptions = [
	'from',
	'to',
	'cc',
	'bcc',
	'replyTo',
	'inReplyTo',
	'references',
	'subject',
	'headers',
	'envelope',
	'messageId',
	'date',
	'encoding'
];

// mailman properties to ignore
var ignoredKeys = [
	'name',
	'transport'
];

class Mailer {
	constructor (options = {}) {
		Object.assign(this, options);

		if (!this.transport) this.transport = Mailman.transport;

		if (!Mailman.views) Mailman.scanViews();

		// we need to find any views defined on the Mailer
		for (let key in Mailman.views[this.name]) {
			// if this view is registered
			// as a method, wrap it into Mail factory
			if (this[key]) {
				this[key] = factory(this, key);
			}
		}
	}

	options () {
		let options = {};

		// get only nodemailer supported properties
		supportedOptions.forEach(key => options[key] = this[key]);

		return options;
	}

	locals () {
		let locals = {};

		for (let key in this) {
		  let value = this[key];

			// ignored keys, mailer name and transport
			let isIgnored = ignoredKeys.indexOf(key) >= 0;

			// nodemailer options
			let isOption = supportedOptions.indexOf(key) >= 0;

			// also, don't append functions
			let isFunction = 'function' === typeof value;

			// if none of those is true
			// apend new template variable
			if (!isIgnored && !isOption && !isFunction) {
				locals[key] = value;
			}
		}

		return locals;
	}
}

Mailer.extend = Class.extend;

// method that replaces function in mailer
// with a function that gets options and locals
// and creates new Mail object and returns it
function factory (mailer, method) {
	let fn = mailer[method];

	return function () {
		fn.apply(mailer, arguments);

		let options = mailer.options();
		let locals = mailer.locals();

		// get path for a view
		options.view = Mailman.views[this.name][method];

		return new Mail(options, locals);
	};
}


/**
 * Expose `Mailman`
 */

var exports = module.exports = Mailman;

exports.Mailer = Mailer;
exports.Mail = Mail;
