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
```

### For JS-only folks

```javascript
var Notifier = Mailman.Model.extend({
	from: 'support@newapp.com',
	subject: 'NewApp launched!',
	text: 'Yes yes yes, you heard it.'
});
```

## Sending

```coffee-script
mail = new Notifier
mail.to = 'recipient@gmail.com'
mail.deliver (err, response) ->
	# email sent
```

## Views

If your emails contain dynamic information, why not to use all those template engines you love?

```coffee-script
Mailman.viewsDir = "#{ __dirname }/views"

class Notifier extends Mailman.Model
	from: 'support@newapp.com'
	subject: 'NewApp launched!'
	view: 'notifier' # Mailman will auto-guess the extension.
					 # This field is optional, class' name will be taken by default.

mail = new Notifier
mail.to = 'recipient@gmail.com'
mail.name = 'Steve'
mail.surname = 'Jobs'
mail.deliver (err, response) ->
	# email sent
```

# Tests

Put in your auth credentials into **test/mailman.test.coffee** and run `mocha` in Terminal.

# License

MIT.