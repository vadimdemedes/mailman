/**
 * Dependencies
 */

var Mailman = require('../');

require('chai').should();
require('mocha-generators')();

/**
 * Tests
 */

describe ('Mailman', function () {
	var user = 'test_user';
	var password = 'test_password';
	
	before (function () {
		Mailman.options.views.path = __dirname + '/fixtures/views';
	});
	
	it ('should configure known transport', function () {
		// configuring gmail as an example
		Mailman.configure('gmail', {
			user: user,
			password: password
		});
		
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
		   port: 465,
		   secure: true,
		   auth: {
		       user: user,
		       pass: password
		   } 
		});
		
		var transport = Mailman.transport.transporter.options;
		transport.auth.user.should.equal(user);
		transport.auth.pass.should.equal(password);
		transport.host.should.equal('smtp.gmail.com');
		transport.port.should.equal(465);
		transport.secure.should.equal(true);
	});
	
	it ('should define a mailer and mail', function *() {
		var UserMailer = Mailman.Mailer.extend({
			name: 'user',
			from: 'test@test.com',
			
			welcome: function () {
				this.full_name = 'John Doe';
			}
		});
		
		var mail = new UserMailer({ to: 'receiver@test.com' }).welcome();
		mail.locals.full_name.should.equal('John Doe');
		mail.options.view.should.equal('user/welcome.ejs');
		mail.options.from.should.equal('test@test.com');
	});
});