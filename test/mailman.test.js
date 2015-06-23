/**
 * Dependencies
 */

var Mailman = require('../');

require('chai').should();
require('mocha-generators').install();

/**
 * Tests
 */

describe ('Mailman', function () {
	var user = 'test_user';
	var password = 'test_password';
	var sender = 'sender@test.com';
	var receiver = 'receiver@test.com';

	before (function () {
		Mailman.options.views.path = __dirname + '/fixtures/views';
	});

  it ('should configure known transport', function () {
   // configuring gmail as an example
   Mailman.configure('gmail', { user, password });

   var transport = Mailman.transport.transporter.options;
   transport.service.should.equal('gmail');
   transport.auth.user.should.equal(user);
   transport.auth.pass.should.equal(password);
   transport.host.should.equal('smtp.gmail.com');
   transport.port.should.equal(465);
   transport.secure.should.equal(true);
  });

  it ('should configure smtp transport', function () {
   Mailman.configure({
      host: 'smtp.gmail.com',
      port: 587,
      auth: { user, pass: password }
   });

   var transport = Mailman.transport.transporter.options;
   transport.auth.user.should.equal(user);
   transport.auth.pass.should.equal(password);
   transport.host.should.equal('smtp.gmail.com');
   transport.port.should.equal(587);
  });

	it ('should define a mailer and mail', function () {
		class UserMailer extends Mailman.Mailer {
		  get name () { return 'user'; }
		  get from () { return sender; }

			welcome () {
				this.full_name = 'John Doe';
			}
		}

		var mail = new UserMailer({ to: receiver }).welcome();
		mail.locals.full_name.should.equal('John Doe');
		mail.options.view.should.equal('user/welcome.ejs');
		mail.options.from.should.equal(sender);
	});

	describe ('Backwards compatibility', function () {
	  it ('should define a mailer and mail with ES5-ish API', function () {
      let UserMailer = Mailman.Mailer.extend({
        name: 'user',
        from: sender,

        welcome: function () {
          this.full_name = 'John Doe';
        }
      });

  		var mail = new UserMailer({ to: receiver }).welcome();
  		mail.locals.full_name.should.equal('John Doe');
  		mail.options.view.should.equal('user/welcome.ejs');
  		mail.options.from.should.equal(sender);
	  });
	});
});
