var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var utils;
var auth = require('./auth');

var crypto = require('crypto');
var bcrypt = require('bcrypt');

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();
});

router.post("/new", auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		auth(user.access.club > 0);
	},

	function(req, res, next){
		var body = req.body;
		var errors = {};
		utils.checkIn(body, ["firstName", "lastName"], function(elem, res){
			if(!res){
				errors[elem] = "Required";
			}
		});

		if(Object.keys(errors).length == 0){
			var data = 	mongoSanitize.sanitize({
				"name": {
					"first": body['firstName'], 
					"last": body['lastName']
				},
				"club_id": ObjectId(user.club_id),
				"division_id": ObjectId(user.division_id)
			});

			app.db.collection("members").insertOne(data, function(err, insertRes){
				if(err) throw err;
				res.send({success: true, auth: true});
			});	

		}else{
			res.send({success: false, auth: true, error: errors});
		}
	}
));

router.get("/:memberId", auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		if(ObjectId.isValid(req.params.memberId)){
			app.db.collection("members").findOne({"_id": ObjectId(req.params.memberId)}, function(err, memberRes){
				if(err) throw err;
				if(memberRes != null && memberRes._id == user._id || (memberRes.club_id == user.club_id && user.club_access == 1)){
					res.locals.member = memberRes;
					auth(true);
				}else{
					auth(false);
				}
			});
		}else{
			auth(false);
		}
	},

	function(req, res, next){
		res.send({success: true, auth: true, result: res.locals.member});
	}

));

router.get("/:memberId/registration", auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		if(req.params.memberId != null && ObjectId.isValid(req.params.memberId)){
			app.db.collection("members").findOne({"_id": ObjectId(req.params.memberId)}, function(err, memberRes){
				if(err) throw err;
				if(memberRes != null && memberRes.club_id == user.club_id && user.club_access == 1){
					res.locals.memberData = memberRes;
					auth(true);
				}else{
					auth(false);
				}				
			});
		}else{
			auth(false);
		}
	},

	function(req, res, next){
		if(res.locals.memberData.username != null){
			res.send({success: false, auth: true, error: "Member already has an account"});
		}

		crypto.randomBytes(24, function(err, buffer) {
			if(err) throw err;
			var codeId = ObjectId();
			var secret = buffer.toString('hex');

			bcrypt.hash(secret, app.get('config').bcryptSaltRounds, function(err, hash){
				if(err) throw err;
				var query = {"_id": ObjectId(res.locals.memberData._id)};
				var expire = new Date();
				expire.getDate(expire.getDate() + 14);

				var changes = {$set: {registration: {
					"_id": codeId,
					"secret": hash,
					"expiration": expire
				}}};

				app.db.collection("members").updateOne(query, changes, function(err, updateRes){
					if(err) throw err;
					res.send({success: true, auth: true, result: codeId + secret});

				});
			});
		});
	}
));

module.exports = router;