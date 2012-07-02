# Mailman

Send emails in a comfortable way via models.

# Installation

`npm install mailman`

# Usage

## Connecting

```coffee-script
Mailman = require 'mailman'

Mailman.connect service: 'smtp', host: 'smtp.gmail.com', user: 'test@gmail.com', password: 'test', ssl: yes
```

## Defining

```coffee-script
class Notifier extends Mailman.Model
	from: 'support@newapp.com'
	subject: 'NewApp launched!'
	text: 'Yes yes yes, you heard it.'

Notifier = Mailman.setup Notifier # this is required
```

## Sending

```coffee-script
mail = new Notifier
mail.to = 'recipient@gmail.com'
mail.deliver (err, response) ->
	# email sent
```

# Tests

Put in your auth credentials into **test/mailman.test.coffee** and run `mocha` in Terminal.

# License

MIT.