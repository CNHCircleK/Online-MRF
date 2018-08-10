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
	createMRF('5b498a5b200a8f6afa46c1d0', 2018, 07);
	res.send("Success");
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

router.post('/divisions/create', function(req, res, next){
	var body = req.body;
	if('name' in body){
		var data = {"name": body['name']};
		app.db.collection("divisions").insertOne(mongoSanitize.sanitize(data), function(err, insertRes){
			if(err) throw err;
			res.send("Success");
		});
	}
});

router.get('/clubs', function(req, res, next){
	res.send("List of clubs in district");
});

router.post('/clubs/create', function(req, res, next){
	var body = req.body;
	var errors = {};

	utils.checkIn(body, ['name', 'divisionId'], function(elem, res){
		if(!res){
			errors["elem"] = "Required";
		}
	});

	if(Object.keys(errors).length == 0){
		var data = {
			"name": body['name'],
			"division_id": ObjectId(body['divisionId']),
			"members": [],
			"admin":{
				"advisor": {
					"faculty": null,
					"kiwanis": null
				},
				"executive": {
					"president": null,
					"avp": null,
					"svp": null,
					"secretary": null,
					"treasurer": null 
				},
				"appointed": {}
			},
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

		app.db.collection("clubs").insertOne(mongoSanitize.sanitize(data), function(err, res){
			if(err) throw err;
			res.send({success: true, auth: true});
		});
	}else{
		res.send({success: false, auth: true, error: errors});
	}
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

function createMRF(clubId, year, month, callback = function(){}){
	var data = {
		club_id: ObjectId(clubId),
		year: year,
		month: month,
		status: 0,
		submissionTime: null,
		updates: {
			duesPaid: null,
			newDuesPaid: null
		},
		goals: [],
		meetings: [
			{
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttendance:{
					faculty: null,
					kiwanis: null
				}
			},

			{
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttendance:{
					faculty: null,
					kiwanis: null
				}
			},

			{
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttendance:{
					faculty: null,
					kiwanis: null
				}
			},

			{
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttended:{
					faculty: null,
					kiwanis: null
				}
			},

			{
				members: null,
				nonHomeMembers: null,
				kiwanis: null,
				guests: null,
				advisorAttendance:{
					faculty: null,
					kiwanis: null
				}
			}
		],

		dcm:{
			date: null,
			presidentAttended: null,
			members: null,
			nextDcmDate: null
		},

		feedback:{
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

		kfamReport:{
			completed: null
		}
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
 