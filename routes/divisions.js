var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var auth = require('./auth');
var utils;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();	
});


var checkDivisionAccess = auth.checkAuth(
	function(req, res, auth){
		var user = res.locals.user;
		if(!ObjectId.isValid(req.params.divisionId)){
			auth(false);
		}else{
			var query = {"_id": ObjectId(req.params.divisionId)};
			query = mongoSanitize.sanitize(query);

			app.db.collection("divisions").findOne(query, function(err, division){
				if(err) throw err;
				if(division != null
				 && ((division._id == user.division_id && user.access.division > 1)
				 	|| user.access.district == 1)){
					res.locals.division = division;
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

router.all("/:divisionId", checkDivisionAccess);
router.all("/:divisionId/*", checkDivisionAccess);

router.get("/:divisionId/clubs", function(req, res, next){
	var query = {division_id: res.locals.division._id};
	var projection = {name: 1};

	app.db.collection("clubs").find(query, {projection: projection}).toArray(function(err, result){
		if(err) throw err;
		res.send({success: true, auth: true, result: result})
	});
});

module.exports = router;