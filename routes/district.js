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