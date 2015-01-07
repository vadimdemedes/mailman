"use strict";

var _slicedToArray = function (arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else {
    var _arr = [];

    for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      _arr.push(_step.value);

      if (i && _arr.length === i) break;
    }

    return _arr;
  }
};

/**
 * Dependencies
 */

var Class = require("class-extend");

var nodemailer = require("nodemailer");
var thunkify = require("thunkify");
var basename = require("path").basename;
var views = require("co-views");
var util = require("./util");

var walk = util.walk;


/**
 * Mailman
 */

var Mailman = function Mailman() {};

Mailman.configure = function (service, auth) {
  var transport = undefined;

  // if service is a string, assume that it's
  // one of the nodemailer-wellknown
  // supported services
  // see https://github.com/andris9/nodemailer-wellknown#supported-services
  if ("string" === typeof service) {
    transport = nodemailer.createTransport({
      service: service,
      auth: {
        user: auth.user,
        pass: auth.password
      }
    });
  }

  if ("object" === typeof service) {
    if ("undefined" === typeof service.sendMail) {
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
    throw new Error("Mailman.options.views.path is empty");
  }

  var files = walk(path);
  var _views = {};

  files.forEach(function (file) {
    // /views/mailer_name/view_name.ejs => mailer_name
    var _ref = file.replace(path + "/", "").split("/");

    var _ref2 = _slicedToArray(_ref, 1);

    var mailerName = _ref2[0];


    // /views/mailer_name/view_name.ejs => view_name
    var viewName = basename(file).replace(/\.[a-z]{3,4}$/g, "");

    // under_score to camelCase
    viewName = viewName.replace(/\_[a-z0-9]/gi, function ($1) {
      return $1.slice(1).toUpperCase();
    });

    if (!_views[mailerName]) _views[mailerName] = {};

    // register view and store it's relative path
    _views[mailerName][viewName] = mailerName + "/" + basename(file);
  });

  this.views = _views;
};

Mailman.renderView = function (path, locals) {
  if (!this.render) {
    var _options = this.options.views;

    this.render = views(_options.path, {
      cache: _options.cache,
      "default": _options["default"],
      map: _options.map
    });
  }

  return this.render(path, locals);
};

Mailman.send = function (options) {
  return this.transport.sendMail(options);
};

Mailman.options = {
  views: {
    path: "",
    cache: false,
    "default": "",
    map: {}
  }
};


/**
 * Mail
 */


var Mail = function Mail(options, locals) {
  if (options === undefined) options = {};
  if (locals === undefined) locals = {};
  this.options = options;
  this.locals = locals;
};

Mail.prototype.deliver = function* () {
  // clone this.options
  var _options2 = Object.assign({}, this.options);

  // render email body
  _options2.html = yield Mailman.renderView(_options2.view, this.locals);

  yield Mailman.send(_options2);
};




/**
 * Mailer
 */

// list of supported nodemailer options
var supportedOptions = ["from", "to", "cc", "bcc", "replyTo", "inReplyTo", "references", "subject", "headers", "envelope", "messageId", "date", "encoding"];

// mailman properties to ignore
var ignoredKeys = ["name", "transport"];

var Mailer = function Mailer(options) {
  if (options === undefined) options = {};
  Object.assign(this, options);

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
};

Mailer.prototype.options = function () {
  var _this = this;
  var _options3 = {};

  // get only nodemailer supported properties
  supportedOptions.forEach(function (key) {
    return _options3[key] = _this[key];
  });

  return _options3;
};

Mailer.prototype.locals = function () {
  var _locals = {};

  for (var key in this) {
    var value = this[key];

    // ignored keys, mailer name and transport
    var isIgnored = ignoredKeys.includes(key);

    // nodemailer options
    var isOption = supportedOptions.includes(key);

    // also, don't append functions
    var isFunction = "function" === typeof value;

    // if none of those is true
    // apend new template variable
    if (!isIgnored && !isOption && !isFunction) {
      _locals[key] = value;
    }
  }

  return _locals;
};

Mailer.extend = Class.extend;

// method that replaces function in mailer
// with a function that gets options and locals
// and creates new Mail object and returns it
function factory(mailer, method) {
  var fn = mailer[method];

  return function () {
    fn.apply(mailer, arguments);

    var _options4 = mailer.options();
    var _locals2 = mailer.locals();

    // get path for a view
    _options4.view = Mailman.views[this.name][method];

    return new Mail(_options4, _locals2);
  };
}


/**
 * Expose `Mailman`
 */

var exports = module.exports = Mailman;

exports.Mailer = Mailer;
exports.Mail = Mail;
