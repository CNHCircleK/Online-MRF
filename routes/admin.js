var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var auth = require('../auth')
var utils;

router.all('*', function(req, res, next){
	app = req.app;
	utils = require('mrf-utils')(app);
	next();			
});

router.get("/", function(req, res, next){
	res.send("Success");
});

router.post('/divisions/create', function(req, res, next){
	var body = req.body;
	if('name' in body){
		var data = {"name": body['name']};
		app.db.collection("divisions").insertOne(mongoSanitize.sanitize(data), function(err, insertRes){
			if(err) throw err;
			res.send({success: true});
		});
	}
});

//TODO
router.get('/clubs', function(req, res, next){
	res.send({success:true});
});

//TODO
router.post('/clubs/create', function(req, res, next){

});

router.post('/tags/create', function(req, res, next){
	var body = req.body;
	var errors = {};
	utils.checkIn(body, ['name', 'abbrev'], function(elem, res){
		if(!res){
			errors[elem] = "Required";
		}
	});

	if(Object.keys(errors).length == 0){
		var data = mongoSanitize.sanitize({name: body['name'], abbrev: body['abbrev']});
		app.db.collection("tags").insertOne(data, function(err, insertRes){
			if(err) throw err;
			res.send({success: true, auth: true});
		});	
	}else{
		res.send({success: false, auth: true, error: errors});
	}
});


module.exports = router;
 