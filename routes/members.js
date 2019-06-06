var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var utils;
var checkAuth = require('../auth').checkAuth;

var crypto = require('crypto');
var bcrypt = require('bcrypt');

function getMember(memberId, projection, callback){
	if(!ObjectId.isValid(memberId)){
		callback(null);
		return;
	}

	var query = {"_id": ObjectId(memberId)};
	app.db.collection("members").findOne(query, {projection: projection}, function(err, member){
		if(err) throw err;
		callback(member);
	});
}

function getMembers(clubId, memberIds, projection, callback){
	var members = [];
	memberIds.forEach(function(memberId){
		if(ObjectId.isValid(memberId)){
			members.push({"_id": ObjectId(memberId)});
		}
	});

	if(members.length > 0){
		var query = {$or: members};
		if(clubId != null){
			if(ObjectId.isValid(clubId)){
				query.club_id = ObjectId(clubId);
			}else{
				callback([]);
				return;
			}
		}
		
		app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
			if(err) throw err;
			callback(members);
		});		
	}else{
		callback(null);
	}

}

router.get("/:memberId", checkAuth(function(req, res, auth){
	getMember(req.params.memberId, {access: 1, club_id: 1, division_id: 1, email: 1, name: 1}, function(member){
		var user = res.locals.user;
		res.locals.member = member;
		if(member == null){
			auth(false);
			return;
		}

		auth(member._id.equals(user._id) || (member.club_id.equals(user.club_id) && user.access.club > 0));
		
	});

}), function(req, res, next){
	res.send({success: true, auth: true, result: res.locals.member})
});

router.get("/:memberId/events", checkAuth(function(req, res, auth){
	getMember(req.params.memberId, {"_id": 1, club_id: 1}, function(member){
		var user = res.locals.user;
		res.locals.member = member;
		if(member == null){
			auth(false);
			return;
		}

		auth(member._id.equals(user._id) || (member.club_id.equals(user.club_id) && user.access.club > 0));
	});

}), function(req, res, next){
	var query = {author_id: res.locals.member._id};
	var projection = {name: 1, status: 1, time: 1, labels: 1, color: 1};

	app.db.collection("events").find(query, {projection: projection}).toArray(function(err, events){
		if(err) throw err;
		res.send({success: true, auth: true, result: events});
	});		
});

router.get("/:memberId/registration", checkAuth(function(req, res, auth){
	getMember(req.params.memberId, {password: 1, club_id: 1, access: 1}, function(member){
		var user = res.locals.user;
		res.locals.member = member;
		if(member == null){
			auth(false);
			return;
		}

		auth(user.club_id.equals(member.club_id) && user.access.club >= member.access.club.level);
	});	
}), function(req, res, next){
	if(res.locals.member.password != null){
		res.send({success: false, auth: true, error: {registration: "Member already has an account"}});
		return;
	}

	crypto.randomBytes(16, function(err, buffer) {
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
});

module.exports = function(newApp){
	app = newApp;
	utils = require('mrf-utils')(app);
	return {
		router: router,
		getMember: getMember,
		getMembers: getMembers
	};
}