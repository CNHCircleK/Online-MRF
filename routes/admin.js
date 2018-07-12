var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var mongoSanitize = require('express-mongo-sanitize');

var crypto = require('crypto');

var bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

router.all('*', function(req, res, next){
	app = req.app;
	next();
});

router.get('/', function(req, res, next) {
	generateRegistrationCode("5b4681d2b7cdfe0e673f486e", [], "5b3efbf307f2a3084adc2426", function(success){
		console.log(success);
	});
  	res.send('Finished');
});

function createDivision(name){
	var obj = {"name": name, "clubs": []}
	app.db.collection("divisions").insertOne(mongoSanitize.sanitize(obj));
	return true;
}

function createNew(collection, data, parentCollection, parentId, callback = function(){}){
	if(!ObjectId.isValid(parentId)){
		callback(false);
		return;
	}

	var newId = ObjectId();
	var query = {_id: ObjectId(parentId)};
	
	var obj = {};
	obj[collection] = newId;
	var changes = {$push: obj};

	app.db.collection(parentCollection).updateOne(query, changes, function(err, res){
		if(err) throw err;
		if(res.matchedCount > 0){
			data._id = newId;
			app.db.collection(collection).insertOne(mongoSanitize.sanitize(data));
		}

		callback(res.matchedCount > 0);
	});
}

function createClub(school, divisionId, callback = function(){}){
	return createNew(
		"clubs", 
		{
			"school": school, 
			"members": [], 
			"mrfs": []
		}, 
		"divisions", 
		divisionId,
		callback);
}

function createMember(firstName, lastName, clubId, callback = function(){}){
	return createNew(
		"members", 
		{
			"name": {
				"first": firstName, 
				"last": lastName
			}
		}, 
		"clubs", 
		clubId,
		callback);
}  

function createMRF(year, month, clubId, callback = function(){}){
	return createNew(
		"mrfs",
		{
			"year": year,
			"month": month, 
			"status": 0,
			"events": [],
			"submissionTime": null
		},
		"clubs",
		clubId,
		callback)
}

function createEvent(
	name, 
	chairId,
	startTime, 
	endTime, 
	location, 
	tags,
	serviceHours, 
	leadershipHours, 
	fellowshipHours, 
	fundraised,
	mrfId,
	callback = function(){}){

	return createNew(
		"events", 
		{
			"name": name,
			"chair_id": chairId,
			"time":{
				"start": startTime,
				"end": endTime
			},
			"location": location,
			"tags": tags,
			"attendees": [],
			"hoursPerAttendee": {
				"service": serviceHours, 
				"leadership": leadershipHours, 
				"fellowship" : fellowshipHours
			},
			"overrideHours": [],
			"fundraised": fundraised,
			"status": 0
		},
		"mrfs",
		mrfId,
		callback
	);
} 

function createTag(name, abbrev, callback = function(){}){
	var obj = {"name": name, "abbrev": abbrev};
	app.db.collection("tags").insertOne(mongoSanitize.sanitize(obj), function(err, res){
		if(err) throw err;
		callback(res.insertedCount > 0);
	});
}

function generateRegistrationCode(memberId, access, sourceId, callback = function(){}){
	if(!ObjectId.isValid(memberId) || !ObjectId.isValid(sourceId)){
		callback(false);
		return;
	}

	var checkSource = {"_id": ObjectId(sourceId)};
	app.db.collection("members").find(checkSource, function(err, res){
		if(err) throw err;
		if(res != null){
			crypto.randomBytes(24, function(err, buffer) {
				if(err) throw err;
				var codeId = ObjectId();
				var secret = buffer.toString('hex');

				bcrypt.hash(secret, SALT_ROUNDS, function(err, hash){
					if(err) throw err;
					var query = {"_id": ObjectId(memberId), "username": {$exists: false}};

					var expire = new Date();
					expire.setMonth(expire.getMonth() + 1);

					var changes = {$set: {registration: {
						"_id": codeId,
						"secret": hash,
						"source_id": sourceId,
						"access": access,
						"expiration": expire
					}}};

					app.db.collection("members").updateOne(query, changes, function(err, res){
						if(err) throw err;
						if(res.matchedCount > 0){
							callback(codeId + secret);
						}else{
							callback(false);
						}
						
					});
				});
			});
		}else{
			callback(false);
		}
	});
}

module.exports = router;
 