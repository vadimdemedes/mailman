Mailman = require '../'

should = require 'should'

describe 'Mailman', ->
	describe 'Transports', ->
		describe 'SMTP', ->
			it 'should send out an email', (done) ->
				Mailman.connect host: 'smtp.sendgrid.net', service: 'smtp', port: 587, user: 'user', password: 'password'

				
				class Notifier extends Mailman.Model
					from: 'test@test.com'
					subject: 'We launched!'
					text: 'We launched, sign up right now!'
				
				Notifier = Mailman.setup Notifier
				
				mail = new Notifier
				mail.to = 'test@test2.com'
				mail.deliver (err, response) ->
					should.not.exist err
					done()
					