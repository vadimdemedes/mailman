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

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
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

var Mailman = (function () {
  function Mailman() {}

  _prototypeProperties(Mailman, {
    configure: {
      value: function configure(service, auth) {
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
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    scanViews: {
      value: function scanViews() {
        var path = this.options.views.path;

        if (!path) {
          throw new Error("Mailman.options.views.path is empty");
        }

        var files = walk(path);
        var views = {};

        files.forEach(function (file) {
          // /views/mailer_name/view_name.ejs => mailer_name
          var _file$replace$split = file.replace(path + "/", "").split("/");

          var _file$replace$split2 = _slicedToArray(_file$replace$split, 1);

          var mailerName = _file$replace$split2[0];


          // /views/mailer_name/view_name.ejs => view_name
          var viewName = basename(file).replace(/\.[a-z]{3,4}$/g, "");

          // under_score to camelCase
          viewName = viewName.replace(/\_[a-z0-9]/gi, function ($1) {
            return $1.slice(1).toUpperCase();
          });

          if (!views[mailerName]) views[mailerName] = {};

          // register view and store it's relative path
          views[mailerName][viewName] = mailerName + "/" + basename(file);
        });

        this.views = views;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    renderView: {
      value: function renderView(path, locals) {
        if (!this.render) {
          var options = this.options.views;

          this.render = views(options.path, {
            cache: options.cache,
            "default": options["default"],
            map: options.map
          });
        }

        return this.render(path, locals);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    send: {
      value: function send(options) {
        return this.transport.sendMail(options);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Mailman;
})();

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


var Mail = (function () {
  function Mail() {
    var options = arguments[0] === undefined ? {} : arguments[0];
    var locals = arguments[1] === undefined ? {} : arguments[1];
    this.options = options;
    this.locals = locals;
  }

  _prototypeProperties(Mail, null, {
    deliver: {
      value: function* deliver() {
        // clone this.options
        var options = Object.assign({}, this.options);

        // render email body
        options.html = yield Mailman.renderView(options.view, this.locals);

        yield Mailman.send(options);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Mail;
})();




/**
 * Mailer
 */

// list of supported nodemailer options
var supportedOptions = ["from", "to", "cc", "bcc", "replyTo", "inReplyTo", "references", "subject", "headers", "envelope", "messageId", "date", "encoding"];

// mailman properties to ignore
var ignoredKeys = ["name", "transport"];

var Mailer = (function () {
  function Mailer() {
    var options = arguments[0] === undefined ? {} : arguments[0];
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
  }

  _prototypeProperties(Mailer, null, {
    options: {
      value: function options() {
        var _this = this;
        var options = {};

        // get only nodemailer supported properties
        supportedOptions.forEach(function (key) {
          return options[key] = _this[key];
        });

        return options;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    locals: {
      value: function locals() {
        var locals = {};

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
            locals[key] = value;
          }
        }

        return locals;
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Mailer;
})();

Mailer.extend = Class.extend;

// method that replaces function in mailer
// with a function that gets options and locals
// and creates new Mail object and returns it
function factory(mailer, method) {
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


/**
 * Expose `Mailman`
 */

var exports = module.exports = Mailman;

exports.Mailer = Mailer;
exports.Mail = Mail;
