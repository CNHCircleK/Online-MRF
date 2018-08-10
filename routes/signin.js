var express = require('express');
var router = express.Router();
var app;

var mongoSanitize = require('express-mongo-sanitize');

var bcrypt = require('bcrypt');
var auth = require("../auth");

var utils;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();	
});

router.post('/', function(req, res, next){
	var body = req.body;
	console.log(body);
	var errors = {};

	utils.checkIn(body, ['name', 'password'], function(elem, res){
		if(!res){
			errors[elem] = "Required";
		}
	});

	if(Object.keys(errors).length == 0){
		var query = {$or:[mongoSanitize.sanitize({username: body['name']}), mongoSanitize.sanitize({email: body['name']}) ]};
		var projection = {name: 1, club_id: 1, division_id: 1, access: 1};

		app.db.collection("members").findOne(query, projection, function(err, member){
			if(err) throw err;
			if(member != null){
				bcrypt.compare(body['password'], member.password, function(err, matched){
					if(err) throw err;
					if(matched){
						auth.signToken(app, member, function(err, token){
							res.send({success: true, auth: true, result: token});
						});
					}else{
						res.send({success: false, auth: true});
					}		
				})
			}else{
				res.send({success: false, auth: true});
			}
		});		
	}else{
		res.send({success: false, auth: true, error: errors});
	}
});

module.exports = router;