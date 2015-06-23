/**
 * Dependencies
 */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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

var Mailman = (function () {
  function Mailman() {
    _classCallCheck(this, Mailman);
  }

  _createClass(Mailman, null, [{
    key: 'configure',
    value: function configure(service, auth) {
      var transport = undefined;

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
  }, {
    key: 'scanViews',
    value: function scanViews() {
      var path = this.options.views.path;

      if (!path) {
        throw new Error('Mailman.options.views.path is empty');
      }

      var files = walk(path);
      var views = {};

      files.forEach(function (file) {
        // /views/mailer_name/view_name.ejs => mailer_name

        var _file$replace$split = file.replace(path + '/', '').split('/');

        var _file$replace$split2 = _slicedToArray(_file$replace$split, 1);

        var mailerName = _file$replace$split2[0];

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
    }
  }, {
    key: 'renderView',
    value: function renderView(path, locals) {
      if (!this.render) {
        var options = this.options.views;

        this.render = views(options.path, {
          cache: options.cache,
          'default': options['default'],
          map: options.map
        });
      }

      return this.render(path, locals);
    }
  }, {
    key: 'send',
    value: function send(options) {
      return this.transport.sendMail(options);
    }
  }]);

  return Mailman;
})();

Mailman.options = {
  views: {
    path: '',
    cache: false,
    'default': '',
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

    _classCallCheck(this, Mail);

    this.options = options;
    this.locals = locals;
  }

  _createClass(Mail, [{
    key: 'deliver',
    value: regeneratorRuntime.mark(function deliver() {
      var options;
      return regeneratorRuntime.wrap(function deliver$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            options = Object.assign({}, this.options);
            context$2$0.next = 3;
            return Mailman.renderView(options.view, this.locals);

          case 3:
            options.html = context$2$0.sent;
            context$2$0.next = 6;
            return Mailman.send(options);

          case 6:
          case 'end':
            return context$2$0.stop();
        }
      }, deliver, this);
    })
  }]);

  return Mail;
})();

/**
 * Mailer
 */

// list of supported nodemailer options
var supportedOptions = ['from', 'to', 'cc', 'bcc', 'replyTo', 'inReplyTo', 'references', 'subject', 'headers', 'envelope', 'messageId', 'date', 'encoding'];

// mailman properties to ignore
var ignoredKeys = ['name', 'transport'];

var Mailer = (function () {
  function Mailer() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Mailer);

    Object.assign(this, options);

    if (!this.transport) this.transport = Mailman.transport;

    if (!Mailman.views) Mailman.scanViews();

    // we need to find any views defined on the Mailer
    for (var key in Mailman.views[this.name]) {
      // if this view is registered
      // as a method, wrap it into Mail factory
      if (this[key]) {
        this[key] = factory(this, key);
      }
    }
  }

  _createClass(Mailer, [{
    key: 'options',
    value: function options() {
      var _this = this;

      var options = {};

      // get only nodemailer supported properties
      supportedOptions.forEach(function (key) {
        return options[key] = _this[key];
      });

      return options;
    }
  }, {
    key: 'locals',
    value: function locals() {
      var locals = {};

      for (var key in this) {
        var value = this[key];

        // ignored keys, mailer name and transport
        var isIgnored = ignoredKeys.indexOf(key) >= 0;

        // nodemailer options
        var isOption = supportedOptions.indexOf(key) >= 0;

        // also, don't append functions
        var isFunction = 'function' === typeof value;

        // if none of those is true
        // apend new template variable
        if (!isIgnored && !isOption && !isFunction) {
          locals[key] = value;
        }
      }

      return locals;
    }
  }]);

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

var _exports = module.exports = Mailman;

_exports.Mailer = Mailer;
_exports.Mail = Mail;

// clone this.options

// render email body
