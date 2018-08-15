var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var auth = require('../auth');
var utils;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();	
});

function checkDivisionAuth(projection, divisionAuth, callback = null){
	if(callback == null){
		callback = divisionAuth;
		divisionAuth = projection;
		projection = {};
	}

	return auth.checkAuth(
		function(req, res, auth){
			var user = res.locals.user;
			if(!ObjectId.isValid(req.params.divisionId)){
				auth(false);
			}else{
				var query = {"_id": ObjectId(req.params.divisionId)};
				app.db.collection("divisions").findOne(query, {projection: projection}, function(err, division){
					if(err) throw err;
					if(division != null){
						res.locals.division = division;
						divisionAuth(req, res, auth);
					}else{
						auth(false);
					}
					
				});				
			}
		}, callback
	);

}

router.get("/:divisionId/clubs", checkDivisionAuth({_id: 1},
	function(req, res, auth){
		var division = res.locals.division;
		var user = res.locals.user;

		if(division._id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district == 1);
		}	
	},

	function(req, res, next){
		var query = {division_id: res.locals.division._id};
		var projection = {name: 1};

		app.db.collection("clubs").find(query, {projection: projection}).toArray(function(err, result){
			if(err) throw err;
			res.send({success: true, auth: true, result: result})
		});
	}
));

router.get("/:divisionId/mrfs", checkDivisionAuth({_id: 1},
	function(req, res, auth){
		var division = res.locals.division;
		var user = res.locals.user;

		if(division._id.equals(user.division_id)){
			auth(user.access.division > 0);
		}else{
			auth(user.access.district == 1);
		}	
	},

	function(req, res, next){
		var now = new Date();
		var query = {division_id: res.locals.division._id, year: now.getFullYear(), month: now.getMonth() + 1, status: 1};
		var projection = {_id: 0, year: 1, month: 1, submissionTime: 1};

		app.db.collection("mrfs").find(query, {projection: projection}).toArray(function(err, mrfs){
			if(err) throw err;
			res.send({success: true, auth: true, result: mrfs});
		});
	}
));

module.exports = router;