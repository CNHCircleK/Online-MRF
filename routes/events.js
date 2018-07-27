var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var auth = require("./auth");
var utils;

var moment = require('moment');

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();
});

router.post('/new', auth.checkAuth(
	function(req, res, auth){
		auth(true);
	},

	function(req, res, next){
		var body = req.body;
		var errors = {};
		utils.checkIn(body, ["name", "start", "end"], function(elem, res){
			if(!res){
				errors[elem] = "Required";
			}else if(elem == "start" || elem == "end"){
				var time = moment(body[elem], "YYYY-MM-DDTHH:mm:ssZ");
				if(time.isValid()){
					body[elem] = time.toDate();
				}else{
					errors[elem] = "Invalid";
				}
			}
		});
		if(Object.keys(errors).length == 0){
			var data = mongoSanitize.sanitize({
				club_id: res.locals.user.club_id,
				division_id: res.locals.user.division_id,
				status: 0,
				name: body.name,
				chair_id: res.locals.user.access.club > 0 && body.chairId != null ? null : res.locals.user._id,
				time:{
					start: body.start,
					end: body.start
				},
				tags: body["tags[]"] != null && Array.isArray(body["tags[]"]) ? body["tags[]"] : [],
				attendees: Array.isArray(body.attendees) ? body.attendees : [],
				hoursPerAttendee: {
					service: !isNaN(body.service) ? parseInt(body.service) : 0,
					leadership: !isNaN(body.leadership) ? parseInt(body.leadership) : 0,
					fellowship: !isNaN(body.fellowship) ? parseInt(body.fellowship) : 0
				},
				overrideHours: Array.isArray(body.override) ? body.override : [],
				fundraised: {
					ptp: !isNaN(body.ptp) ? parseFloat(body.ptp) : 0.0,
					fa: !isNaN(body.fa) ? parseFloat(body.fa) : 0.0,
					kfh: !isNaN(body.kfh) ? parseFloat(body.kfh) : 0.0
				}
			});

			var checks = {chairId: false, tags: false}

			insert = function(){
				if(checks.chairId && checks.tags){
					if(Object.keys(errors).length == 0){
						app.db.collection("events").insertOne(data, function(err, insertRes){
							if(err) throw err;
							res.send({success: true, auth: true});
						});							
					}else{
						res.send({success: false, auth: true, error: errors});
					}

				}
			}

			if(data.chair_id == null){
				if(!ObjectId.isValid(body.chairId)){
					errors.chairId = "Unable to find user";
					checks.chairId = true;
					insert();
				}else{
					var query = {_id: ObjectId(body.chairId), club_id: res.locals.user.club_id};
					var projection = {_id: 1};
					app.db.collection("members").findOne(query, {projection: projection}, function(err, member){
						if(err) throw err;
						if(member != null){
							data.chair_id = member._id;
						}else{
							errors.chairId = "Unable to find user in the club";
						}

						checks.chairId = true;
						insert();
					});					
				}

			}else{
				checks.chairId = true;
				insert();
			}

			if(data.tags.length > 0){
				var query = {$or: []};
				data.tags.forEach(function(elem){
					if(ObjectId.isValid(elem)){
						query.$or.push({_id: ObjectId(elem)});
					}
				});

				var projection = {_id: 1};
				app.db.collection("tags").find(query, {projection: projection}).toArray(function(err, tags){
					if(err) throw err;
					data.tags = [];
					tags.forEach(function(elem){
						data.tags.push(elem._id);
					});

					checks.tags = true;
					insert();
				});
			}else{
				checks.tags = true;
				insert();
			}

		}else{
			res.send({success: false, auth: true, error: errors});
		}
	}
));

var checkEventAccess = auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		if(!ObjectId.isValid(req.params.eventId)){
			auth(false);
		}else{
			app.db.collection("events").findOne({"_id": ObjectId()}, function(err, event){
				if(err) throw err;
				if(event != null
				 && (event.chair._id == user._id 
				 	|| event.club_id == user.club_id 
				 	|| event.division_id == user.division_id 
				 	|| user.access.district == 1)){

					res.locals.event = event;
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

router.all('/:eventId', checkEventAccess);
router.all('/:eventId/*', checkEventAccess);

router.get('/:eventId', function(req, res, next){
	res.send(res.locals.event);
});

router.post('/:eventId', auth.checkAuth(
	function(req, res, user){
		return res.locals.event.status == 2 ? 
			event.club_id == user.club_id && user.access.club == 1
			: event.chair._id == user._id  || (event.club_id == user.club_id && user.access.club > 0);

	}, function(req, res, next){
		// Edit Event here;
	}
));

module.exports = router;