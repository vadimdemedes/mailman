Mailman = require '../'

Mailman.connect host: 'smtp.server.com', service: 'smtp', port: 587, user: 'user', password: 'password', ssl: no
Mailman.viewsDir = "#{ __dirname }/views"

should = require 'should'

describe 'Mailman', ->
	describe 'Transports', ->
		describe 'SMTP', ->
			it 'should send out an email using CoffeeScript interface', (done) ->
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
			
			it 'should send out an email using JavaScript interface', (done) ->
				Notifier = Mailman.Model.extend
					from: 'test@test.com'
					subject: 'We launched!'
					view: 'notifier'
				
				mail = new Notifier
				mail.to = 'test@gmail.com'
				mail.name = 'Steve'
				mail.deliver (err, response) ->
					should.not.exist err
					done()
					