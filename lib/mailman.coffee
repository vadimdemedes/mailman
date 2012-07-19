Mailer = require 'nodemailer'
Templato = require 'templato'
fs = require 'fs'
{exec} = require 'child_process'

extractExtension = (s) ->
	parts = s.replace(/^.*[\/\\]/g, '').split '.'
	parts[1..(parts.length - 1)].join '.'

class Mailman
	@viewsPath: ''
	
	@connect: (params) ->
		transport = if params.service.toLowerCase() is 'ses' then 'SES' else 'SMTP'
		params.auth = user: params.user, pass: params.password
		params.secureConnection = !! params.ssl
		@transport = Mailer.createTransport transport, params
	
	@setup: (model) ->
		model::transport = @transport
		model::className = model.name
		model
	
class Mailman.Model	
	constructor: ->
		@attachments = []
		@generateTextFromHTML = yes
	
	deliver: (callback) ->
		keys = ['from', 'to', 'cc', 'bcc', 'replyTo', 'subject', 'text', 'html', 'headers', 'attachments', 'encoding', 'className', 'template']
		params = {}
		variables = {}
		
		for key of @
			if 'string' is typeof @[key]
				if -1 is keys.indexOf(key)
					variables[key] = @[key]
				else params[key] = @[key]
		
		next = =>
			params.html = @template.render variables
			@transport.sendMail params, callback
		
		if not (@text or @html)
			if not @template
				exec "find #{ Mailman.viewsPath } -iname '#{ @view or @className.toLowerCase() }*' -exec echo {} \\;", (err, stdout) =>
					stdout = stdout.trim()
					fs.readFile stdout, 'utf-8', (err, source) =>
						@template = new Templato
						@template.set engine: extractExtension(stdout), template: source
						next()
			else next()	
		
	send: -> @deliver.apply @, arguments
	
module.exports = Mailman