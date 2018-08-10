var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var MongoClient = require('mongodb').MongoClient;
var db;

var config = require('./config');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
	app.set('config', config);
	next();
});

app.use(require('cors')());

function route(routeName, routerLocation = null){
	var router = require('./routes/' + (routerLocation != null ? routerLocation : routeName));
	app.use('/' + routeName, router);
}

route('', 'index');
route('admin');
route('signup');
route('signin');
route('members');
route('events');
route('clubs');
route('divisions');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

MongoClient.connect(config.mongoURL, function(error, database){
	if(error){
		throw error;
	}

	db = database.db("cnhMRF");
	module.exports.db = db;

	console.log("MongoDB connection established");
	app.listen(3000, '0.0.0.0', function() {
		console.log("Express server listening on port 3000");
	});
});

module.exports = app;