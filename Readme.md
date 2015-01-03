# Mailman

Send emails in a comfortable way via models.

[![Circle CI](https://circleci.com/gh/vdemedes/mailman.svg?style=svg)](https://circleci.com/gh/vdemedes/mailman)

## Features

- Uses nodemailer under the hood to send out emails
- All nodemailer transports (including 3rd-party ones) are supported
- Uses [consolidate.js](https://github.com/tj/consolidate.js) to render email templates (views)
- ActiveMailer-inspired API, very comfortable
- Clean, simple and lightweight code base (176 sloc)

## Installation

```
npm install mailman --save
```

**Warning**: Only Node.js v0.11.x and higher with --harmony enabled is required:

```
node --harmony something.js
```

**Note**: In order for the following examples to work, you need use something like [co](https://github.com/tj/co) to run generators.
**Another note**: If you want to use ES6 classes (like in the following examples), use [6to5](https://github.com/6to5/6to5). If not, there is an alternative API left from previous versions of Mailman.


## Usage

### Configuration

To configure Mailman's basic options:

```javascript
var Mailman = require('mailman');

// path to a folder where
// your views are stored
Mailman.options.views.path = 'path_to_views/';

// cache templates or not
Mailman.options.views.cache = false;

// default template engine
// guesses by extension otherwise
Mailman.options.views.default = 'ejs';
```

To setup a transport:

- Configuring one of the [known services](https://github.com/andris9/nodemailer-wellknown#supported-services):

```javascript
Mailman.configure('gmail', {
    user: 'user@gmail.com',
    password: 'password'
});
```

- Configuring default SMTP transport (options passed directly to nodemailer):

```javascript
Mailman.configure({
   host: 'smtp.gmail.com',
   port: 465,
   secure: true,
   auth: {
       user: 'user@gmail.com',
       pass: 'password'
   } 
});
```

- Configuring with 3rd-party nodemailer transport:

```javascript
// assuming that transport is
// initialized nodemailer transport

Mailman.configure(transport);
```

### Views

Mailman uses [consolidate.js](https://github.com/tj/consolidate.js) to render many template engines easily.
Mailman expects, that your folder with views is structured like this:

```
- user/
    - welcome.ejs
    - forgot_password.ejs
    - reset_password.ejs
```

In this folder structure, it is clear that User mailer has welcome, forgot_password and reset\_password emails.

### Defining Mailer and sending

To send out emails, you need to define mailer first.
Mailer is a Class, that contains emails for certain entity.
For example, User mailer may contain welcome, forgot password, reset password emails.
Each of the emails is represented as a usual function, which should set template variables for a view.

**Note**: Email function name **must** be the same as its view name (camelCased)

```javascript
class UserMailer extends Mailman.Mailer {
    // need to manually set mailer name
    // UserMailer => user
    get name () { return 'user'; }
    
    // default from for all emails
    get from () { return 'sender@sender.com'; }
    
    // default subject for all emails
    get subject () { return 'Hello World'; }
    
    // welcome email
    welcome () {
        // set all your template variables
        // on this
        
        this.full_name = 'John Doe';
        this.currentDate = new Date();
    }
    
    // forgot password email
    forgotPassword () {
        this.token = 12345;
    }
}
```

To send out each of these emails, simply:

```javascript
var mail;

mail = new UserMailer({ to: 'receiver@receiver.com' }).welcome();
yield mail.deliver();

mail = new UserMailer({ to: 'receiver@receiver.com' }).forgotPassword();
yield mail.deliver();
```


## Tests

```
npm test
```


# License

Mailman is released under the MIT License.
