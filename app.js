var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
 passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

var async = require('async');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;



//Database Connection Start from here
var mysql = require('mysql');
var DATABASE = 'book';
var db_config = {
  user: 'root',
  password: 'password',
  host: 'localhost',
  port: '3306',
  database: DATABASE
};


function handleDisconnect() {
	connection = mysql.createConnection(db_config);

	connection.connect(function(err) {
		if (err) {
			console.log("Database Connection didnt happen because : ", err);
			setTimeout(handleDisconnect, 1000);
		}
	});


	// This handler is for when the connection is lost for some strange reason.
	// Now there is no reason to wait - just call handleDisconnect again - 
	// but do this only when the error is Protocol Connection Lost. For any other
	// errors - simply bail, dont try anything clever.
	connection.on('error', function(err) {
		console.log('db error', err);
		if (err.code === 'PROTOCOL_CONNECTION_LOST')  {
			handleDisconnect();
		} else {
			throw err;
		}
	});
}

//  Make things happen - dont forget to call the function - nothing happens automagically!!
//
handleDisconnect();

//Database Connection End to here

var routes = require('./routes/index');
var usersresource = require('./routes/users');
var config = require('./routes/api.js');



var app = express();

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
var session = require('express-session');
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', routes);
app.use('/users', usersresource);
var users = [];
function findById(id, fn) {
	connection.query("select * from users where id='"+ id +"' limit 1", function(err,user) {
		fn(null, user[0]);
	});
}
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new LocalStrategy(function(username,password,done){
   connection.query("select * from users where username='"+username+"' limit 1", function(err,user) {
	console.log(user);

    if(err) {	    
        return done(err);           
    }
	if(user.length == 0){	   
        return done(null,false,{message: 'Incorrect user name'});           
    }
    if(user[0].password != password) {	 
       return done(null,false,{message: 'Incorrect password'});
    }
    return done(null,user[0]);     
   });
}
));
// Authentication End here
// config facebook
function findOne(id, fn) {
	connection.query("select * from users where oauthID='"+ id +"' limit 1", function(err,user) {
		fn(null, user[0]);
	});
}


passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
   findOne(profile.id, function(err, user) {
	   console.log(user);
      if(err) {

        console.log(err);  // handle errors!
      }
      if (!err && user !== null && typeof(user) !== 'undefined') {
        done(null, user);
      } else {
console.log(profile);

	var user = {oauthID: profile.id,name: profile.displayName};
       	connection.query('INSERT INTO users SET ?', user,(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        }));
      }
    });
  }
));


// config google
passport.use(new GoogleStrategy({
    clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL
  },
  function(request, accessToken, refreshToken, profile, done) {
    findOne(profile.id, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null && typeof(user) !== 'undefined') {
        done(null, user);
      } else {
console.log(profile);

	var user = {oauthID: profile.id,name: profile.displayName,email:profile.email};
       connection.query('INSERT INTO users SET ?', user,(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        }));
      }
    });
  }
));


//Facebook
app.get('/auth/facebook',passport.authenticate('facebook'),
  function(req, res){});

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/users/login' }),
  function(req, res) {
    res.redirect('/');
 });



//Google
app.get('/auth/google',passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read'
  ] }
));
app.get('/auth/google/callback',passport.authenticate('google', { failureRedirect: '/users/login' }),
  function(req, res) {
    res.redirect('/');
  });

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {    
		return next();
	} 
	res.redirect('/users/login')
}


// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
module.exports = app;
