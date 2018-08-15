var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var utils;
var auth = require('../auth');

var crypto = require('crypto');
var bcrypt = require('bcrypt');

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();
});

function checkMemberAuth(projection, memberAuth, callback = null){
	if(callback == null){
		callback = memberAuth;
		memberAuth = projection;
		projection = {};
	}

	return auth.checkAuth(
		function(req, res, auth){
			var user = res.locals.user;
			if(!ObjectId.isValid(req.params.memberId)){
				auth(false);
			}else{
				var query = {"_id": ObjectId(req.params.memberId)};
				app.db.collection("members").findOne(query, {projection: projection}, function(err, memberRes){
					if(err) throw err;
					if(memberRes != null){
						memberAuth(req, res, auth);
					}else{
						auth(false);
					}
				});			
			}
		}, callback
	);
}

router.get("/:memberId", checkMemberAuth({name: 1, club_id: 1, division_id: 1, "access.club": 1, email: 1},
	function(req, res, auth){
		var member = res.locals.member;
		auth(member.user_id.equals(user._id) || (member.club_id.equals(user.club_id) && user.club_access > 0));
	},

	function(req, res, next){
		res.send({success: true, auth: true, result: res.locals.member})
	}
));

router.get("/:memberId/events", checkMemberAuth({name: 1, club_id: 1},
	function(req, res, auth){
		var member = res.locals.member;
		auth(member.user_id.equals(user._id) || (member.club_id.equals(user.club_id) && user.club_access > 0));
	},

	function(req, res, next){
		var query = {author_id: res.locals.member._id};
		var projection = {name: 1, status: 1, time: 1};
		app.db.collection("events").find(query, {projection: projection}).toArray(function(err, events){
			if(err) throw err;
			res.send({success: true, auth: true, result: events});
		});		
	}

));

router.get("/:memberId/registration", checkMemberAuth({name: 1, club_id: 1, "access.club": 1},
	function(req, res, auth){
		var member = res.locals.member;
		var user = res.locals.user;
		auth(member.club_id.equals(user.club_id) && user.club_access >= member.access.club.level);			
	},

	function(req, res, next){
		if(res.locals.member.username != null){
			res.send({success: false, auth: true, error: "Member already has an account"});
		}

		crypto.randomBytes(24, function(err, buffer) {
			if(err) throw err;
			var codeId = ObjectId();
			var secret = buffer.toString('hex');

			bcrypt.hash(secret, app.get('config').bcryptSaltRounds, function(err, hash){
				if(err) throw err;
				var query = {"_id": ObjectId(res.locals.member._id)};
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