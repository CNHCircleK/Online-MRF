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

router.get('/', function(req, res, next){
	res.send("Events Dashboard");
});

router.get('/new', function(req, res, next){
	res.send("Event Creation");
});

router.post('/new', function(req, res, next){
	var body = req.body;
	if(utils.allIn(body, ["name", "chairName", "startTime", "endTime", "tags", "attendees", "serviceHours", "leadershipHours", "fellowshipHours", "overrideHours", "fundraised"])){
		utils.createNew("events", {
			"status": 0,
			"creator": null,
			"name": null,
			"chair":{
				"_id": null,
				"name": null
			},
			"time":{
				"start": null,
				"end": null
			},
			"tags": [],
			"attendees": [],
			"hoursPerAttendee": {
				"service": null,
				"leadership": null,
				"fellowship": null
			},
			"overrideHours": [],
			"fundraised": null
		}, "mrfs", mrfId)
	}
	
});

function checkEventId(req, res, next){
	if(req.params.eventId != null && ObjectId.isValid(req.params.eventId)){
		app.db.collection("events").findOne({"_id": ObjectId(req.params.eventId)}, function(err, eventRes){
			if(err) throw err;
			if(eventRes != null){
				// TODO: Check if access level matches
				res.locals.eventData = eventRes;
				next();
			}else{
				res.send("Not allowed to view content");
			}			
		});
	}else{
		res.send("Not allowed to view content");
	}

}

router.all("/:eventId", checkEventId);
router.all("/:eventId/*", checkEventId);

router.get('/:eventId', function(req, res, next){
	res.send("Show event details");
});

router.get('/:eventId/edit', function(req, res, next){
	res.send("Edit Form");
});

router.post('/:eventId/edit', function(req, res, next){

});

module.exports = router;