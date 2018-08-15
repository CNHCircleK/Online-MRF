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

//TODO Later On
function validateFieldsCustom(club_id, data, fieldsData, callback){
	var validateFieldValues = [];

	for(var i in fieldsData){
		var field = fieldsData[i];
		if(field.name in data){
			if(field.type >= 100){
				field.type -= 100;
				if(Array.isArray(data[field.name])){
					for(var n in data[field.name]){
						if(validateFieldValues[field.type] == null){
							validateFieldValues[field.type] = new Set();
						}

						validateFieldValues[field.type].add(data[field.name][n]);						
					}
				}else{
					data[field.name] = [];
				}
			}else{
				if(validateFieldValues[field.type] == null){
					validateFieldValues[field.type] = new Set();
				}

				validateFieldValues[field.type].add(data[field.name]);
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
				var time = moment(body[elem], utils.isoFormat);
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
				author_id: res.locals.user._id,
				chair_id: res.locals.user.access.club > 0 && "chairId" in body ? null : res.locals.user._id,
				time:{
					start: body.start,
					end: body.end
				},
				tags: Array.isArray(body.tags) ? body.tags : [],
				attendees: Array.isArray(body.attendees) ? body.attendees : [],
				hoursPerAttendee: {
					service: !isNaN(body.service) ? parseFloat(body.service) : 0,
					leadership: !isNaN(body.leadership) ? parseFloat(body.leadership) : 0,
					fellowship: !isNaN(body.fellowship) ? parseFloat(body.fellowship) : 0
				},
				overrideHours: Array.isArray(body.overrideHours) ? body.overrideHours : [] ,
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
							res.send({success: true, auth: true, warning: warnings, result: data._id});
						}else{
							res.send({success: true, auth: true, result: data._id});
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

function checkEventAuth(projection, eventAuth, callback = null){
	if(callback == null){
		callback = eventAuth;
		eventAuth = projection;
		projection = {};
	}

	return auth.checkAuth(
		function(req, res, auth){
			var user = res.locals.user;
			if(!ObjectId.isValid(req.params.eventId)){
				auth(false);
			}else{
				app.db.collection("events").findOne({"_id": ObjectId(req.params.eventId)}, {projection: projection}, function(err, event){
					if(err) throw err;
					if(event != null){
						res.locals.event = event;
						eventAuth(req, res, auth);
					}else{
						auth(false);
					}
				});				
			}
		}, callback
	);
}

router.get('/:eventId', checkEventAuth(
	function(req, res, auth){
		var user = res.locals.user;
		var event = res.locals.event;

		if(event.club_id.equals(user.club_id)){
			auth(event.author_id.equals(user._id) || user.access.club > 0);
		}else if(event.division_id.equals(user.division_id)){
			auth(event.status == 2 && user.access.division > 0)
		}else{
			auth(event.status == 2 && user.access.district > 0)
		}
	},

	function(req, res, next){
		res.send(res.locals.event);
	}
));

router.patch('/:eventId', checkEventAuth({author_id: 1, club_id: 1, status: 1, time: 1},
	function(req, res, auth){
		var user = res.locals.user;
		var event = res.locals.event;

		if(event.club_id.equals(user.club_id)){
			if(user.access.club > 0){
				auth(event.status != 2);
			}else{
				auth(event.status == 0 && event.author_id.equals(user._id));
			}
		}else{
			auth(false);
		}
	}, 

	function(req, res, next){
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
					var start = moment(body.start, utils.isoFormat);
					if(start.isValid()){
						body.start = start.toDate();
					}else{
						errors.start = "Invalid format";
					}

					var end = moment(body.end, utils.isoFormat);
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
				data.tags = Array.isArray(body.tags) ? body.tags : [];
			if("attendees" in body) 
				data.attendees = Array.isArray(body.attendees) ? body.attendees : [];
			if("service" in body)
				data["hoursPerAttendee.service"] = !isNaN(body.service) ? parseFloat(body.service) : 0;
			if("leadership" in body)
				data["hoursPerAttendee.leadership"] = !isNaN(body.leadership) ? parseFloat(body.leadership) : 0;
			if("fellowship" in body)	
				data["hoursPerAttendee.fellowship"] = !isNaN(body.fellowship) ? parseFloat(body.fellowship) : 0;			
			if("overrideHours" in body) 
				data.overrideHours = Array.isArray(body.overrideHours) ? body.overrideHours : [];
			if("ptp" in body)
				data["fundraised.ptp"] = !isNaN(body.ptp) ? parseFloat(body.ptp) : 0;
			if("fa" in body)
				data["fundraised.fa"] = !isNaN(body.fa) ? parseFloat(body.fa) : 0;			
			if("kfh" in body)
				data["fundraised.kfh"] = !isNaN(body.kfh) ? parseFloat(body.kfh) : 0;

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

router.delete('/:eventId', checkEventAuth({club_id: 1, author_id: 1, status: 1},
	function(req, res, auth){
		var user = res.locals.user;
		var event = res.locals.event;

		if(event.club_id.equals(user.club_id)){
			if(user.access.club > 0){
				auth(event.status != 2);
			}else{
				auth(event.status == 0 && event.author_id.equals(user._id));
			}
		}else{
			auth(false);
		}
	}, 

	function(req, res, next){
		var query = {_id: res.locals.event._id};
		app.db.collection("events").deleteOne(query, function(err, obj){
			if(err) throw err;
			res.send({success: true, auth: true});
		});
	}
));

router.patch('/:eventId/submit', checkEventAuth({club_id: 1, author_id: 1, status: 1},
	function(req, res, auth){
		var user = res.locals.user;
		var event = res.locals.event;
		if(event.club_id.equals(user.club_id)){
			if(user.access.club > 0){
				auth(event.status != 2);
			}else{
				auth(event.status == 0 && event.author_id.equals(user._id));
			}
		}else{
			auth(false);
		}

	}, 

	function(req, res, next){
		var body = req.body;
		if(Object.keys(body).length > 0){
			if("submit" in body){
				body.submit = 
					body.submit === 'true' ? true
					: body.submit === 'false' ? false
					: body.submit;

				if(body.submit === true || body.submit === false){
					var query = {_id: res.locals.event._id};
					var update = {$set: {status: body.submit ? 1 : 0}};
					app.db.collection("events").updateOne(query, update, function(err, updateRes){
						if(err) throw err;
						res.send({success: true, auth: true});
					});
				}else{
					res.send({success: false, auth: true, error: {submit: "Must be a boolean value"}});
				}
			}else{
				res.send({success: false, auth: true, error: {submit: "Required"}});
			}
		}else{
			res.send({success: false, auth: true, error: {submit: "Required"}});
		}
	}
));

router.patch('/:eventId/confirm', checkEventAuth({club_id: 1, status: 1, hoursPerAttendee: 1, attendees: 1, overrideHours: 1, "time.start": 1},
	function(req, res, auth){
		var user = res.locals.user;
		var event = res.locals.event;

		var editableDate = false;

		var now = moment();
		var eventTime = moment(event.time.start);

		if(eventTime.diff(now) >= 0){
			editableDate = true;
		}else{
			if(now.year() === eventTime.year()){
				editableDate = now.month() - eventTime.month() < 2;
			}else if(auth.year() === eventTime.year() + 1){
				editableDate = now.month() === 0 && eventTime.month() === 11;
			}
		}
		auth(editableDate && event.club_id.equals(user.club_id) && user.access.club > 0 && event.status > 0);

	}, 

	function(req, res, next){
		var body = req.body;
		if(Object.keys(body).length > 0){
			if("confirm" in body){
				body.confirm = 
					body.confirm === 'true' ? true
					: body.confirm === 'false' ? false
					: body.confirm;
					
				if(body.confirm === true || body.confirm === false){
					var event = res.locals.event;
					var query = {_id: event._id};
					var update = {$set: {status: body.confirm ? 2 : 1}};
					if(!body.confirm){
						update.$unset = {totals: 1};
					}else{
						var totals = {
							service: event.hoursPerAttendee.service * (event.attendees.length - event.overrideHours.length),
							leadership: event.hoursPerAttendee.leadership * (event.attendees.length - event.overrideHours.length),
							fellowship: event.hoursPerAttendee.fellowship * (event.attendees.length - event.overrideHours.length)
						}

						for(var i in event.overrideHours){
							totals.service += event.overrideHours[i].service;
							totals.leadership += event.overrideHours[i].leadership;
							totals.fellowship += event.overrideHours[i].fellowship;
						}

						totals.members = event.attendees.length;
						update.$set.totals = totals;
					}

					app.db.collection("events").updateOne(query, update, function(err, updateRes){
						if(err) throw err;
						res.send({success: true, auth: true});
					});
				}else{
					res.send({success: false, auth: true, error: {confirm: "Must be a boolean value"}});
				}
			}else{
				res.send({success: false, auth: true, error: {confirm: "Required"}});
			}
		}else{
			res.send({success: false, auth: true, error: {confirm: "Required"}});
		}
	}
));

module.exports = router;