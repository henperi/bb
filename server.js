//server.js

//Setting Up The Server =====================================================================//

//Require the essential modules to working with express
const express = require('express');

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const session = require('express-session');
// const expressMessages = require('express-messages');
const expressValidator = require('express-validator');
const expressHbs = require('express-handlebars');

const flash = require('connect-flash');
const passport = require('passport');
const mongoose = require('mongoose');

const sessionStore = require('sessionstore');

//Bring in the configured database
const configDB = require('./config/database');

// //Database Local Connection
mongoose.connect(configDB.local_url, { useNewUrlParser: true }).then(
    () => {console.log('Database is connected') },
    err => { console.log('Can not connect to the database:' +err)
});
mongoose.Promise = global.Promise;

//Database Remote Connection
// mongoose db connection()
// mongoose.connect(configDB.remote_url, { useNewUrlParser: true }, err => {
//     if(err){
//         console.log('Error: ' + err)
//     } else {
//         console.log('Connected to mogo db');
//     }
// });
// mongoose.Promise = global.Promise;


//Setup the express Application
const app = express();

//Define The Port
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const CONCURRENCY = process.env.WEB_CONCURRENCY || 1;


console.log('port defined as:', PORT);
//Set the static assets folder
app.use(express.static(__dirname + '/public'));

//Express Session Middleware
app.use(session({
    cookie: { maxAge: 600000 },
    secret: 'some_random_generated_const_string',
    resave: true,
    saveUninitialized: true,
    store: sessionStore.createSessionStore({
        type: 'mongodb',
    })
}));

//Express Flash and Messaging Middleware
app.use(flash());
app.use( (req, res, next) => {
    res.locals.success_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');

    res.locals.errorMsg = req.flash('errorMsg');
    res.locals.warningMsg = req.flash('warningMsg');
    res.locals.infoMsg = req.flash('infoMsg');
    res.locals.successMsg = req.flash('successMsg');;
    next();
});

//Some Neccessary development middlewares
app.use(morgan('dev')); //log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // get information from html forms

//Express Validator Middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;
   
      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    }
}));

//Bring in Passport
require('./config/passport')(passport);
app.use(passport.initialize()); // init passport
app.use(passport.session()); // persistent login sessions

//Setup the view engine
app.engine('.hbs', expressHbs({
    defaultLayout: 'layout',
    extname: '.hbs'
}));

app.set('view engine', '.hbs');

//Routes =================================================================
const adminRoute = require('./routes/web/admins');
app.use('/admins', adminRoute);

app.use('/', (req, res, next) => {
    res.send("landing page");
});



//Launch the server
app.listen(PORT, HOST, () => {
    console.log(`Serving nodeJs server via port: ${PORT}`)
})