var express = require('express');
var router = express.Router();
var app;

var mongoSanitize = require('express-mongo-sanitize');

var bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

var utils;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();	
});

router.get('/', function(req, res, next){
	res.send("Send signin page");
});

router.post('/', function(req, res, next){
	var body = req.body;
	if(utils.allIn(body, ['name', 'password'])){
		var findUser = {$or:[mongoSanitize.sanitize({"username": body['name']}), mongoSanitize.sanitize({"email": body['name']}) ]};
		app.db.collection("members").findOne(findUser, function(err, user){
			if(err) throw err;
			if(user != null){
				bcrypt.compare(body['password'], user.password, function(err, matched){
					if(err) throw err;
					if(matched){
						req.session.userId = user._id;
						req.session.save();
						res.send("Success");
					}else{
						// TODO: Form Validation Handling
						res.send("Error");
					}		
				})
			}
		});		
	}else{
		// TODO: Form Validation Handling
		res.send("Error");
	}
});

module.exports = router;