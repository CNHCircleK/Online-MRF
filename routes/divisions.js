var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var checkAuth = require("../auth").checkAuth;
var utils;

var moment = require('moment');

function getDivision(divisionId, projection, callback){
	if(!ObjectId.isValid(divisionId)){
		callback(null);
		return;
	}

	var query = {"_id": ObjectId(divisionId)};
	app.db.collection("divisions").findOne(query, {projection: projection}, function(err, division){
		if(err) throw err;
		callback(division);
	});		
}

function getClubs(divisionId, projection, callback){
	var query = {division_id: ObjectId(divisionId)};
	app.db.collection("clubs").find(query, {projection: projection}).sort({name: 1}).toArray(function(err, clubs){
		if(err) throw err;
		callback(clubs);
	});	
}

router.get("/", checkAuth(function(req, res, auth){
	auth(res.locals.user.access.district > 0);
}), function(req, res, next){
	app.db.collection("divisions").find({}, {projection: {name: 1}}).toArray(function(err, divisions){
		if(err) throw err;
		res.send({success: true, auth: true, result: divisions});
	});
});

router.post("/", checkAuth(function(req, res, auth){
	auth(res.locals.user.access.district > 0);
}), function(req, res, next){
	var body = req.body;
	if('name' in body){
		var data = {"name": String(body['name'])};
		app.db.collection("divisions").insertOne(mongoSanitize.sanitize(data), function(err, insertRes){
			if(err) throw err;
			res.send({success: true, auth: true, result: data._id});
		});
	}else{
		res.send({success: false, auth: true, error: {name: "Required"}});
	}
});

router.get("/:divisionId", checkAuth(function(req, res, auth){
	getDivision(req.params.divisionId, {name: 1}, function(division){
		if(division == null){
			auth(false);
			return;
		}

		res.locals.division = division;
		var user = res.locals.user;

		if(division._id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}		
	});

}), function(req, res, next){
	res.send({success: true, auth: true, result: res.locals.division});
});

router.delete("/:divisionId", checkAuth(function(req, res, auth){
	var user = res.locals.user;
	if(user.access.district > 0){
		getDivision(req.params.divisionId, {_id: 1}, function(division){
			if(err) throw err;
			if(division == null){
				auth(false);
				return;
			}

			getClubs(req.params.divisionId, {_id: 1}, function(clubs){
				if(clubs.length > 0){
					auth(true, false, {division: "Cannot delete division with existing clubs"});
					return;
				}

				auth(true);
			});
			
		});
	}else{
		auth(false);
	}
	
}), function(req, res, next){
	app.db.collection("divisions").remove({_id: ObjectId(req.params.divisionId)}, function(err){
		if(err) throw err;
		res.send({success: true, auth: true});
	});
});

router.get("/:divisionId/clubs", checkAuth(function(req, res, auth){
	getDivision(req.params.divisionId, {_id: 1}, function(division){
		if(division == null){
			auth(false);
			return;
		}

		res.locals.division = division;
		var user = res.locals.user;

		if(division._id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district > 0);
		}		
	});

}), function(req, res, next){
	getClubs(req.params.divisionId, {name:1}, function(clubs){
		res.send({success: true, auth: true, result: clubs});
	});
});

router.post("/:divisionId/clubs", checkAuth(function(req, res, auth){
	getDivision(req.params.divisionId, {_id: 1},function(division){
		if(division == null){
			auth(false);
			return;
		}

		res.locals.division = division;
		var user = res.locals.user;

		auth(division._id.equals(user.division_id) && user.access.division > 0);		
	});
	
}), function(req, res, next){
	var body = req.body;
	var errors = {};

	if(!("name" in body)){
		errors["name"] = "Required";
	}

	if(Object.keys(errors).length == 0){
		var data = {
			"name": String(body['name']),
			"division_id": res.locals.division._id,
			"goals":{
				"service": {
					"hours":{
						"total": null,
						"perMember": null
					},
					"fundraising": {
						"ptp": null,
						"fa": null,
						"kfh": null
					},
					"other": []
				},
				"leadership": {
					"other": []
				},
				"fellowship": {
						"duesPaid": null,
					"interclubs": null
				}
			}
		};

		app.db.collection("clubs").insertOne(mongoSanitize.sanitize(data), function(err, insertRes){
			if(err) throw err;
			res.send({success: true, auth: true, result: data._id});
		});
	}else{
		res.send({success: false, auth: true, error: errors});
	}	
});

router.get("/:divisionId/mrfs/:year/:month", checkAuth(function(req, res, auth){
	getDivision(req.params.divisionId, {_id: 1},function(division){
		res.locals.division = division;
		var user = res.locals.user;

		if(division == null){
			auth(false);
			return;
		}
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

				if(division._id.equals(user.division_id)){
					auth(user.access.division > 0);
				}else{
					auth(user.access.district > 0);
				}

			}else{
				auth(false);
			}
		}else{
			auth(false);
		}		
	});
	
}), function(req, res, next){
	getClubs(res.locals.division._id, {name: 1, _id: 1}, function(clubs){
		var year = Number(req.params.year);
		var month = Number(req.params.month);

		var clubNames = {};
		var clubIds = clubs.map(function(club){ 
			clubNames[String(club._id)] = club.name;
			return club._id 
		});

		app.get("mrfsRoute").getMRF(clubIds, year, month, {club_id: 1}, function(mrf){
			mrf.forEach(function(clubMRF){
				clubMRF.club = {name: clubNames[String(clubMRF.club_id)], _id: clubMRF.club_id};
				delete clubMRF.club_id;
			});

			res.send({success: true, auth: true, result: mrf});
		})
	});
});

module.exports = function(newApp){
	app = newApp;
	utils = require('mrf-utils')(app);
	return {
		router: router,
		getDivision: getDivision
	};
}