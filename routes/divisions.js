var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var utils;

router.all('*', function(req, res, next){
	if(req.session.userId == null){
		res.redirect('signin');
	}else{
		app = req.app;
		utils = require('mrf-utils')(app);
		next();			
	}
});

router.get("/:clubId", function(req, res, next){
	res.send("Show options");
});

router.get("/:clubId/members", function(req, res, next){
	res.send("Show list of members")
});

router.get("/:clubId/mrfs", function(req, res, next){
	res.send("Show list of mrfs");
});

module.exports = router;