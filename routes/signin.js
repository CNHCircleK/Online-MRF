var express = require('express');
var router = express.Router();
var app;

var mongoSanitize = require('express-mongo-sanitize');

var auth = require("../auth");
var bcrypt = require('bcrypt');

var utils;

router.post('/', function(req, res, next){
	var body = req.body;
	var errors = {};

	utils.checkIn(body, ['email', 'password'], function(elem, res){
		if(!res){
			errors[elem] = "Required";
		}
	});

	if(Object.keys(errors).length > 0){
		res.send({success: false, auth: true, error: errors});
		return;
	}

	var query = {email: {$regex: "^" + String(mongoSanitize.sanitize(body['email'])) + "$", $options: "i"}};
	var projection = {name: 1, club_id: 1, division_id: 1, access: 1};

	app.db.collection("members").findOne(query, projection, function(err, member){
		if(err) throw err;
		if(member == null){
			res.send({success: false, auth: true, error: {password: "Account credentials don't match"}});
			return;
		}

		bcrypt.compare(body['password'], member.password, function(err, matched){
			if(err) throw err;
			if(!matched){
				res.send({success: false, auth: true, error: {password: "Account credentials don't match"}});
				return;
			}

			auth.signToken(app, member, function(err, token){
				res.send({success: true, auth: true, result: token});
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