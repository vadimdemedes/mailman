Mailer = require 'nodemailer'

class Mailman
	@connect: (params) ->
		transport = if params.service.toLowerCase() is 'ses' then 'SES' else 'SMTP'
		params.auth = user: params.user, pass: params.password
		params.secureConnection = !! params.ssl
		@transport = Mailer.createTransport transport, params
	
	@setup: (model) ->
		model::transport = @transport
		model
	
class Mailman.Model	
	constructor: ->
		@attachments = []
		@generateTextFromHTML = yes
	
	deliver: (callback) ->
		keys = ['from', 'to', 'cc', 'bcc', 'replyTo', 'subject', 'text', 'html', 'headers', 'attachments', 'encoding']
		params = {}
		for key in keys
			params[key] = @[key] if @[key] and @[key].length > 0
		
		@transport.sendMail params, callback	
		
	send: -> @deliver.apply @, arguments
	
module.exports = Mailman