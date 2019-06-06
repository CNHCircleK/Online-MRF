var express = require('express');
var router = express.Router();

var app;
var utils;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var mongoSanitize = require('express-mongo-sanitize');

var auth = require("../auth");
var bcrypt = require('bcrypt');

router.post('/', function(req, res, next){
	var body = req.body;
	var errors = {};

	utils.checkIn(body, ['registration', 'email', 'password'], function(elem, res){
		if(!res){
			errors[elem] = "Required";
		}
	});

	if(Object.keys(errors).length > 0){	
		res.send({success: false, auth: true, error: errors});
		return
	}

	var registrationId = body['registration'].substring(0, 24);
	var secret = body['registration'].substring(24);

	if(!ObjectId.isValid(registrationId)){
		res.send({success: false, auth: true, error: {registration: "Expired or not found"}});
		return;
	}

	var registrationQuery = {"registration._id": ObjectId(registrationId), "password": {$exists: false}};
	app.db.collection("members").findOne(registrationQuery, function(err, member){
		if(err) throw err;
		if(member == null){
			res.send({success: false, auth: true, error: {registration: "Expired or not found"}});
			return;
		}

		bcrypt.compare(secret, member.registration.secret, function(err, matched){
			if(err) throw err;

			if(!matched){
				res.send({success: false, auth: true, error: {registration: "Expired or not found"}});
				return;
			}

			var errors = {};
			var email = body["email"];
			var password = body["password"];

			if(!(/^\S+@\S+\.\S+$/.test(email))){
				errors.email = "Invalid format";
			}

			if(password.length < 6){
				errors.password = "Must be more than 6 characters";
			}

			if(Object.keys(errors).length > 0){
				res.send({success: false, auth: true, error: errors});
				return;
			}

			bcrypt.hash(password, app.get('config').bcryptSaltRounds, function(err, hash){
				if(err) throw err;
				var setData = {$set: mongoSanitize.sanitize({
					email: email,
					password: hash
				})};

				app.db.collection("members").updateOne(registrationQuery, setData, function(err, updateRes){
					if(err) throw err;
					auth.signToken(app, member, function(err, token){
						if(err) throw err;
						res.send({success: true, auth: true, result: token});
					});
				});
			});
			
		});
		
	});
	
});

module.exports = function(newApp){
	app = newApp;
	utils = require('mrf-utils')(app);
	return {
		router: router,
	};
}