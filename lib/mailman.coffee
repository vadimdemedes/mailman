Mailer = require 'nodemailer'
Templato = require 'templato'
fs = require 'fs'
{exec} = require 'child_process'
glob = require 'glob'
_ = require 'lodash'

extractExtension = (s) ->
	parts = s.replace(/^.*[\/\\]/g, '').split '.'
	parts[1..(parts.length - 1)].join '.'

class Mailman
	@viewsDir: ''
	
	@connect: (params) ->
		transport = if params.service.toLowerCase() is 'ses' then 'SES' else 'SMTP'
		params.auth = user: params.user, pass: params.password
		params.secureConnection = !! params.ssl
		@transport = Mailer.createTransport transport, params
	
class Mailman.Model	
	constructor: ->
		@attachments = []
		@generateTextFromHTML = yes
		@transport = Mailman.transport
		@params = {}
		@templateVariables = {}
	
	sendMail: (callback) ->
		@params.html = @template.render _.extend({ params: @params }, @templateVariables)
		@transport.sendMail @params, callback
	
	loadTemplate: (path, done) ->
		fs.readFile path, 'utf-8', (err, source) =>
			@template = new Templato
			@template.set engine: extractExtension(path), template: source
			do done if done
	
	deliver: (callback) ->
		keys = ['from', 'to', 'cc', 'bcc', 'replyTo', 'subject', 'text', 'html', 'headers', 'attachments', 'encoding', 'generateTextFromHTML']
		
		_.forIn @, (value, key) =>
			if not ('function' is typeof value)
				if _.contains(keys, key)
					@params[key] = value
				else @templateVariables[key] = value
		
		if not (@text or @html)
			if extractExtension(@view)
				@loadTemplate "#{ Mailman.viewsDir }/#{ @view }", => @sendMail(callback)
			else
				glob "#{ Mailman.viewsDir }/#{ @view }.*", {}, (err, files) =>
					@loadTemplate files[0], => @sendMail(callback)
		else @sendMail(callback)	
		
	send: -> @deliver.apply @, arguments
	
module.exports = Mailman