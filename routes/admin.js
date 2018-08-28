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

router.get('/clubs', function(req, res, next){
	res.send({success:true});
});

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

function createMRF(clubId, divisionId, year, month, callback = function(){}){
	var data = {
		club_id: ObjectId(clubId),
		division_id: ObjectId(divisionId),
		year: year,
		month: month,
		status: 0,
		submissionTime: null,
		updates: {
			duesPaid: null,
			newDuesPaid: null
		},
		goals: [],
		meetings: {
			1: {
				date: null,
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttendance:{
					faculty: null,
					kiwanis: null
				}
			},

			2: {
				date: null,
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttendance:{
					faculty: null,
					kiwanis: null
				}
			},

			3: {
				date: null,
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttendance:{
					faculty: null,
					kiwanis: null
				}
			},

			4: {
				date: null,
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttended:{
					faculty: null,
					kiwanis: null
				}
			},

			5: {
				date: null,
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttendance:{
					faculty: null,
					kiwanis: null
				}
			}
		},

		dcm:{
			date: null,
			presidentAttended: null,
			members: null,
			nextDate: null
		},

		communications:{
			ltg:{
				message: null,
				contacted:{
					visit: null,
					phone: null,
					email: null,
					newsletter: null,
					other: null
				}
			},
			dboard: null
		},

		kfamReport: null
	};

	app.db.collection("mrfs").insertOne(mongoSanitize.sanitize(data), function(err, insertRes){
		if(err){
			callback(err);
			return;
		}

		callback(null, true);
	});	
}


module.exports = router;
 