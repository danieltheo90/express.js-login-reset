// app/routes.js

var mysql 		= require('mysql'),
	dbconfig 	= require("../config/database");

var connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database);

module.exports = function(app, passport) {
	app.get('/dashboard', isLoggedIn, function(req, res) {
		res.render("dashboard/index", {user : req.user});
		console.log('abc');
	});

};

// route middleware to make sure
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();
	// if they aren't redirect them to the home page
	res.redirect('/');
}
