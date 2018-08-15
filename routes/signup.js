var express = require('express');
var router = express.Router();
var app;
var utils;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var bcrypt = require('bcrypt');
var auth = require("../auth");

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();	
});

router.post('/', function(req, res, next){
	var body = req.body;
	var errors = {};

	utils.checkIn(body, ['registration', 'email', 'username', 'password'], function(elem, res){
		if(!res){
			errors[elem] = "Required";
		}
	});

	if(Object.keys(errors).length == 0){
		var registrationId = body['registration'].substring(0, 24);
		var secret = body['registration'].substring(24);

		if(!ObjectId.isValid(registrationId)){
			res.send({success: false, auth: true, error: "Invalid registration code"});
			return;
		}

		var registrationQuery = {"registration._id": ObjectId(registrationId), "username": {$exists: false}}
		app.db.collection("members").findOne(registrationQuery, function(err, member){
			if(err) throw err;

			if(member != null){
				bcrypt.compare(secret, member.registration.secret, function(err, matched){
					if(err) throw err;

					if(matched){
						bcrypt.hash(body['password'], app.get('config').bcryptSaltRounds, function(err, hash){
							if(err) throw err;

							// TODO: Check Validity of username and email
							var setData = {$set: mongoSanitize.sanitize({
								email: body['email'],
								username: body['username'],
								password: hash
							})};

							app.db.collection("members").updateOne(registrationQuery, setData, function(err, updateRes){
								if(err) throw err;
								auth.signToken(app, member, function(err, token){
									res.send({success: true, auth: true, result: token});
								});
							});
						});
					}else{
						res.send({success: false, auth: true, error: "Invalid registration code"});
					}
				});
			}else{
				res.send({success: false, auth: true, error: "Invalid registration code"});
			}
		});
	}else{
		res.send({success: false, auth: true, error: errors});
	}
});

module.exports = router;