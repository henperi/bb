//config/passport.js

//Bring in the essentials
const LocalStrategy = require("passport-local").Strategy;

//Bring in the admin Model
const Admin = require("../app/models/Admin.model");
const bcrypt = require("bcryptjs");

module.exports = passport => {
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
    Admin.findById(id, function(err, admin) {
      done(err, admin);
    });
  });

  // =========================================================================
  // SIGNUP ==================================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  // =========================================================================
  // LOGIN ==================================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use(
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true // allows us to pass back the entire request to the callback
      },
      (req, email, password, done) => {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        emailQuery = { email: email };
        Admin.findOne(emailQuery, (err, admin) => {
          // if there are any errors, return the error before anything else
          if (err) throw err;

          // if no user is found, return the message
          if (!admin) {
            console.log(`no user is found`);
            return done(
              null,
              false,
              req.flash("errorMsg", "Admin account doesnt exist.")
            ); // req.flash is the way to set flashdata using connect-flash
          }

          // if the user is found but the password is wrong
          bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (err) {
              throw err;
            }
            if (!isMatch) {
              console.log(`user is found but the password is wrong`);
              return done(
                null,
                false,
                req.flash("errorMsg", "Oops! Wrong password.")
              ); // create the loginMessage and save it to session as flashdata
            } else {
              console.log(`all is well, return successful admin`);
              return done(null, admin);
            }
          });
        });
      }
    )
  );
};
