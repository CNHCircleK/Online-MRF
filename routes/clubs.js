var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var auth = require("../auth");
var utils;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();	
});

var checkClubAccess = auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		if(!ObjectId.isValid(req.params.clubId)){
			auth(false);
		}else{
			var query = {"_id": ObjectId(req.params.clubId)};
			var projection = {name: 1, division_id: 1, admin: 1, goals: 1};

			query = mongoSanitize.sanitize(query);
			projection = mongoSanitize.sanitize(projection);

			app.db.collection("clubs").findOne(query, {projection: projection}, function(err, club){
				if(err) throw err;
				if(club != null
				 && ((club._id.equals(user.club_id) && user.access.club == 1)
				 	|| club.division_id.equals(user.division_id) 
				 	|| user.access.district == 1)){

					res.locals.club = club;
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

router.all("/:clubId", checkClubAccess);
router.all("/:clubId/*", checkClubAccess);

router.get("/:clubId/administration", function(req, res, next){
	var query = {club_id: res.locals.club._id, "access.club": {$gt: 0}};
	var projection = {name: 1, email: 1, access: 1};

	app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
		if(err) throw err;
		res.send({success: true, auth: true, result: members});
	});	
});

router.post("/:clubId/administration/add", auth.checkAuth(
	function(req, res, auth){
		auth(res.locals.user.access.club > 1);
	},

	function(req, res, next){
		var body = req.body;
		var errors = {};

		utils.checkIn(body, ["memberId", "access", "position"], function(elem, res){
			if(!res){
				errors[elem] = "Required";
			}else if(elem == "access" && (isNaN(body[elem]) || parseInt(Number(body[elem])) != body[elem] || isNaN(parseInt(body[elem], 10)) || body[elem] < 0 || body[elem] > 2)){
				errors[elem] = "Invalid Access Level";
			}
		});

		if(Object.keys(errors).length == 0){
			if(!ObjectId.isValid(body.memberId)){
				res.send({success: false, auth: true, error: {memberId: "Unable to find this member in the club"}});
			}else{
				var query = {_id: ObjectId(body.memberId), club_id: res.locals.club._id};
				var updates = {"access.club.level": body.access, "access.club.position": mongoSanitize.sanitize(body.position)};

				app.db.collection("members").updateOne(query, {$set: updates}, function(err, updateRes){
					if(err) throw err;
					if(updateRes.matchedCount > 0){
						res.send({success: true, auth: true});
					}else{
						res.send({success: false, auth: true, error: {memberId: "Unable to find this member in the club"}});
					}
					
				});
			}
		}else{
			res.send({success: false, auth: true, error: errors});
		}
	}
));

router.get("/:clubId/members", function(req, res, next){
	var query = {club_id: res.locals.club._id};
	var projection = {name: 1, access: 1};

	app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
		if(err) throw err;
		res.send({success: true, auth: true, result: members});
	});
});

router.post("/:clubId/members/new", auth.checkAuth(
	function(req, res, auth){
		auth(res.locals.user.access.club > 0);
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
				name: {
					first: body['firstName'], 
					last: body['lastName']
				},
				club_id: res.locals.club._id,
				division_id: res.locals.club.division_id,
				access:{
					club: {
						level: 0
					},
					division: {
						level: 0
					},
					division: {
						level: 0
					}
				}
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

router.get("/:clubId/totals", function(req, res, next){
	//TODO
});

router.get("/:clubId/trends", function(req, res, next){
	//TODO
});

router.get("/:clubId/goals", function(req, res, next){
	//TODO
});

router.get("/:clubId/mrfs/:year/:month", function(req, res, next){
	if(isNaN(req.params.year) || isNaN(req.params.month)){
		res.send({success: false, auth: true});
	}else{
		req.params.year = parseInt(req.params.year);
		req.params.month = parseInt(req.params.month);

		if(req.params.month < 1 || req.params.month > 12 || req.params.year > (new Date()).getFullYear()){
			res.send({success: false, auth: true});
		}else{
			var query = {club_id: res.locals.club._id, year: req.params.year, month: req.params.month};
			query = mongoSanitize.sanitize(query);

			app.db.collection("mrfs").findOne(query, function(err, mrf){
				if(err) throw err;
				if(mrf != null){
					res.send({success: true, auth: true, result: mrf});
				}else{
					res.send({success: false, auth: true});
				}
			});				
		}
	}
});

router.get("/:clubId/mrfs/:year/:month/events", function(req, res, next){
	if(isNaN(req.params.year) || isNaN(req.params.month)){
		res.send({success: false, auth: true});
	}else{
		req.params.year = parseInt(req.params.year);
		req.params.month = parseInt(req.params.month);

		if(req.params.month < 1 || req.params.month > 12 || req.params.year > (new Date()).getFullYear()){
			res.send({success: false, auth: true});
		}else{
			var query = {
				club_id: res.locals.club._id, 
				"time.start": {
					$gte: new Date(req.params.year, req.params.month - 1, 1), 
					$lte: new Date(req.params.year, req.params.month, 1)
				}
			};

			var projection = {name: 1, status: 1};
			app.db.collection("events").find(query, {projection: projection}).toArray(function(err, events){
				if(err) throw err;
				res.send({success: true, auth: true, result: events});
			});
		}
	}
});


module.exports = router;