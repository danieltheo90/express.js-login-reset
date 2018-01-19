// config/passport.js

// load all the things we need
var LocalStrategy   = require("passport-local").Strategy,
    mysql           = require("mysql"),
    bcrypt          = require("bcrypt-nodejs"),
    dbconfig        = require("./database"),
    connection      = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);
module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

       passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });

    passport.use(
        "local-signup",
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : "username",
            passwordField : "password",
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            connection.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    req.flash("error", "That username is already taken.");
                    return done(null, false, null);
                    //return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {

                    var newUserMysql = {
                        username: username,
                        email: req.body.email,
                        password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
                    };

                    var insertQuery = "INSERT INTO users ( username,email, password ) values (?,?,?)";

                    connection.query(insertQuery,[newUserMysql.username, newUserMysql.email,newUserMysql.password],function(err, rows) {
                        newUserMysql.id = rows.insertId;

                        return done(null, newUserMysql);
                    });
                }
            });
        })
    );
    passport.use(
        "local-login",
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : "username",
            passwordField : "password",
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            connection.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash("error", "No User Found"));
                    //return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash("error", "Oops! Wrong password."));
                    //return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, rows[0]);
            });
        })
    );

};
