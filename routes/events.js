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
			for(var i = 0; i < data.attendees.length; i++){
				if(ObjectId.isValid(data.attendees[i])){
					potentialAttendees[data.attendees[i]] = true;
					numPotentialAttendees ++;
					validateUsers[data.attendees[i]] = {_id: ObjectId(data.attendees[i])};
				}else{
					errors.attendees = "Some attendees are invalid";
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
								fellowshop: parseFloat(override.fellowship)
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

router.post('/new', auth.checkAuth(
	function(req, res, auth){
		auth(true);
	},

	function(req, res, next){
		var body = req.body;
		var errors = {};

		validateFields(res.locals.user.club_id, body, function(data, errors){
			var newData = {
				club_id: res.locals.user.club_id,
				division_id: res.locals.user.division_id,
				status: 0,
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
	}
));

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
			validateFields(res.locals.user.club_id, body, function(data, errors){
				if(Object.keys(data).length > 0){
					var eventQuery = {_id: res.locals.event._id};
					app.db.collection("events").updateOne(eventQuery, {$set: data}, function(err, updateRes){
						if(err) throw err;
						res.send({success: true, auth: true, warning: errors});
					});
				}
			});

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
		auth(event.club_id.equals(user.club_id) && event.status != 2 && (user.access.club > 0 || event.author_id.equals(user._id)));
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
			}else if(now.year() === eventTime.year() + 1){
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