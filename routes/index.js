// app/routes.js

var nodemailer 	= require("nodemailer"),
	crypto 		= require("crypto"),
	async 		= require("async"),
	mysql 		= require('mysql'),
	bcrypt 		= require('bcrypt-nodejs'),
	dbconfig 	= require("../config/database");

var connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database);
module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		//res.render('index.ejs'); // load the index.ejs file
		res.redirect('/login')
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	app.get('/login', function(req, res) {
		res.render("login/login", { message: req.flash('loginMessage') });
	});

	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/dashboard',
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash 	: true // allow flash messages
		}),
        function(req, res) {
            if (req.body.remember) {
             	req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
            	req.session.cookie.expires = false;
            }
        res.redirect('/');
    });

	// =====================================
	// SIGNUP ==============================
	// =====================================
	app.get('/signup', function(req, res) {
		res.render("login/signup", { message: req.flash('signupMessage') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/dashboard',
		failureRedirect : '/signup', // redirect back tovar token = buf.toString('hex'); the signup page if there is an error
		failureFlash 	: true // allow flash messages
	}));

	// =====================================
	// Forgot ==============================
	// =====================================
	app.get('/forgot', function(req, res) {
	  	res.render("login/forgot",{ message: req.flash('forgotMessage') });
	});

	app.post('/forgot', function(req, res) {
		async.waterfall([
		    function(done) {
		       	crypto.randomBytes(20, function(err, buf) {
	        		var token = buf.toString('hex');
		        	done(err, token);
		      	});
		    },
		    function(token, done) {
		     	connection.query("SELECT * FROM users WHERE email = ?",req.body.email, function(err, user){
		        	if (user.length == 0) {
		          		req.flash("error", "No account with that email address exists.");
		          		return res.redirect("/forgot");
		        	}
		        	console.log(user);
	
		        	var EditUserMysql = {
                    	token: token,
                    	expires:   new Date()    
	            	};
	            	//var insertQuery = "UPDATE users SET reset_password_token= ?,reset_password_expires=? WHERE email = req.body.email values (?,?,?)";
                	connection.query("UPDATE users SET reset_password_token= ?,reset_password_expires= DATE_ADD(?, INTERVAL +1 DAY) WHERE email = ?",[EditUserMysql.token,EditUserMysql.expires,req.body.email],function(err, rows) {
		        		done(err, token, user);
		        	});
		      	});
		    },
		    function(token, user, done) {
		      	var smtpTransport = nodemailer.createTransport({
		        	service: "Gmail", 
		        	auth: {
		          		user: "email",
		          		pass: "pass_email"
		        	}
		      	});
		      	var mailOptions = {
		        	to: user[0].email,
		        	from: "Unico",
		        	subject	: "Unico Password Reset",
		        	text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
		          		"Please click on the following link, or paste this into your browser to complete the process:\n\n" +
		          		"http://" + req.headers.host + "/reset/" + token + "\n\n" +
		          		"If you did not request this, please ignore this email and your password will remain unchanged.\n"
		     	};
		      	smtpTransport.sendMail(mailOptions, function(err) {
		        	req.flash("success", "An e-mail has been sent to " + user[0].email + " with further instructions.");
		        	done(err, 'done');
		      	});
	    	}
		], function(err) {
			if (err) return next(err);
		    res.redirect("/forgot");
		});
	});

	app.get('/reset/:token', function(req, res) {
		var EditUserMysql = {
            token: req.params.token,
            expires:   new Date()    
	    };
		connection.query("SELECT * FROM users WHERE reset_password_token = ? and reset_password_expires >= DATE_ADD(?, INTERVAL +0 DAY)",[EditUserMysql.token,EditUserMysql.expires],function(err, user){	
	    	if (user.length > 0)  {
	      	 	res.render("login/reset", {token: req.params.token});
	   		} else{
		 	   	req.flash("error", 'Password reset token is invalid or has expired.') 
	      		res.redirect("/forgot");

			};
	  	});
	});


	app.post('/reset/:token', function(req, res) {
	  	async.waterfall([
	    	function(done) {
	    		var EditUserMysql = {
		            token: req.params.token,
		            expires:   new Date()    
			    };
	      		connection.query("SELECT * FROM users WHERE reset_password_token = ? and reset_password_expires >= DATE_ADD(?, INTERVAL +0 DAY)",[EditUserMysql.token,EditUserMysql.expires],function(err, user){
	        		if (user.length = 0)  {
	          			req.flash('error', 'Password reset token is invalid or has expired.');
	          			return res.redirect('back');
	        		}
	        		if(req.body.password === req.body.confirm) {
	        			var EditUserMysql = {
	                        password: bcrypt.hashSync(req.body.password, null, null)
	                    };
	          			connection.query("UPDATE users SET password= ?, reset_password_token=null ,reset_password_expires= null WHERE reset_password_token = ?",[EditUserMysql.password,req.params.token],function(err, user) {
	          				 done(err);
	          			});		
	        		} else {
	            		req.flash("error", "Passwords do not match.");
	            		return res.redirect("back");
	        		}	
	      		});
	    	}
	  	], function(err) {
	    	res.redirect('/');
	  	});
	});
	
	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect("/");
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
