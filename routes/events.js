var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var checkAuth = require("../auth").checkAuth;
var moment = require('moment');

var utils;

function getEvent(eventId, projection, callback){
	if(!ObjectId.isValid(eventId)){
		callback(null);
		return;
	}

	var query = {"_id": ObjectId(eventId)};
	app.db.collection("events").findOne(query, {projection: projection}, function(err, event){
		if(err) throw err;
		callback(event); 
	});
}


function validateFields(club_id, data, callback){
	if(data == null || !utils.isJSON(data)){
		callback({},{});
		return;
	}

	var checkUsers = false;
	var checkTags = false;

	var tryCallback = function(){
		if(checkUsers && checkTags){
			callback(validData, errors);
		}
	}

	var validData = {};
	var errors = {};

	var validateUsers = {};
	var validateTags = {};

	if("name" in data){
		validData.name = String(mongoSanitize.sanitize(data.name));
	}

	if("status" in data){
		if(utils.isInt(data.status) && (data.status == 0 || data.status == 1)){
			validData.status = parseInt(data.status);
		}else{
			errors.status = "Must be either 0 or 1";
		}
	}

	var checkChair = false;
	if("chair_id" in data){
		if(ObjectId.isValid(data.chair_id)){
			var chairId = data.chair_id;
			checkChair = true;
			validateUsers[data.chair_id] = {_id: ObjectId(data.chair_id)};
		}else{
			errors.chair_id = "Invalid _id";
		}
	}

	if("time" in data){
		if(utils.isJSON(data.time)){
			if("start" in data.time && "end" in data.time){
				var start = moment(data.time.start, utils.isoFormat);
				var end = moment(data.time.end, utils.isoFormat);

				if(!start.isValid() || !end.isValid){
					errors.time = "Start and end must be in ISO Format";
				}else if(start.diff(end) > 0){
					errors.time = "Start must be before end";
				}else{
					validData.time = {
						start: start.toDate(),
						end: end.toDate()
					}
				}
			}else{
				errors.time = "Must be have keys 'start' and 'end'";
			}
		}else{
			errors.time = "Must be dict";
		}
	}

	if("location" in data){
		validData.location = String(mongoSanitize.sanitize(data.location));
	}

	if("contact" in data){
		validData.contact = String(mongoSanitize.sanitize(data.contact));
	}

	var potentialTags = [];
	if("tags" in data){
		if(Array.isArray(data.tags)){
			for(var i = 0; i < data.tags.length; i++){
				if(ObjectId.isValid(data.tags[i])){
					potentialTags.push({_id: ObjectId(data.tags[i])});
				}else{
					errors.tags = "Some tags are invalid";
				}
			}
		}else{
			errors.tags = "Must be array";
		}
	}

	var potentialAttendees = {};
	var numPotentialAttendees = 0;

	if("attendees" in data){
		if(Array.isArray(data.attendees)){
			validData.attendees = [];
			validData.unverifiedAttendees = [];
			
			for(var i = 0; i < data.attendees.length; i++){
				if(ObjectId.isValid(data.attendees[i])){
					potentialAttendees[data.attendees[i]] = true;
					numPotentialAttendees ++;
					validateUsers[data.attendees[i]] = {_id: ObjectId(data.attendees[i])};
				}else{
					validData.unverifiedAttendees.push(String(mongoSanitize.sanitize(data.attendees[i])));
				}
			}
		}else{
			errors.attendees = "Must be array";
		}
	}

	if("hoursPerAttendee" in data){
		if(utils.isJSON(data.hoursPerAttendee) && "service" in data.hoursPerAttendee && "leadership" in data.hoursPerAttendee && "fellowship" in data.hoursPerAttendee){
			if(utils.isFloat(data.hoursPerAttendee.service)){
				if(!("hoursPerAttendee" in validData)){
					validData.hoursPerAttendee = {};
				}

				validData.hoursPerAttendee.service = parseFloat(data.hoursPerAttendee.service);
			}else{
				errors.hoursPerAttendee = "Hours must be floats";
			}
		

			if(utils.isFloat(data.hoursPerAttendee.leadership)){
				if(!("hoursPerAttendee" in validData)){
					validData.hoursPerAttendee = {};
				}

				validData.hoursPerAttendee.leadership = parseFloat(data.hoursPerAttendee.leadership);
			}else{
				errors.hoursPerAttendee = "Hours must be floats";
			}
		

			if(utils.isFloat(data.hoursPerAttendee.fellowship)){
				if(!("hoursPerAttendee" in validData)){
					validData.hoursPerAttendee = {};
				}

				validData.hoursPerAttendee.fellowship = parseFloat(data.hoursPerAttendee.fellowship);
			}else{
				errors.hoursPerAttendee = "Hours must be floats";
			}
			
		}else{
			errors.hoursPerAttendee = "Must be dict with keys (service, leadership, fellowship)";
		}
	}

	var potentialOverrides = {};
	var numPotentialOverrides = 0;
	if("overrideHours" in data){
		if(Array.isArray(data.overrideHours)){
			for(var i = 0; i < data.overrideHours.length; i++){
				var override = data.overrideHours[i];
				if(utils.isJSON(override)){
					if("attendee_id" in override && "service" in override && "leadership" in override && "fellowship" in override){
						if(ObjectId.isValid(override.attendee_id) && utils.isFloat(override.service) && utils.isFloat(override.leadership) && utils.isFloat(override.fellowship)){
							potentialOverrides[override.attendee_id] = {
								attendee_id: ObjectId(override.attendee_id),
								service: parseFloat(override.service),
								leadership: parseFloat(override.leadership),
								fellowship: parseFloat(override.fellowship)
							};

							numPotentialOverrides ++;
							validateUsers[override.attendee_id] = {_id: ObjectId(override.attendee_id)};
						}else{
							errors.overrideHours = "Some overrides are invalid";
						}
					}else{
						errors.overrideHours = "Some overrides are invalid";
					}
				}else{
					errors.overrideHours = "Some overrides are invalid";
				}
				
			}

		}else{
			errors.overrideHours = "Must be array";
		}
	}

	if("fundraised" in data){
		if(utils.isJSON(data.fundraised) && "amountRaised" in data.fundraised && "amountSpent" in data.fundraised && "usedFor" in data.fundraised){
			if(utils.isFloat(data.fundraised.amountRaised)){
				if(!("fundraised" in validData)){
					validData.fundraised = {};
				}

				validData.fundraised.amountRaised = parseFloat(parseFloat(data.fundraised.amountRaised).toFixed(2));
			}else{
				errors.fundraised = "Dollar amounts must be floats";
			}
		

			if(utils.isFloat(data.fundraised.amountSpent)){
				if(!("fundraised" in validData)){
					validData.fundraised = {};
				}

				validData.fundraised.amountSpent = parseFloat(parseFloat(data.fundraised.amountSpent).toFixed(2));
			}else{
				errors.fundraised = "Dollar amounts must be floats";
			}
		

			if(!("fundraised" in validData)){
				validData.fundraised = {};
			}

			validData.fundraised.usedFor = mongoSanitize.sanitize(data.fundraised.usedFor);			
			
		}else{
			errors.fundraised = "Must be dict with keys (amountRaised, amountSpent, usedFor)"
		}
	}

	if("categories" in data){
		if(Array.isArray(data.categories)){
			var validCategories = [];
			for(var i = 0; i < data.categories.length; i++){
				validCategories.push(mongoSanitize.sanitize(String(data.categories[i])));
			}

			validData.categories = validCategories;
		}else{
			errors.categories = "Must be array";
		}
	}

	if("comments" in data){
		if(utils.isJSON(data.comments) && "summary" in data.comments && "strengths" in data.comments && "weaknesses" in data.comments && "improvements" in data.comments){
			if(!("comments" in validData)){
				validData.comments = {};
			}

			validData.comments.summary = mongoSanitize.sanitize(data.comments.summary);
		

			if(!("comments" in validData)){
				validData.comments = {};
			}

			validData.comments.strengths = mongoSanitize.sanitize(data.comments.strengths);
		

			if(!("comments" in validData)){
				validData.comments = {};
			}

			validData.comments.weaknesses = mongoSanitize.sanitize(data.comments.weaknesses);
		

			if(!("comments" in validData)){
				validData.comments = {};
			}

			validData.comments.improvements = mongoSanitize.sanitize(data.comments.improvements);
					
		}else{
			errors.comments = "Must be dict with keys (summary, strengths, weaknesses, improvements)";
		}
	}

	if("drivers" in data){
		if(Array.isArray(data.drivers)){
			var validDrivers = [];
			for(var i = 0; i < data.drivers.length; i++){
				var driver = data.drivers[i];
				if(utils.isJSON(driver)){
					if("driver" in driver && "milesTo" in driver && "milesFrom" in driver){
						if(utils.isFloat(driver.milesTo) && utils.isFloat(driver.milesFrom)){
							validDrivers.push({
								driver: String(mongoSanitize.sanitize(driver.driver)), 
								milesTo: parseFloat(driver.milesTo),
								milesFrom: parseFloat(driver.milesFrom)
							});

						}else{
							errors.drivers = "Some driver data is invalid";
						}
					}else{
						errors.drivers = "Some driver data is invalid";
					}
				}else{
					errors.drivers = "Some driver data is invalid";
				}
				
			}

			validData.drivers = validDrivers;
		}else{
			errors.drivers = "Must be array";
		}
	}

	if("kfamAttendance" in data){
		if(Array.isArray(data.kfamAttendance)){
			var validKfam = [];
			for(var i = 0; i < data.kfamAttendance.length; i++){
				var kfam = data.kfamAttendance[i];
				if(utils.isJSON(kfam)){
					if("org" in kfam && "numAttendees" in kfam){
						if(utils.isInt(kfam.numAttendees) && parseInt(kfam.numAttendees) > 0){
							validKfam.push({
								org: mongoSanitize.sanitize(String(kfam.org)), 
								numAttendees: parseInt(kfam.numAttendees)
							});
						}else{
							errors.drivers = "Some driver data are invalid";
						}
					}else{
						errors.drivers = "Some driver data are invalid";
					}
				}else{
					errors.drivers = "Some driver data are invalid";
				}
			}

			validData.kfamAttendance = validKfam;
		}else{
			errors.kfamAttendance = "Must be array";
		}
	}

	var potentialUsers = Object.values(validateUsers);
	if(potentialUsers.length > 0){
		var query = {club_id: club_id, $or: potentialUsers};
		var projection = {_id: 1};
		app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
			if(err) throw err;
			for(var i = 0; i < members.length; i++){
				var member = members[i];
				var memberId = String(member._id);
				var member_id = ObjectId(member._id);

				if(checkChair && memberId == String(chairId)){
					validData.chair_id = member_id;
				}

				if(memberId in potentialAttendees){
					if(!("attendees" in validData)){
						validData.attendees = [];
					}

					validData.attendees.push(member_id);
				}

				if(memberId in potentialOverrides){
					if(!("overrideHours" in validData)){
						validData.overrideHours = [];
					}

					validData.overrideHours.push(potentialOverrides[memberId]);
				}			
			}

			if(checkChair && !("chair_id" in validData)){
				errors.chair_id = "Invalid _id";
			}

			if("attendees" in data){
				if(!("attendees" in validData)){
					errors.attendees = "Some attendees are invalid";
				}else if(validData.attendees.length < numPotentialAttendees){
					errors.attendees = "Some attendees are invalid";
				}
			}
			
			if("overrideHours" in data){
				if(!("overrideHours" in validData)){
					errors.overrideHours = "Some overrides are invalid";
				}else if(validData.overrideHours.length < numPotentialOverrides){
					errors.overrideHours = "Some overrides are invalid";
				}
			}
			
			checkUsers = true;
			tryCallback();
		});				
	}else{
		checkUsers = true;
		tryCallback();
	}


	if(potentialTags.length > 0){
		var projection = {_id: 1};
		var tagQuery = {$or: potentialTags};
		app.db.collection("tags").find(tagQuery, {projection: projection}).toArray(function(err, tags){
			if(err) throw err;
			tags.forEach(function(elem){
				if(!("tags" in validData)){
					validData.tags = [];
				}

				validData.tags.push(elem._id);
			});

			checkTags = true;
			tryCallback();
		});			
	}else{
		checkTags = true;
		tryCallback();
	}
}

router.post("/", checkAuth(function(req, res, auth){
	auth(true);
}), function(req, res, next){
	var body = req.body;
	var errors = {};
	validateFields(res.locals.user.club_id, body, function(data, errors){
		var newData = {
			club_id: res.locals.user.club_id,
			status: "status" in data ? data.status : 0,
			name: "name" in data ? data.name : "",
			author_id: res.locals.user._id,
			chair_id: "chair_id" in data ? data.chair_id : "", 
			time: "time" in data ? data.time : {
				start: new Date(), 
				end: new Date()
			},
			location: "location" in data ? data.location : "",
			contact: "contact" in data ? data.contact : "",
			tags: "tags" in data ? data.tags : [],
			attendees: "attendees" in data ? data.attendees : [],
			unverifiedAttendees: "unverifiedAttendees" in data ? data.unverifiedAttendees : [],
			hoursPerAttendee: "hoursPerAttendee" in data ? data.hoursPerAttendee : {
				service: 0.0,
				leadership: 0.0,
				fellowship: 0.0
			},
			overrideHours: "overrideHours" in data ? data.overrideHours : [],
			fundraised: "fundraised" in data ? data.fundraised : {
				amountRaised: 0.0,
				amountSpent: 0.0,
				usedFor: ""
			},
			categories: "categories" in data ? data.categories : [],
			comments: "comments" in data ? data.comments : {
				summary: "",
				strengths: "",
				weaknesses: "",
				improvements: ""
			},
			drivers: "drivers" in data ? data.drivers: [],
			kfamAttendance: "kfamAttendance" in data ? data.kfamAttendance: []
		};

		app.db.collection("events").insertOne(newData, function(err, insertRes){
			if(err) throw err;
			res.send({success: true, auth: true, result: newData._id, warning: errors});
			
		});
	});	
});

router.get("/:eventId", checkAuth(function(req, res, auth){
	getEvent(req.params.eventId, {attendees: 1, unverifiedAttendees: 1, author_id: 1, categories: 1, chair_id: 1, club_id: 1, comments: 1, contact: 1, drivers: 1, fundraised: 1, hoursPerAttendee: 1, kfamAttendance: 1, location: 1, name: 1, overrideHours: 1, status: 1, tags: 1, time: 1}, function(event){
		if(event == null){
			auth(false);
			return;
		}

		var user = res.locals.user;
		res.locals.event = event;

		if(user.club_id.equals(event.club_id)){
			auth(user._id.equals(event.author_id) || user.access.club > 0);
		}else if(user.division_id.equals(event.division_id)){
			auth(event.status == 2 && user.access.division > 0)
		}else{
			auth(event.status == 2 && user.access.district > 0)
		}
	});
}), function(req, res, next){
	var event = res.locals.event;

	var members = new Set();
	if(event.chair_id !== ""){
		members.add(String(event.chair_id));
	}

	if(event.author_id !== ""){
		members.add(String(event.author_id));
	}

	var overrideHours = {};
	event.overrideHours.forEach(function(override){
		if("attendee_id" in override){
			members.add(String(override.attendee_id));
			overrideHours[override.attendee_id] = override;
		}
	});

	var attendees = new Set();
	event.attendees.forEach(function(attendee_id){
		attendees.add(String(attendee_id));
		members.add(String(attendee_id));
	});

	app.get("membersRoute").getMembers(null, members, {name: 1}, function(members){
		var verifiedOverrideHours = [];
		var verifiedAttendees = [];

		members.forEach(function(member){
			if(member._id.equals(event.chair_id)){
				event.chair = member;
			}

			if(member._id.equals(event.author_id)){
				event.author = member;
			}

			if(member._id in overrideHours){
				var verifiedOverrideHour = overrideHours[member._id];
				delete verifiedOverrideHour.attendee_id;
				verifiedOverrideHours.push({
					attendee: member,
					service: verifiedOverrideHour.service,
					leadership: verifiedOverrideHour.leadership,
					fellowship: verifiedOverrideHour.fellowship
				});
			}

			if(attendees.has(String(member._id))){
				verifiedAttendees.push(member);
			}
		});

		if(!("chair" in event)){
			event.chair = {
				_id: "",
				name: {
					first: "Invalid",
					last: "Member"
				}
			};
		}

		if(!("author" in event)){
			event.author = {
				_id: "",
				name: {
					first: "Invalid",
					last: "Member"
				}
			};
		}

		delete event.chair_id;
		delete event.author_id;
		event.overrideHours = verifiedOverrideHours;
		event.attendees = verifiedAttendees;

		if(!("club_id" in event)){
			res.send({success: true, auth: true, result: event});
		}
	});

	app.get("clubsRoute").getClub(event.club_id, {name: 1}, function(club){
		if(club == null){
			event.club = {
				name: "Invalid Club",
				_id: ""
			};
		}else{
			event.club = club;
		}

		delete event.club_id;

		if(!("author_id" in event)){
			res.send({success: true, auth: true, result: event});
		}
	});
});

router.patch("/:eventId", checkAuth(function(req, res, auth){
	getEvent(req.params.eventId, {club_id: 1, status: 1, author_id: 1}, function(event){
		var user = res.locals.user;
		res.locals.event = event;
		if(event == null){
			auth(false);
			return;
		}

		if(user.club_id.equals(event.club_id)){
			if(user.access.club > 0){
				auth(event.status < 2);
			}else{
				auth(event.status == 0 && user._id.equals(event.author_id));
			}
		}else{
			auth(false);
		}
	});
}), function(req, res, next){
	var body = req.body;
	if(Object.keys(body).length > 0){
		validateFields(res.locals.user.club_id, body, function(data, errors){
			if(Object.keys(data).length > 0){
				var eventQuery = {_id: res.locals.event._id};
				app.db.collection("events").updateOne(eventQuery, {$set: data}, function(err, updateRes){
					if(err) throw err;
					if(Object.keys(errors).length > 0){
						res.send({success: true, auth: true, warning: errors});
					}else{
						res.send({success: true, auth: true});
					}
				});
			}
		});

	}else{
		res.send({success: true, auth: true});
	}	
});

router.delete("/:eventId", checkAuth(function(req, res, auth){
	getEvent(req.params.eventId, {club_id: 1, status: 1, author_id: 1}, function(event){
		var user = res.locals.user;
		res.locals.event = event;
		if(event == null){
			auth(false);
			return;
		}

		if(user.club_id.equals(event.club_id)){
			if(user.access.club > 0){
				auth(event.status < 2);
			}else{
				auth(event.status == 0 && user._id.equals(event.author_id));
			}
		}else{
			auth(false);
		}

	});
}), function(req, res, next){
	var query = {_id: res.locals.event._id};
	app.db.collection("events").deleteOne(query, function(err, obj){
		if(err) throw err;
		res.send({success: true, auth: true});
	});	
});

router.patch("/:eventId/submit", checkAuth(function(req, res, auth){
	getEvent(req.params.eventId, {club_id: 1, status: 1, author_id: 1}, function(event){
		var user = res.locals.user;
		res.locals.event = event;
		if(event == null){
			auth(false);
			return;
		}

		if(user.club_id.equals(event.club_id) && event.status != 2){
			auth(user.access.club > 0 || user._id.equals(event.author_id));
		}else{
			auth(false);
		}
	});
}), function(req, res, next){
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
});

router.patch("/:eventId/confirm", checkAuth(function(req, res, auth){
	getEvent(req.params.eventId, {club_id: 1, status: 1, author_id: 1, time: 1, hoursPerAttendee: 1, overrideHours: 1, attendees: 1}, function(event){
		var user = res.locals.user;
		res.locals.event = event;
		if(event == null){
			auth(false);
			return;
		}

		var editableDate = false;

		var now = moment();
		var eventTime = moment(event.time.start);

		if(eventTime.diff(now) >= 0){
			editableDate = true;
		}else{
			if(now.year() === eventTime.year()){
				editableDate = now.month() - eventTime.month() < 2;
			}else if(now.year() === eventTime.year() + 1){
				editableDate = now.month() === 0 && eventTime.month() === 11;
			}
		}

		auth(event.club_id.equals(user.club_id) && user.access.club > 0 && event.status > 0);
	});

}), function(req, res, next){
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
});

module.exports = function(newApp){
	app = newApp;
	utils = require('mrf-utils')(app);
	return {
		router: router,
	};
}