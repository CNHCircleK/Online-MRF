var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var auth = require("../auth");
var utils;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();
});

router.get("/divisions", auth.checkAuth(
	function(req, res, auth){
		auth(res.locals.user.access.district > 0);
	},

	function(req, res, next){
		app.db.collection("divisions").find({}).toArray(function(err, divisions){
			if(err) throw err;
			res.send({success: true, auth: true, result: divisions});
		});
	}
));

router.get("/tags", auth.checkAuth(
	function(req, res, auth){
		auth(res.locals.user.access.district > 0);
	},

	function(req, res, next){
		app.db.collection("tags").find({}).toArray(function(err, tags){
			if(err) throw err;
			res.send({success: true, auth: true, result: tags});
		});
	}
));

router.patch("/tags/:tagId", auth.checkAuth(
	function(req, res, auth){
		if(res.locals.user.access.district > 0){
			if(ObjectId.isValid(req.params.eventId)){
				app.db.collection("tags").findOne({_id: ObjectId(req.params.tagId)}, {projection: {_id: 1}}, function(err, tag){
					if(err) throw err;
					if(tag != null){
						res.locals.tag = tag;
						auth(true);
					}else{
						auth(false);
					}
				});
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
		var warnings = {};

		if("name" in body){
			data.name = String(body.name);
		}

		if("abbrev" in body){
			data.abbrev = String(body.abbrev);
		}

		if("active" in body){
			var active = utils.toBool(body.active);
			if(active){
				data.active = active;
			}else{
				warnings.active = "Needs to be boolean";
			}
		}

		if(Object.keys(body).length > 0){
			var tagQuery = {_id: res.locals.tag._id};
			app.db.collection("tags").updateOne(tagQuery, data, function(err, updateRes){
				if(err) throw err;
				if(Object.keys(warning).length == 0){
					res.send({success: true, auth: true});
				}else{
					res.send({success: true, auth: true, warnings: true});
				}
			});
		}else{
			if(Object.keys(warning).length == 0){
				res.send({success: true, auth: true});
			}else{
				res.send({success: true, auth: true, warnings: true});
			}
		}
	}
));

router.post("/tags", auth.checkAuth(
	function(req, res, auth){
		auth(res.locals.user.access.district > 0);
	},

	function(req, res, next){
		var body = req.body;
		var errors = {};
		utils.checkIn(body, ["name", "abbrev"], function(elem, res){
			if(!res){
				errors[elem] = "Required";
			}
		});

		if(Object.keys(errors).length == 0){
			var data = {
				name: String(body.name),
				abbrev: String(body.abbrev).toUpperCase(),
				active: true
			};
			data = mongoSanitize.sanitize(data);

			app.db.collection("tags").insertOne(data, function(err, insertRes){
				if(err) throw err;
				res.send({success: true, auth: true, result: data._id});
			});
		}
	}
));

router.get("/mrfs", auth.checkAuth(
	function(req, res, auth){
		auth(res.locals.user.access.district > 0);
	},

	function(req, res, next){
		var query = {status: 1};
		var projection = {club_id: 1, year: 1, month: 1};
		
		app.db.collection("divisions").find(query, {projection: projection}).toArray(function(err, mrfs){
			if(err) throw err;
			res.send({success: true, auth: true, result: mrfs});
		});
	}
));

module.exports = router;