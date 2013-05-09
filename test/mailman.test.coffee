Mailman = require '../'

should = require 'should'

describe 'Mailman', ->
	describe 'Transports', ->
		describe 'SMTP', ->
			it 'should send out an email', (done) ->
				Mailman.connect host: 'smtp.server.com', service: 'smtp', port: 587, user: 'user', password: 'password', ssl: no
				
				Mailman.viewsPath = "#{ __dirname }/views"
				
				class Notifier extends Mailman.Model
					from: 'test@test.com'
					subject: 'We launched!'
					view: 'notifier'
				
				mail = new Notifier
				mail.to = 'test@gmail.com'
				mail.name = 'Steve'
				mail.deliver (err, response) ->
					should.not.exist err
					done()
					