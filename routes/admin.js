var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var utils;

router.all('*', function(req, res, next){
	//if(req.session.userId == null){
		//res.redirect('/signin');
	//}else{
		app = req.app;
		utils = require('mrf-utils')(app);
		next();			
	//}
});

router.get('/', function(req, res, next) {
  	res.send('Show options. View divisions/options');
});

router.get('/divisions', function(req, res, next){
	res.send("Show list of divisions");
});

router.get('/divisions/create', function(req, res, next){
	res.send("Show new division form");
});

router.post('/divisions/create', function(req, res, next){
	var body = req.body;
	if('name' in body){
		var data = {"name": body['name'], "clubs": []};
		app.db.collection("divisions").insertOne(mongoSanitize.sanitize(data), function(err, insertRes){
			if(err) throw err;
			res.send("Success");
		});
	}
});

router.get('/clubs', function(req, res, next){
	res.send("List of clubs in district");
});

router.get('/clubs/create', function(req, res, next){
	res.send("Club creation form");
});

router.post('/clubs/create', function(req, res, next){
	var body = req.body;
	if(utils.allIn(body, ['name', 'divisionId'])){
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
			"mrfs": [],
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
		utils.createNew("clubs", data, "divisions", body['divisionId'], function(err, success){
			if(err) throw err;
			if(success){
				res.redirect("/clubs");
			}else{
				res.send("Invalid Division");
			}
		});
	}
});

router.get('/tags/create', function(req, res, next){
	res.send("Show tag creation form");
});

router.post('/tags/create', function(req, res, next){
	var body = req.body;
	if(utils.allIn(body, ['name', 'abbrev'])){
		var data = {"name": name, "abbrev": abbrev};
		app.db.collection("tags").insertOne(mongoSanitize.sanitize(obj), function(err, insertRes){
			if(err) throw err;
			if(insertRes.insertedCount > 0){
				res.redirect("/tags");
			}else{
				res.send("Error");
			}
		});	
	}
});

function createMRF(year, month, clubId, callback = function(){}){
	var data = {
		"year": year,
		"month": month,
		"clubId": ObjectId(clubId),
		"status": 0,
		"submissionTime": null,
		"updates": {
			"duesPaid": null,
			"newDuesPaid": null
		},
		"goals": [],
		"meetings": {
			"1":{
				"members": null,
				"nonHomeMembers": null,
				"kiwanis": null,
				"guests": null,
				"advisorAttendance":{
					"faculty": null,
					"kiwanis": null
				}
			},

			"2":{
				"members": null,
				"nonHomeMembers": null,
				"kiwanis": null,
				"guests": null,
				"advisorAttendance":{
					"faculty": null,
					"kiwanis": null
				}
			},

			"3":{
				"members": null,
				"nonHomeMembers": null,
				"kiwanis": null,
				"guests": null,
				"advisorAttendance":{
					"faculty": null,
					"kiwanis": null
				}
			},

			"4":{
				"members": null,
				"nonHomeMembers": null,
				"kiwanis": null,
				"guests": null,
				"advisorAttended":{
					"faculty": null,
					"kiwanis": null
				}
			},

			"5":{
				"members": null,
				"nonHomeMembers": null,
				"kiwanis": null,
				"guests": null,
				"advisorAttendance":{
					"faculty": null,
					"kiwanis": null
				}
			}
		},

		"dcm":{
			"date": null,
			"presidentAttended": null,
			"members": null,
			"nextDcmDate": null
		},

		"feedback":{
			"ltg":{
				"message": null,
				"contacted":{
					"visit": null,
					"phone": null,
					"email": null,
					"newsletter": null,
					"other": null
				}
			},
			"dboard": null
		},

		"kfamReport":{
			"completed": null
		},

		"events": []
	};

	utils.createNew("mrfs", data, "clubs", clubId);
}


module.exports = router;
 