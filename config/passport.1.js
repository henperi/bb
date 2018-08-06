//config/passport.js

//Bring in the essentials
const LocalStrategy = require('passport-local').Strategy;

//Bring in the admin Model
const Admin =  require('../app/models/Admin.model');

module.exports = (passport) => {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(admin, done) {
        done(null, admin.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, admin) {
            done(err, admin);
        });
    });

    // =========================================================================
    // SIGNUP ==================================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    }, (req, email, password, done) => {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists 
            Admin.findOne({ 'local.email': email }, (err, admin_email) => {
                if(err) {
                    return done(err);
                }
                if(admin_email){
                    return done(null, false, req.flash('signUpError', 'That email has already been taken'));
                } else {

                    // if there is no user with that email
                    // create the user
                    var newAdmin = new Admin();
                    newAdmin.local.firstname = firstname;
                    newAdmin.local.lastname = lastname;
                    newAdmin.local.mobile = mobile;
                    newAdmin.local.email = email;
                    newAdmin.local.password = password;
                    newAdmin.local.p_check = p_check;

                    // save the Admin
                    newAdmin.save( (err) => {
                        if(err) throw err;
                        else {
                            return done(null, newAdmin)
                        }
                    });
                }
            });
        });
    }));

};