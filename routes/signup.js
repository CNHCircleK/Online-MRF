var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var utils;

var bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();	
});

router.get('/', function(req, res, next){
	res.send("Signup form");
});

router.post('/', function(req, res, next){
	var body = req.body;
	var allIn = true;

	if(utils.allIn(body, ['registration-code', 'email', 'username', 'password'])){
		var registrationId = body['registration-code'].substring(0, 24);
		var secret = body['registration-code'].substring(24);

		if(!ObjectId.isValid(registrationId)){
			// TODO: Form Validation Handling
			res.send("Invalid Registration Code");
			return;
		}

		var registrationQuery = {"registration._id": ObjectId(registrationId), "username": {$exists: false}}
		app.db.collection("members").findOne(registrationQuery, function(err, member){
			if(err) throw err;

			if(member != null){
				bcrypt.compare(secret, member.registration.secret, function(err, matched){
					if(err) throw err;

					if(matched){
						bcrypt.hash(body['password'], SALT_ROUNDS, function(err, hash){
							if(err) throw err;

							// TODO: Check Validity of username and email
							var setData = {$set: mongoSanitize.sanitize({
								"email": body['email'],
								"username": body['username'],
								"password": hash
							})};

							app.db.collection("members").updateOne(registrationQuery, setData, function(err, updateRes){
								if(err) throw err;
								req.session.memberId = member._id;
								req.session.save();
								res.redirect('/');
							});
						});
					}else{
						if(err) throw err;
						// TODO: Form Validation Handling
						res.send("Invalid Registration Code");
					}
				});
			}else{
				// TODO: Form Validation Handling
				res.send("Invalid Registration Code");
			}
		});
	}else{
		// TODO: Form Validation Handling
		res.send("Missing Fields");
	}
});

module.exports = router;