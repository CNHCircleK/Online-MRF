var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var utils;

var crypto = require('crypto');
var bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

router.all('*', function(req, res, next){
	if(req.session.userId == null){
		res.redirect('signin');
	}else{
		app = req.app;
		utils = require('mrf-utils')(app);
		next();			
	}
});

router.all("/", function(req, res, next){
	res.redirect("/");
});

router.get("/new", function(req, res, next){
	res.send("Show new members form");
});

router.post("/new", function(req, res, next){
	var body = req.body;
	if(utils.allIn(body, ["clubId", "firstName", "lastName"])){
		var data = 	{
			"name": {
				"first": body['firstName'], 
				"last": body['lastName']
			},
			"club_id": body['clubId']
		}
		utils.createNew("members", data, "clubs", res.locals.clubData._id, function(err, success){
			if(err) throw err;
			if(success){
				res.redirect("/" + res.locals.clubData._id +"/members/");
			}else{
				res.send("Invalid Club Id");
			}
		});
	}else{
		res.send("Missing fields");
	}
});

function checkMemberId(req, res, next){
	if(req.params.memberId != null && ObjectId.isValid(req.params.memberId)){
		app.db.collection("members").findOne({"_id": ObjectId(req.params.memberId)}, function(err, memberRes){
			if(err) throw err;
			if(memberRes != null){
				// TODO: Check if access level matches
				res.locals.memberData = memberRes;
				next();
			}else{
				res.send("Not allowed to view content");
			}			
		});
	}else{
		res.send("Not allowed to view content");
	}

}

router.all("/:memberId", checkMemberId);
router.all("/:memberId/*", checkMemberId);

router.get("/:memberId", function(req, res, next){
	res.send("Show member info");
});

router.get("/:memberId/registration-code", function(req, res, next){
	if(res.locals.memberData.username != null){
		res.send("Member already has an account");
		return;
	}

	crypto.randomBytes(24, function(err, buffer) {
		if(err) throw err;
		var codeId = ObjectId();
		var secret = buffer.toString('hex');

		bcrypt.hash(secret, SALT_ROUNDS, function(err, hash){
			if(err) throw err;
			var query = {"_id": ObjectId(res.locals.memberData._id), "username": {$exists: false}};

			var expire = new Date();
			expire.getDate(expire.getDate() + 14);

			var changes = {$set: {registration: {
				"_id": codeId,
				"secret": hash,
				"source_id": ObjectId(req.session.userId),
				"expiration": expire
			}}};

			app.db.collection("members").updateOne(query, changes, function(err, updateRes){
				if(err) throw err;
				res.send(codeId + secret);

			});
		});
	});
});

module.exports = router;