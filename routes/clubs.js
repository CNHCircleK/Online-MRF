var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var checkAuth = require("../auth").checkAuth;
var utils;

var moment = require('moment');

function getClub(clubId, projection, callback){
	if(!ObjectId.isValid(clubId)){
		callback(null);
		return;
	}

	var query = {"_id": ObjectId(clubId)};
	app.db.collection("clubs").findOne(query, {projection: projection}, function(err, club){
		if(err) throw err;
		callback(club);
	});
}

function getClubMembers(clubId, projection, callback){
	if(!ObjectId.isValid(clubId)){
		callback([]);
		return;
	}

	var query = {"club_id": ObjectId(clubId)};
	app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
		if(err) throw err;
		callback(members);
	});
}

router.delete("/:clubId", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		res.locals.club = club;
		var user = res.locals.user;

		if((user.division_id.equals(club.division_id) && user.access.division > 0) || user.access.district > 0){
			getClubMembers(req.params.clubId, {_id: 1}, function(members){
				if(members.length == 0){
					auth(true);
				}else{
					auth(false);
				}
			});
		}
	});
}), function(req, res, next){
	app.db.collection("clubs").remove({_id: ObjectId(req.params.clubId)}, function(err){
		if(err) throw err;
		res.send({success: true, auth: true});
	});
});

router.get("/:clubId/administration", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		res.locals.club = club;
		var user = res.locals.user;

		if(club._id.equals(user.club_id)){
			auth(true);
		}else if(club.division_id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}
	});
}), function(req, res, next){
	var club = res.locals.club;
	var user = res.locals.user;

	var query = {club_id: club._id, "access.club.level" : {$gt: 0}};
	var projection = {name: 1, "access.club": 1, email: 1};

	app.db.collection("members").find(query, {projection: projection}).sort([['access.club.level', -1], ['name.last', 1], ['name.first', 1]]).toArray(function(err, members){
		if(err) throw err;
		res.send({success: true, auth: true, result: members});
	});
});

router.patch("/:clubId/administration", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		res.locals.club = club;
		var user = res.locals.user;

		if(club._id.equals(user.club_id)){
			auth(user.access.club > 0);
		}else if(club.division_id.equals(user.division_id)){
			auth(user.access.division > 0);
		}
	});
}), function(req, res, next){
	var body = req.body;
	var errors = {};

	utils.checkIn(body, ["memberId", "access", "position"], function(elem, res){
		if(!res){
			errors[elem] = "Required";
		}else if(elem == "access" && (!utils.isInt(body[elem]) || body[elem] < 0 || body[elem] > 2)){
			errors[elem] = "Invalid Access Level";
		}
	});

	if(Object.keys(errors).length == 0){
		if(!ObjectId.isValid(body.memberId)){
			res.send({success: false, auth: true, error: {memberId: "Unable to find this member in the club"}});
		}else{
			var query = {_id: ObjectId(body.memberId), club_id: res.locals.club._id};
			var updates = {"access.club.level": parseFloat(body.access), "access.club.position": mongoSanitize.sanitize(body.position)};

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
});

var regEscape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

router.get("/:clubId/members", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		res.locals.club = club;
		var user = res.locals.user;

		if(club._id.equals(user.club_id)){
			auth(true);
		}else if(club.division_id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}
	});
}), function(req, res, next){
	var projection = {name: 1, "access.club": 1, email: 1};
	if("query" in req){
		if("search" in req.query){
			var search = regEscape(req.query.search);
			if(search.length >= 3){
				var query = {club_id: res.locals.club._id, $or: [{"name.first": new RegExp(search, "i")}, {"name.last": new RegExp(search, "i")}]};

				app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
					if(err) throw err;
					res.send({success: true, auth: true, result: members});
				});
			}else{
				res.send({success: false, auth: true, error: {search: "Search query of at least length of three required"}});
			}

			return;
		}
	}

	getClubMembers(res.locals.club._id, projection, function(members){
		res.send({success: true, auth: true, result: members});
	});
});

router.post("/:clubId/members", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		res.locals.club = club;
		var user = res.locals.user;

		if(club._id.equals(user.club_id)){
			auth(user.access.club > 0);
		}else if(club.division_id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}
	});
}), function(req, res, next){
	var body = req.body;

	if("new" in body){
		if(Array.isArray(body.new)){
			if(body.new.length == 0){
				res.send({success: true, auth: true});
				return;
			}

			var warnings = {};
			var newMembers = [];

			for(var i in body.new){
				var member = body.new[i];
				if(utils.isJSON(member)){
					if("name" in member && "first" in member.name && "last" in member.name){
						var data = {
							name: mongoSanitize.sanitize({
								first: String(member.name.first),
								last: String(member.name.last)
							}),
							email: "",
							club_id: res.locals.club._id,
							division_id: res.locals.club.division_id,
							access:{
								club: {
									level: 0
								},
								division: {
									level: 0
								},
								district: {
									level: 0
								}
							}
						};

						if("email" in member){
							data.email = String(member.email);
						}

						newMembers.push(data);
					}else{
						warnings.new = "Some members were not added because invalid format"
					}
				}else{
					warnings.new = "Some members were not added because invalid format"
				}
			}

			if(newMembers.length > 0){
				app.db.collection("members").insertMany(newMembers, function(err, insertRes){
					if(err) throw err;
					if("new" in warnings){
						res.send({success: true, auth: true, warning: warnings, result: insertRes.ops.map(function(member){
							return {
								_id: member._id,
								name: member.name,
								email: member.email
							}
						})});
					}else{
						res.send({success: true, auth: true, result: insertRes.ops.map(function(member){
							return {
								_id: member._id,
								name: member.name,
								email: member.email
							}
						})});
					}
				});
			}else{
				if("new" in warnings){
					res.send({success: true, auth: true, warning: warnings, result: []});
				}else{
					res.send({success: true, auth: true, result: []});
				}
			}
		}else{
			res.send({success: false, auth: true, error: {new: "Must be array"}});
		}
	}else{
		res.send({success: false, auth: true, error: {new: "Required"}});
	}
});

router.get("/:clubId/events", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		res.locals.club = club;
		var user = res.locals.user;

		if(club._id.equals(user.club_id)){
			auth(user.access.club > 0);
		}else if(club.division_id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}
	});

}), function(req, res, next){
	var body = req.query;
	var query = {
		$and: [{club_id: res.locals.club._id}]
	};

	if("date" in body){
		if(utils.isJSON(body.date)){
			var startQuery = {};

			if("before" in body.date){
				var date = moment(body.date.before, utils.isoFormat);
				if(date.isValid){
					startQuery.$lt = date.toDate();
				}
			}

			if("after" in body.date){
				var date = moment(body.date.after, utils.isoFormat);
				if(date.isValid){
					startQuery.$gte = date.toDate();
				}
			}

			if(Object.keys(startQuery).length > 0){
				query.$and.push({"time.start": startQuery});
			}
		}else{
			var date = moment(body.date, utils.isoFormat);
			if(date.isValid){
				query.$and.push({"time.start": date.toDate()});
			}
		}
	}

	if("status" in body) {
		if(Array.isArray(body.status)){
			var or = [];
			for(var i in body.status){
				var status = body.status[i];
				if(utils.isInt(status)){
					or.push({status: parseInt(status)});
				}
			}

			query.$and.push({$or: or});
		}else{
			if(utils.isInt(body.status)){
				body.status = parseInt(body.status);
				query.$and.push({status: body.status});
			}

		}
	}

	var projection = {name: 1, time: 1, status: 1, categories: 1, tags: 1, author: 1};

	app.db.collection("events").find(query, {projection: projection}).sort({"time.start": 1}).toArray(function(err, events){
		if(err) throw err;
		res.send({success: true, auth: true, result: events});
	});
});

router.get("/:clubId/goals", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {goals: 1, division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		var user = res.locals.user;
		res.locals.club = club;
		auth(club._id.equals(user.club_id) && user.access.club > 0);
	});

}), function(req, res, next){
	res.send({success: true, auth: true, result: res.locals.club.goals});
});

router.get("/:clubId/mrfs/:year/:month", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {goals: 1, division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		var user = res.locals.user;
		res.locals.club = club;

		var club = res.locals.club;
		var user = res.locals.user;
		if(utils.isInt(req.params.year) && utils.isInt(req.params.month)){
			req.params.year = Number(req.params.year);
			req.params.month = Number(req.params.month);
			var year = req.params.year;
			var month = req.params.month;

			if(month > 0 && month <= 12){
				var now = moment();
				if(now.year() < year){
					auth(false);
					return;
				}else if(now.year() === year){
					if(now.month() + 1 < month){
						auth(false);
						return;
					}
				}

				if((club._id.equals(user.club_id) && user.access.club > 0)
					|| (club.division_id.equals(user.division_id))
					|| (user.access.district > 0)){

					var query = {club_id: res.locals.club._id, year: req.params.year, month: req.params.month};
					var mrfProjection = {communications: 1, dcm: 1, events: 1, goals: 1, kfamReport: 1, meetings: 1, status: 1, submissionTime: 1, updates: 1};
					app.db.collection("mrfs").findOne(query, {projection: mrfProjection}, function(err, mrf){
						if(mrf != null){
							if(mrf.status > 0 || (club._id.equals(user.club_id) && user.access.club > 0)){
								res.locals.mrf = mrf;
								auth(true);
							}else{
								auth(false);
							}
						}else{
							if(club._id.equals(user.club_id) && user.access.club > 0){
								res.locals.mrf = utils.mrfDefaults(res.locals.club._id, res.locals.club.division_id, req.params.year, req.params.month);
								auth(true);
							}else{
								auth(false);
							}
						}
					});
				}else{
					auth(false);
				}
			}else{
				auth(false);
			}
		}else{
			auth(false);
		}
	});

}), function(req, res, next){
	var year = Number(req.params.year);
	var month = Number(req.params.month);
	var query = {year: year, month: month, club_id: res.locals.club._id};

	app.db.collection("mrfs").findOne(query, function(mrfErr, mrf){
		if(mrfErr) throw err;

		if(mrf == null){
			mrf = {};
		}else{
			delete mrf._id;
		}

		var properMRF = {}
		var defaults = app.get("mrfsRoute").mrfDefaults(res.locals.club._id, year, month);
		Object.keys(defaults).forEach(function(key){
			if(!(key in mrf)){
				properMRF[key] = defaults[key];
			}else{
				properMRF[key] = mrf[key];
			}
		});

		mrf = properMRF;
		var eventQuery = {
			club_id: res.locals.club._id,
			status: 2,
			"time.start": {
				$gte: new Date(year, month - 1, 1),
				$lte: new Date(year, month, 1)
			}
		};

		var eventProjection = {name: 1, time: 1, tags: 1, totals: 1};
		app.db.collection("events").find(eventQuery, {projection: eventProjection}).toArray(function(err, events){
			if(err) throw err;
			console.log(events);
			mrf.importedEvents = events;

			var checkTags = {};
			events.forEach(function(event){
				// ToDo
				// preprocess CERF events before importing into MRF
				// checkTags = checkTags.concat()
			});

			res.send({success: true, auth: true, result: mrf});
		});

	});

});

router.patch("/:clubId/mrfs/:year/:month", checkAuth(function(req, res, auth){
	getClub(req.params.clubId, {goals: 1, division_id: 1}, function(club){
		if(club == null){
			auth(false);
			return;
		}

		var user = res.locals.user;
		res.locals.club = club;

		if(utils.isInt(req.params.year) && utils.isInt(req.params.month)){
			req.params.year = Number(req.params.year);
			req.params.month = Number(req.params.month);
			var year = req.params.year;
			var month = req.params.month;

			if(month > 0 && month <= 12){
				auth(club._id.equals(user.club_id) && user.access.club > 0);
			}else{
				auth(false);
			}
		}else{
			auth(false);
		}
	});
}), function(req, res, next){
	var body = req.body;
	var data = {};
	var defaults = app.get("mrfsRoute").mrfDefaults(res.locals.club._id, req.params.year, req.params.month);
	var warnings = {};

	var year = req.params.year;
	var month = req.params.month;

	if("goals" in body){
		data.goals = Array.isArray(body.goals) ?
			body.goals.map(function(goal){
				return String(goal);
			})
			: [];
		defaults.goals = data.goals;
	}

	if("meetings" in body){
		var validMeetings = [];
		var meetings = body.meetings;
		if(Array.isArray(meetings)){
			meetings.forEach(function(meeting){
				var validMeeting = {};
				var goodMeeting = true;
				if(utils.isJSON(meeting)){
					if(utils.checkIn(meeting, ["date", "attendance", "advisorAttended"], function(elem, isIn){
						if(!isIn){
							warnings.meetings = "Some general meetings were unable to be added because of invalid formatting";
							goodMeeting = true;
						}
					}));

					if(goodMeeting){
						var date = moment(meeting.date, utils.isoFormat);
						if(date.isValid()){
							validMeeting.date = date.toDate();
						}else{
							warnings.meetings = "Some general meetings were unable to be added because of invalid formatting";
							return;
						}

						if(utils.isJSON(meeting.attendance)
							&& "numMembers" in meeting.attendance && utils.isInt(meeting.attendance.numMembers)
							&& "numNonHomeMembers" in meeting.attendance && utils.isInt(meeting.attendance.numNonHomeMembers)
							&& "numKiwanis" in meeting.attendance && utils.isInt(meeting.attendance.numKiwanis)
							&& "numGuests" in meeting.attendance && utils.isInt(meeting.attendance.numGuests)){
							validMeeting.attendance = {};
							validMeeting.attendance.numMembers = Math.max(0, Number(meeting.attendance.numMembers));
							validMeeting.attendance.numNonHomeMembers = Math.max(0, Number(meeting.attendance.numNonHomeMembers));
							validMeeting.attendance.numKiwanis = Math.max(0, Number(meeting.attendance.numKiwanis));
							validMeeting.attendance.numGuests = Math.max(0, Number(meeting.attendance.numGuests));
						}else{
							warnings.meetings = "Some general meetings were unable to be added because of invalid formatting";
							return;
						}

						var faculty = null;
						var kiwanis = null;
						if(utils.isJSON(meeting.advisorAttended)
							&& "faculty" in meeting.advisorAttended && (faculty = utils.toBool(meeting.advisorAttended.faculty)) != null
							&& "kiwanis" in meeting.advisorAttended && (kiwanis = utils.toBool(meeting.advisorAttended.kiwanis)) != null){
							validMeeting.advisorAttended = {};
							validMeeting.advisorAttended.faculty = faculty;
							validMeeting.advisorAttended.kiwanis = kiwanis;
						}else{
							warnings.meetings = "Some general meetings were unable to be added because of invalid formatting";
							return;
						}

					}else{
						warnings.meetings = "Some general meetings were unable to be added because of invalid formatting";
						return;
					}
				}else{
					warnings.meetings = "Some general meetings were unable to be added because of invalid formatting";
					return;
				}

				validMeetings.push(validMeeting);
			});

		}else{
			warnings.meetings = "Some general meetings were unable to be added because of invalid formatting";
		}

		data["meetings"] = validMeetings;
		defaults.meetings = validMeetings;
	}

	if("boardMeetings" in body){
		var validMeetings = [];
		if(Array.isArray(body.boardMeetings)){
			body.boardMeetings.forEach(function(meeting){
				var validMeeting = {};
				var goodMeeting = true;
				if(utils.isJSON(meeting)){
					if(utils.checkIn(meeting, ["date", "attendance"], function(elem, isIn){
						if(!isIn){
							warnings.boardMeetings = "Some board meetings were unable to be added because of invalid formatting";
							goodMeeting = false;
						}
					}));

					if(goodMeeting){
						var date = moment(meeting.date, utils.isoFormat);
						if(date.isValid()){
							validMeeting.date = date.toDate();
						}else{
							warnings.boardMeetings = "Some board meetings were unable to be added because of invalid formatting";
							return;
						}
						if(utils.isJSON(meeting.attendance)
							&& "numBoard" in meeting.attendance && utils.isInt(meeting.attendance.numBoard)
							&& "numGuests" in meeting.attendance && utils.isInt(meeting.attendance.numGuests)){

							validMeeting.attendance = {};
							validMeeting.attendance.numBoard = Math.max(0, Number(meeting.attendance.numBoard));
							validMeeting.attendance.numGuests = Math.max(0, Number(meeting.attendance.numGuests));

						}else{
							warnings.boardMeetings = "Some board meetings were unable to be added because of invalid formatting";
							return;
						}

					}else{
						warnings.boardMeetings = "Some board meetings were unable to be added because of invalid formatting";
						return;
					}
				}else{
					warnings.boardMeetings = "Some board meetings were unable to be added because of invalid formatting";
					return;
				}

				validMeetings.push(validMeeting);
			});
		}else{
			warnings.boardMeetings = "Some board meetings were unable to be added because of invalid formatting";
		}

		data.boardMeetings = validMeetings;
		defaults.boardMeetings = validMeetings;

	}

	if("dcm" in body){
		var dcm = body.dcm;
		if(utils.isJSON(dcm)){
			if("date" in dcm){
				var date = moment(dcm.date, utils.isoFormat);
				if(date.isValid()){
					data["dcm.date"] = date.toDate();
					defaults.dcm.date = data["dcm.date"];
				}
			}

			if("nextDate" in dcm){
				var date = moment(dcm.nextDate, utils.isoFormat);
				if(date.isValid()){
					data["dcm.nextDate"] = date.toDate();
					defaults.dcm.nextDate = data["dcm.nextDate"];
				}
			}

			if("presidentAttended" in dcm){
				if(utils.toBool(dcm.presidentAttended) != null){
					data["dcm.presidentAttended"] = utils.toBool(dcm.presidentAttended);
					defaults.dcm.presidentAttended = data["dcm.presidentAttended"];
				}
			}

			if("numMembers" in dcm){
				if(utils.isInt(dcm.numMembers)){
					data["dcm.numMembers"] = Number(dcm.numMembers);
					defaults.dcm.numMembers  = data["dcm.numMembers"];
				}
			}
		}
	}

	if("communications" in body){
		var communications = body.communications;
		if(utils.isJSON(communications)){
			if("ltg" in communications){
				data["communications.ltg"] = String(communications.ltg);
				defaults.communications.ltg = String(communications.ltg);
			}

			if("dboard" in communications){
				data["communications.dboard"] = String(communications.dboard);
				defaults.communications.dboard = String(communications.dboard);
			}
		}
	}

	if("kfamReport" in body){
		if(utils.toBool(body.kfamReport) != null){
			data["kfamReport"] = utils.toBool(body.kfamReport);
			defaults.kfamReport = data["kfamReport"];
		}
	}

	if("events" in body){
		if(Array.isArray(body.events)){
			data["events"] = [];
			var events = body.events;
			events.forEach(function(event){
				if(utils.isJSON(event)){
					var validEvent = {};
					if("time" in event && utils.isJSON(event.time) && "start" in event.time && "end" in event.time){
						var start = moment(String(event.time.start), utils.isoFormat);
						var end = moment(String(event.time.end), utils.isoFormat);

						if(start.isValid() && end.isValid()){
							if(start.year() == year && start.month() + 1 == month){
								validEvent.time = {
									start: start.toDate(),
									end: end.toDate()
								}
							}else{
								warnings.events = "Some events had invalid formating."
								return;
							}

						}else{
							warnings.events = "Some events had invalid formating."
							return;
						}
					}else{
						warnings.events = "Some events had invalid formating."
						return;
					}

					if("name" in event){
						validEvent.name = String(mongoSanitize.sanitize(event.name));
					}else{
						warnings.events = "Some events had invalid formating."
						return;
					}

					validEvent.totals = {};
					if("totals" in event
						&& utils.isJSON(event.totals)
						&& "service" in event.totals
						&& "leadership" in event.totals
						&& "fellowship" in event.totals
						&& "members" in event.totals){

						if(utils.isInt(event.totals.members) && event.totals.members >= 0){
							validEvent.totals.members = Number(event.totals.members);
						}else{
							validEvent.totals.members = 0;
						}

						if(utils.isFloat(event.totals.service) && event.totals.service >= 0){
							validEvent.totals.service = Number(event.totals.service);
						}else{
							validEvent.totals.service = 0;
						}

						if(utils.isFloat(event.totals.leadership) && event.totals.leadership >= 0){
							validEvent.totals.leadership = Number(event.totals.leadership);
						}else{
							validEvent.totals.leadership = 0;
						}

						if(utils.isFloat(event.totals.fellowship) && event.totals.fellowship >= 0){
							validEvent.totals.fellowship = Number(event.totals.fellowship);
						}else{
							validEvent.totals.fellowship = 0;
						}
					}

					validEvent.tags = [];
					if("tags" in event){
						if(Array.isArray(event.tags)){
							app.get("tagsRoute").getTags(event.tags, {_id: 1}, function(tags){
								if(tags != null){
									validEvent.tags = tags.map(function(tag){
										return tag._id;
									});

									data.events.push(validEvent);
								}
							});
						}
					}
				}else{
					warnings.events = "Some events had invalid formating."
					return;
				}
			});
		}
	}
	console.log("Going to try patching now");

	// tryAdd();

 	/*
	if("fundraising" in body){
		var validFundraisers = [];
		if(Array.isArray(body.fundraising)){
			var fundraising = body.fundraising;
			fundraising.forEach(function(fundraiser){
				if(utils.isJSON(fundraiser)){

				}else{

				}
			});
		}

		data["fundraising"] = validFundraisers;
		defaults.fundraising = validFundraisers;
	}*/

	// var tryAdd = function(){
		var query = {club_id: res.locals.club._id, year: req.params.year, month: req.params.month};
		var updates = {$set: data};
		if(Object.keys(data).length > 0){
			app.db.collection("mrfs").updateOne(query, updates, function(err, updateRes){
				if(err) throw err;
				if(updateRes.matchedCount == 0){
					app.db.collection("mrfs").insert(defaults, function(err, insertRes){
						if(err) throw err;
						if(Object.keys(warnings).length > 0){
							res.send({success: true, auth: true, warning: warnings});
						}else{
							res.send({success: true, auth: true});
						}
					});
				}else{
					if(Object.keys(warnings).length > 0){
						res.send({success: true, auth: true, warning: warnings});
					}else{
						res.send({success: true, auth: true});
					}
				}
			});
		}else{
			if(Object.keys(warnings).length > 0){
				res.send({success: true, auth: true, warning: warnings});
			}else{
				res.send({success: true, auth: true});
			}
		}
	// };
});

module.exports = function(newApp){
	app = newApp;
	utils = require('mrf-utils')(app);
	return {
		router: router,
		getClub: getClub
	};
}
