var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var auth = require("../auth");
var utils;

var moment = require('moment');

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();
});

/* 
Types
0: Text
1: Number
2: Date
3: Email
4: Phone Number
5: User
6: Club
7: Division
8: Event
+100: List
+1000: Required
*/
function validateFields2(club_id, data, fieldsData, callback){
	var fieldValues = [];
	for(var i in fieldsData){
		var field = fieldsData[i];
		if(field.name in data){
			if(field.type >= 100){
				field.type -= 100;
				if(Array.isArray(data[field.name])){
					for(var n in data[field.name]){
						if(fieldValues[field.type] == null){
							fieldValues[field.type] = new Set();
						}

						fieldValues[field.type].add(data[field.name][n]);						
					}
				}else{
					data[field.name] = new Set();
				}
			}else{
				if(fieldValues[field.type] == null){
					fieldValues[field.type] = new Set();
				}

				fieldValues[field.type].add(data[field.name]);
			}
		}
	}
}

function validateFields(club_id, data, callback){
	var checks = {members: false, tags: false};

	var errors = {};
	var warnings = {};

	var tryCallback = function(){
		if(checks.members && checks.tags){
			callback(errors, warnings); 
		}
	}

	var query = {club_id: club_id, $or:[]};
	var projection = {_id: 1};

	var checkChair = false;
	if("chair_id" in data){
		if(!(data.chair_id instanceof ObjectId)){
			if(!ObjectId.isValid(body.chairId)){
				errors.chairId = "Unable to find user";
			}else{
				query.$or.push({_id: ObjectId(body.chairId)});
				checkChair = true;
			}	
		}
	}

	var verifiedAttendees = [];
	var unverifiedAttendees = [];
	var attendeeIndices = {};
	if("attendees" in data){
		if(Array.isArray(data.attendees)){
			for(var i in data.attendees){
				var attendee = data.attendees[i];
				if(ObjectId.isValid(attendee)){
					if(!(attendee in attendeeIndices)){
						attendeeIndices[attendee] = i;
						query.$or.push({_id: ObjectId(attendee)});
					}
				}else{
					unverifiedAttendees.push(attendee);
				}
			}
		}else{
			data.attendees = [];
		}
	}

	var verifiedOverrideHours = [];
	var unverifiedOverrideHours = [];
	var overrideAttendeeIndices = {};
	if("overrideHours" in data){
		if(Array.isArray(data.overrideHours)){
			for(var i in data.overrideHours){
				var override = data.overrideHours[i];
				if(override.constructor == Object){
					if("attendee" in override 
						&& "service" in override && !isNaN(override.service)
						&& "leadership" in override && !isNaN(override.leadership)
						&& "fellowship" in override && !isNaN(override.fellowship)){
						if(ObjectId.isValid(override.attendee)){
							if(!(String(override.attendee) in overrideAttendeeIndices)){
								override.attendee = ObjectId(override.attendee);
								overrideAttendeeIndices[String(override.attendee)] = i;
								query.$or.push({_id: ObjectId(override.attendee)});
							}
						}else{
							unverifiedOverrideHours.push(override);
						}
					}
				}
			}			
		}else{
			data.overrideHours = [];
		}		
	}

	if(query.$or.length > 0){
		app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
			if(err) throw err;
			for(var i in members){
				var member = members[i];
				if(String(member._id) in attendeeIndices){
					verifiedAttendees.push(member._id);
				}

				if(String(member._id) in overrideAttendeeIndices){
					verifiedOverrideHours.push(data.overrideHours[overrideAttendeeIndices[String(member._id)]]);
				}

				if(checkChair){
					if(String(member._id) == data.chair_id){
						data.chair_id = member._id;
					}else{
						data.chair_id = null;
					}
				}
			}

			if(checkChair && data.chair_id === null){
				errors.chairId = "Unable to find user";
			}

			if("attendees" in data){
				if(verifiedAttendees.length + unverifiedAttendees.length != data.attendees.length){
					if(!("attendees" in warnings)){
						warnings.attendees = "Some attendees are unable to be added";
					}
				}
				data.attendees = verifiedAttendees;
				if(unverifiedAttendees.length > 0){
					data.unverifiedAttendees = unverifiedAttendees;
				}
			}
			
			if("overrideHours" in data){
				if(verifiedOverrideHours.length + unverifiedOverrideHours.length != data.overrideHours.length){
					if(!("overrideHours" in warnings)){
						warnings.overrideHours = "Some override hours were unable to be set";
					}
				}

				data.overrideHours = verifiedOverrideHours;
				if(unverifiedOverrideHours.length > 0){
					data.unverifiedOverrideHours = unverifiedOverrideHours;
				}
			}
			
			checks.members = true;
			tryCallback();
		});	
	}else{
		if("attendees" in data){
			data.attendees = verifiedAttendees;
			if(unverifiedAttendees.length > 0){
				data.unverifiedAttendees = unverifiedAttendees;
			}
		}
		
		if("overrideHours" in data){
			data.overrideHours = verifiedOverrideHours;
			if(unverifiedOverrideHours.length > 0){
				data.unverifiedOverrideHours = unverifiedOverrideHours;
			}			
		}

		checks.members = true;
		tryCallback();
	}

	if("tags" in data){
		if(Array.isArray(data.tags)){
			if(data.tags.length > 0){
				var tagQuery = {$or: []};
				data.tags.forEach(function(elem){
					if(ObjectId.isValid(elem)){
						tagQuery.$or.push({_id: ObjectId(elem)});
					}
				});

				var projection = {_id: 1};
				app.db.collection("tags").find(tagQuery, {projection: projection}).toArray(function(err, tags){
					if(err) throw err;
					data.tags = [];
					tags.forEach(function(elem){
						data.tags.push(elem._id);
					});

					checks.tags = true;
					tryCallback();
				});
			}else{
				checks.tags = true;
				tryCallback();
			}			
		}
	}else{
		checks.tags = true;
		tryCallback();		
	}
}

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
				chair_id: res.locals.user.access.club > 0 && "chairId" in body ? null : res.locals.user._id,
				time:{
					start: body.start,
					end: body.end
				},
				tags: utils.parseArray(body.tags) || [],
				attendees: utils.parseArray(body.attendees) || [],
				hoursPerAttendee: {
					service: !isNaN(body.service) ? parseInt(body.service) : 0,
					leadership: !isNaN(body.leadership) ? parseInt(body.leadership) : 0,
					fellowship: !isNaN(body.fellowship) ? parseInt(body.fellowship) : 0
				},
				overrideHours: utils.parseArray(body.overrideHours) || [] ,
				fundraised: {
					ptp: !isNaN(body.ptp) ? parseFloat(body.ptp) : 0.0,
					fa: !isNaN(body.fa) ? parseFloat(body.fa) : 0.0,
					kfh: !isNaN(body.kfh) ? parseFloat(body.kfh) : 0.0
				}
			});

			data = mongoSanitize.sanitize(data);
			validateFields(res.locals.user.club_id, data, function(errors, warnings){
				if(Object.keys(errors).length == 0){				
					app.db.collection("events").insertOne(data, function(err, insertRes){
						if(err) throw err;
						if(Object.keys(warnings).length > 0){
							res.send({success: true, auth: true, warning: warnings});
						}else{
							res.send({success: true, auth: true});
						}
						
					});							
				}else{
					res.send({success: false, auth: true, error: errors, warning: warnings});
				}
			});

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
			app.db.collection("events").findOne({"_id": ObjectId(req.params.eventId)}, function(err, event){
				if(err) throw err;
				if(event != null
				 && (event.chair_id.equals(user._id) 
				 	|| event.club_id.equals(user.club_id) 
				 	|| event.division_id.equals(user.division_id) 
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

router.post('/:eventId/edit', auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		var event = res.locals.event;
		auth(event.status == 2 ? 
			(event.club_id.equals(user.club_id) && user.access.club == 1)
			: (event.chair_id.equals(user._id)  || (event.club_id.equals(user.club_id) && user.access.club > 0)));

	}, function(req, res, next){
		var body = req.body;
		if(Object.keys(body).length > 0){
			var errors = {};
			var data = {};
			if("name" in body) 
				data.name = body.name;
			if("chair_id" in body) 
				data.chair_id = body.chair_id;

			if("start" in body || "end" in body){
				if("start" in body && !("end" in body)){
					errors.end = "Required to be sent with start time";
				}else if("end" in body && !("start" in body)){
					errors.start = "Required to be sent with end time";
				}else{
					var start = moment(body.start, "YYYY-MM-DDTHH:mm:ssZ");
					if(start.isValid()){
						body.start = start.toDate();
					}else{
						errors.start = "Invalid format";
					}

					var end = moment(body.end, "YYYY-MM-DDTHH:mm:ssZ");
					if(end.isValid()){
						body.end = end.toDate();
					}else{
						errors.end = "Invalid format";
					}

					if(errors.start == null && errors.end == null && body.start < body.end){
						data.time = {start: body.start, end: body.end};
					}else{
						errors.end = "Must be after start";
					}			
				}
			}

			if("tags" in body) 
				data.tags = utils.parseArray(body.tags) || [];
			if("attendees" in body) 
				data.attendees = utils.parseArray(body.attendees) || [];
			if("service" in body)
				data["hoursPerAttendee.service"] = !isNaN(body.service) ? parseInt(body.service) : 0;
			if("leadership" in body)
				data["hoursPerAttendee.leadership"] = !isNaN(body.leadership) ? parseInt(body.leadership) : 0;
			if("fellowship" in body)	
				data["hoursPerAttendee.fellowship"] = !isNaN(body.fellowship) ? parseInt(body.fellowship) : 0;			
			if("overrideHours" in body) 
				data.overrideHours = utils.parseArray(body.overrideHours) || [];
			if("ptp" in body)
				data["fundraised.ptp"] = !isNaN(body.ptp) ? parseInt(body.ptp) : 0;
			if("fa" in body)
				data["fundraised.fa"] = !isNaN(body.fa) ? parseInt(body.fa) : 0;			
			if("kfh" in body)
				data["fundraised.kfh"] = !isNaN(body.kfh) ? parseInt(body.kfh) : 0;

			if(Object.keys(errors).length == 0){
				validateFields(res.locals.user.club_id, data, function(errors, warnings){
					if(Object.keys(errors).length == 0){	
						var eventQuery = {_id: res.locals.event._id};
						app.db.collection("events").updateOne(eventQuery, {$set: data}, function(err, updateRes){
							if(err) throw err;
							if(Object.keys(warnings).length > 0){
								res.send({success: true, auth: true, warning: warnings});
							}else{
								res.send({success: true, auth: true});
							}
							
						});							
					}else{
						res.send({success: false, auth: true, error: errors, warning: warnings});
					}
				});
			}else{
				res.send({success: false, auth: true, error: errors});
			}
		}else{
			res.send({success: true, auth: true});
		}
	}
));

module.exports = router;