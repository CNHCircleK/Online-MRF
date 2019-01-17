var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var moment = require('moment');

var auth = require("../auth");
var utils;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();	
});

function checkClubAuth(projection, clubAuth, callback = null){
	if(callback == null){
		callback = clubAuth;
		clubAuth = projection;
		projection = {};
	}

	return auth.checkAuth(
		function(req, res, auth){
			var user = res.locals.user;
			if(!ObjectId.isValid(req.params.clubId)){
				auth(false);
			}else{
				var query = {"_id": ObjectId(req.params.clubId)};		
				app.db.collection("clubs").findOne(query, {projection: projection}, function(err, club){
					if(err) throw err;
					if(club != null){
						res.locals.club = club;
						clubAuth(req, res, auth);
					}else{
						auth(false);
					}
				});	
			}
		}, callback
	);
}

router.get("/:clubId/administration", checkClubAuth({_id: 1, division_id: 1},
	function(req, res, auth){
		var club = res.locals.club;
		var user = res.locals.user;

		if(club._id.equals(user.club_id)){
			auth(user.access.club > 0);
		}else if(club.division_id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}
	},

	function(req, res, next){
		var club = res.locals.club;
		var user = res.locals.user;

		var query = {club_id: club._id, "access.club.level": {$gt: 0}};
		var projection = {name: 1, email: 1, "access.club": 1};

		app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
			if(err) throw err;
			res.send({success: true, auth: true, result: members});
		});			
	}

));

router.patch("/:clubId/administration", checkClubAuth(
	function(req, res, auth){
		var club = res.locals.club;
		var user = res.locals.user;
		auth(club._id.equals(user.club_id) && user.access.club > 0);
	},

	function(req, res, next){
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
	}
));

var regEscape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

router.get("/:clubId/members", checkClubAuth({_id: 1, division_id: 1},
	function(req, res, auth){
		var club = res.locals.club;
		var user = res.locals.user;

		if(club._id.equals(user.club_id)){
			auth(true);
		}else if(club.division_id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}
	},

	function(req, res, next){
		if("query" in req){
			if("search" in req.query){
				var search = regEscape(req.query.search);
				if(search.length >= 3){
					var query = {club_id: res.locals.club._id, $or: [{"name.first": new RegExp(search, "i")}, {"name.last": new RegExp(search, "i")}]};
					var projection = {name: 1, email: 1};

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

		var query = {club_id: res.locals.club._id};
		var projection = {name: 1, email: 1};

		app.db.collection("members").find(query, {projection: projection}).toArray(function(err, members){
			if(err) throw err;
			res.send({success: true, auth: true, result: members});
		});
	}
));

router.get("/:clubId/events", checkClubAuth({_id: 1},
	function(req, res, auth){
		var club = res.locals.club;
		var user = res.locals.user;
		auth(club._id.equals(user.club_id) && user.access.club > 0);
	},

	function(req, res, next){
		var body = req.query;
		var query = {
			$and: [{club_id: res.locals.club._id}]
		};

		// TODO Add more 
		if("status" in body) {
			if(Array.isArray(body.status)){
				var or = [];
				for(var i in body.status){
					var status = body.status[i];
					if(utils.isInt(status)){
						or.push({status: parseInt(status)});
					}else{
						res.send({success: true, auth: true, result: []});
						return;
					}
					
				}

				query.$and.push({$or: or});
			}else{
				if(utils.isInt(body.status)){
					body.status = parseInt(body.status);
					query.$and.push({status: body.status});	
				}else{
					res.send({success: true, auth: true, result: []});
					return;
				}
				
			}
		}

		var projection = {name: 1, time: 1, status: 1, categories: 1, tags: 1};

		app.db.collection("events").find(query, {projection: projection}).toArray(function(err, events){
			if(err) throw err;
			res.send({success: true, auth: true, result: events});
		});	
	}
));

router.get("/:clubId/events/status/:status", checkClubAuth({_id: 1},
	function(req, res, auth){
		if(utils.isInt(req.params.status)){
			var club = res.locals.club;
			var user = res.locals.user;
			auth(club._id.equals(user.club_id) && user.access.club > 0);			
		}else{
			auth(false);
		}
	},

	function(req, res, next){
		var query = {
			club_id: res.locals.club._id,
			status: Number(req.params.status)
		};

		var projection = {name: 1, time: 1, categories: 1, tags: 1};

		app.db.collection("events").find(query, {projection: projection}).toArray(function(err, events){
			if(err) throw err;
			res.send({success: true, auth: true, result: events});
		});	
	}
));

router.post("/:clubId/members", checkClubAuth({_id: 1, division_id: 1},
	function(req, res, auth){
		auth(res.locals.user.access.club > 0);
	},

	function(req, res, next){
		var body = req.body;
		var errors = {};
		utils.checkIn(body, ["name"], function(elem, res){
			if(!res){
				errors[elem] = "Required";
			}else{
				if(utils.isJSON(body.name)){
					if(!("first" in body.name && "last" in body.name)){
						errors[elem] = "Required";
					}
				}
			}
		});

		if(Object.keys(errors).length == 0){
			var data = 	mongoSanitize.sanitize({
				name: {
					first: body.name.first, 
					last: body.name.last
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
					district: {
						level: 0
					}
				}
			});

			app.db.collection("members").insertOne(data, function(err, insertRes){
				if(err) throw err;
				res.send({success: true, auth: true, result: data._id});
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

router.get("/:clubId/goals", checkClubAuth({_id: 1, division_id: 1, goals: 1},
	function(req, res, auth){
		var club = res.locals.club;
		var user = res.locals.user;

		if(club._id.equals(user.club_id)){
			auth(user.access.club > 0);
		}else if(club.division_id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}
	},

	function(req, res, next){
		res.send({success: true, auth: true, result: res.locals.club.goals});
	}
));

router.get("/:clubId/mrfs/:year/:month", checkClubAuth({_id: 1, division_id: 1, goals: 1},
	function(req, res, auth){
		var club = res.locals.club;
		var user = res.locals.user;
		if(utils.isInt(req.params.year) && utils.isInt(req.params.month)){
			req.params.year = Number(req.params.year);
			req.params.month = Number(req.params.month);
			var year = req.params.year;
			var month = req.params.month;

			if(month > 0 && month <= 12){
				var now = moment();
				if(now.year() > year){
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
	},

	function(req, res, next){
		var mrf = res.locals.mrf;
		var eventQuery = {
			club_id: res.locals.club._id,
			status: 2,
			"time.start": {
				$gte: new Date(req.params.year, req.params.month - 1, 1), 
				$lte: new Date(req.params.year, req.params.month, 1)
			}
		};

		var eventProjection = {name: 1, time: 1, tags: 1, totals: 1, labels: 1};
		app.db.collection("events").find(eventQuery, {projection: eventProjection}).toArray(function(err, events){
			if(err) throw err;
			mrf.events = events;
			delete mrf["club_id"]
			delete mrf["division_id"]
			res.send({success: true, auth: true, result: mrf});
		});			
	}
));

router.patch("/:clubId/mrfs/:year/:month", checkClubAuth({_id: 1, division_id: 1, goals: 1},
	function(req, res, auth){
		var club = res.locals.club;
		var user = res.locals.user;

		if(utils.isInt(req.params.year) && utils.isInt(req.params.month)){
			req.params.year = Number(req.params.year);
			req.params.month = Number(req.params.month);
			var year = req.params.year;
			var month = req.params.month;

			if(month > 0 && month <= 12){
				if(club._id.equals(user.club_id)){
					if(user.access.club > 0){
						// moment goes from 0 to 11 for months
						var now = moment();
						if(now.year() === year){
							auth(now.month() + 1 === month || now.month() === month);
						}else if(now.year() === year + 1){
							auth(month === 12 && now.month() === 0);
						}else{
							auth(false);
						}
					}else{
						auth(false);
					}
				}	
			}else{
				auth(false);
			}
		}else{
			auth(false);
		}
	},

	function(req, res, next){
		var body = req.body;
		var data = {};
		var defaults = utils.mrfDefaults(res.locals.club._id, res.locals.club.division_id, req.params.year, req.params.month);

		if("goals" in body){
			data.goals = Array.isArray(body.goals) ? 
				body.goals.map(function(goal){
					return String(goal);
				})
				: [];
			defaults.goals = data.goals;
		}

		if("meetings" in body){
			var meetings = body.meetings;
			if(Array.isArray(meetings)){
				for(var i in meetings){
					var meeting = meetings[i];
					if(utils.isJSON(meeting)){
						if("week" in meeting){
							var week = meeting.week;
							if(utils.isInt(week) && 0 < Number(week) && Number(week) <= 5){
								week = Number(week);
								(function(keys){
									for(var i in keys){
										var key = keys[i];
										if(key in meeting && utils.isInt(meeting[key])){
											data["meetings." + (week-1) + "." + key] = Number(meeting[key]);
											defaults.meetings[week-1][key] = data["meetings." + (week-1) + "." + key];
										}
									}
								})(["numMembers", "numNonHomeMembers", "numKiwanis", "numGuests"]);		

								if("advisorAttended" in meeting){
									var advisorAttended = meeting.advisorAttended;
									if(utils.isJSON(advisorAttended)){
										if("faculty" in advisorAttended && utils.toBool(advisorAttended.faculty) != null){
											data["meetings." + (week-1) + ".advisorAttended.faculty"] = utils.toBool(advisorAttended.faculty);
											defaults.meetings[week-1].advisorAttended.faculty = data["meetings." + (week-1) + ".advisorAttended.faculty"];
										}

										if("kiwanis" in advisorAttended && utils.toBool(advisorAttended.kiwanis) != null){
											data["meetings." + (week-1) + ".advisorAttended.kiwanis"] = utils.toBool(advisorAttended.kiwanis);
											defaults.meetings[week-1].advisorAttended.kiwanis = data["meetings." + (week-1) + ".advisorAttended.kiwanis"];
										}
									}
								}

								if("date" in meeting){
									var date = moment(meeting.date, utils.isoFormat);
									if(date.isValid()){
										data["meetings." + (week-1) + ".date"] = date.toDate();
										defaults.meetings[week-1].date = data["meetings." + (week-1) + ".date"];
									}
								}
							}
						}
					}
				}
			}
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
					if("message" in communications.ltg){
						data["communications.ltg.message"] = String(communications.ltg.message);
						defaults.communications.ltg.message = data["communications.ltg.message"];
					}

					if("contacted" in communications.ltg){
						if(utils.isJSON(communications.ltg.contacted)){
							(function(keys){
								for(var i in keys){
									var key = keys[i];
									if(key in communications.ltg.contacted){
										if(utils.toBool(communications.ltg.contacted[key]) != null){
											data["communications.ltg.contacted." + key] = utils.toBool(communications.ltg.contacted[key]);
											defaults.communications.ltg.contacted[key] = data["communications.ltg.contacted." + key];
										}
									}
								}
							})(["visit", "phone", "email", "newsletter", "other"]);
						}
					}
				}
			}
		}

		if("kfamReport" in body){
			if(utils.toBool(body.kfamReport) != null){
				data["kfamReport"] = utils.toBool(body.kfamReport);
				defaults.kfamReport = data["kfamReport"];
			}
		}

		if("labels" in body){
			if(Array.isArray(body.labels)){
				data["labels"] = body.labels.map(function(label){ return String(label); });
				defaults.labels = data["labels"];
			}
		}

		var query = {club_id: res.locals.club._id, year: req.params.year, month: req.params.month};
		var updates = {$set: data};
		app.db.collection("mrfs").updateOne(query, updates, function(err, updateRes){
			if(err) throw err;
			if(updateRes.matchedCount == 0){
				app.db.collection("mrfs").insert(defaults, function(err, insertRes){
					if(err) throw err;
					res.send({success: true, auth: true});
				});
			}else{
				res.send({success: true, auth: true});
			}
		});
	}
));


module.exports = router;