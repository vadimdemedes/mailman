# Mailman

Send emails in a comfortable way via models.

## Installation

```
npm install mailman --save
```

**Warning**: Only Node.js v0.11.x and higher with --harmony enabled is required:

```
node --harmony something.js
```

**Note**: In order for the following examples to work, you need use something like [co](https://github.com/tj/co).


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
var UserMailer = Mailman.Mailer.extend({
    // need to manually set mailer name
    // UserMailer => user
    name: 'user', 
    
    // default from for all emails
    from: 'sender@sender.com',
    
    // default subject for all emails
    subject: 'Hello World',
    
    // welcome email
    welcome: function () {
        // set all your template variables
        // on this
        
        this.full_name = 'John Doe';
        this.currentDate = new Date();
    },
    
    // forgot password email
    forgotPassword: function () {
        this.token = 12345;
    }
});
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

The MIT License (MIT) Copyright © 2014 Vadim Demedes vdemedes@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.