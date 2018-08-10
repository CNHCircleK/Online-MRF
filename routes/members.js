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

var checkMemberAccess = auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		if(!ObjectId.isValid(req.params.memberId)){
			auth(false);
		}else{
			var query = {"_id": ObjectId(req.params.memberId)};
			var projection = {club_id: 1, division_id: 1, access: 1, email: 1, name: 1}
			app.db.collection("members").findOne(query, {projection: projection}, function(err, memberRes){
				if(err) throw err;
				if(memberRes != null 
					&& memberRes._id.equals(user._id) 
					|| (memberRes.club_id.equals(user.club_id) && user.club_access > 0)){
					res.locals.member = memberRes;
					auth(true);
				}else{
					auth(false);
				}
			});			
		}
	},

	function(req, res, next){
		next();
	}
);

router.all("/:memberId", checkMemberAccess);
router.all("/:memberId/*", checkMemberAccess);

router.get("/:memberId", function(req, res, next){
	res.send({success: true, auth: true, result: res.locals.member})
});

router.get("/:memberId/registration", auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		if(req.params.memberId != null && ObjectId.isValid(req.params.memberId)){
			app.db.collection("members").findOne({"_id": ObjectId(req.params.memberId)}, function(err, memberRes){
				if(err) throw err;
				if(memberRes != null && memberRes.club_id.equals(user.club_id) && user.club_access == 1){
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