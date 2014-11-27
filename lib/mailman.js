/**
 * Dependencies
 */

var Class = require('class-extend');

var nodemailer = require('nodemailer');
var thunkify = require('thunkify');
var basename = require('path').basename;
var views = require('co-views');
var util = require('./util');

var extend = util.extend;
var walk = util.walk;

/**
 * Expose `Mailman`
 */

var exports = module.exports = Mailman;


/**
 * Mailman
 */

function Mailman () {
	
};

Mailman.options = {
	views: {
		path: '',
		cache: false,
		default: '',
		map: {}
	}
};

Mailman.configure = function (service, auth) {
	var transport;
	
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
};

Mailman.scanViews = function () {
	var path = this.options.views.path;
	
	if (!path) {
		throw new Error('Mailman.options.views.path is empty');
	}
	
	var files = walk(path);
	var views = {};
	
	files.forEach(function (file) {
		// /views/mailer_name/view_name.ejs => mailer_name
		var mailerName = file.replace(path + '/', '').split('/')[0];
		
		// /views/mailer_name/view_name.ejs => view_name
		var viewName = basename(file).replace(/\.[a-z]{3,4}$/g, '');
		
		// under_score to camelCase
		viewName = viewName.replace(/\_[a-z0-9]/gi, function ($1) {
			return $1.slice(1).toUpperCase();
		});
		
		if (!views[mailerName]) views[mailerName] = {};
		
		// register view and store it's relative path
		views[mailerName][viewName] = mailerName + '/' + basename(file);
	});
	
	this.views = views;
};

Mailman.renderView = function (path, locals) {
	if (!this.render) {
		this.render = views(this.options.views.path, {
			cache: this.options.views.cache,
			default: this.options.views.default,
			map: this.options.views.map
		});
	}
	
	return this.render(path, locals);
};

Mailman.send = function (options) {
	return this.transport.sendMail(options);
};


/**
 * Mail
 */


var Mail = exports.Mail = Class.extend({
	constructor: function (options, locals) {
		this.options = options;
		this.locals = locals;
	},

	deliver: function *() {
		// clone this.options
		var options = extend({}, this.options);
		
		// render email body
		options.html = yield Mailman.renderView(options.view, this.locals);

		yield Mailman.send(options);
	}
});


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

var Mailer = exports.Mailer = Class.extend({
	constructor: function (options) {
		extend(this, options);
		
		if (!this.transport) this.transport = Mailman.transport;
		
		if (!Mailman.views) Mailman.scanViews();
		
		// iterate over this object
		for (var key in this) {
			// if this method name registered
			// as a view, wrap it into Mail factory
			if (Mailman.views[this.name] && Mailman.views[this.name][key]) {
				this[key] = factory(this, key);
			}
		}
	},
	
	options: function () {
		var options = {};
		
		var index = 0;
		var key;
		
		// get only nodemailer supported properties
		while (key = supportedOptions[index++]) {
			if (this[key]) options[key] = this[key];
		}
		
		return options;
	},
	
	locals: function () {
		var locals = {};
		
		for (var key in this) {
			// ignored keys, mailer name and transport
			var isIgnored = ignoredKeys.includes(key);
			
			// nodemailer options
			var isOption = supportedOptions.includes(key);
			
			// also, don't append functions
			var isFunction = 'function' === typeof this[key];
			
			// if none of those is true
			// apend new template variable
			if (!isIgnored && !isOption && !isFunction) {
				locals[key] = this[key];
			}
		}
		
		return locals;
	}
});

// method that replaces function in mailer
// with a function that gets options and locals
// and creates new Mail object and returns it
function factory (mailer, method) {
	var fn = mailer[method];
	
	return function () {
		fn.apply(mailer, arguments);
		
		var options = mailer.options();
		var locals = mailer.locals();
		
		// get path for a view
		options.view = Mailman.views[this.name][method];
		
		return new Mail(options, locals);
	};
}