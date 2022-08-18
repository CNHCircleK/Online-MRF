var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var mongoSanitize = require('express-mongo-sanitize');

var checkAuth = require("../auth").checkAuth;
var utils;

function getTag(tagId, projection, callback){
	if(!ObjectId.isValid(tagId)){
		callback(null, null);
		return;
	}
	var query = {_id: ObjectId(tagId)};
	app.db.collection("tags").findOne(query, {projection: projection}, callback);	
}

function getTags(tagIds, projection, callback){
	var tags = [];
	tagIds.forEach(function(tagId){
		if(ObjectId.isValid(tagId)){
			tags.push({"_id": ObjectId(tagId)});
		}
	});
	if(tags.length > 0){
		var query = {$or: tags};
		app.db.collection("tags").find(query, {projection: projection}).toArray(function(err, tags){
			if(err) throw err;
			callback(tags);
		});		
	}else{
		callback(null);
	}
}

router.get("/", checkAuth(function(req, res, auth){
	auth(true);
}),function(req, res, next){
	var tagProjection = {abbrev: 1, name: 1, description: 1}
	var query = {active: true};

	var body = req.query;
	if("inactive" in body && utils.toBool(body.inactive) === true){
		query = {};
		tagProjection.active = 1;
	}

	app.db.collection("tags").find(query, {projection: tagProjection}).toArray(function(err, tags){
		if(err) throw err;
		res.send({success: true, auth: true, result: tags});
	});
});

router.post("/", checkAuth(function(req, res, auth){
	auth(res.locals.user.access.district > 0);
}), function(req, res, next){
	var body = req.body;
	var errors = {};
	utils.checkIn(body, ["name", "abbrev", "description"], function(elem, res){
		if(!res){
			errors[elem] = "Required";
		}
	});

	if(Object.keys(errors).length == 0){
		var data = {
			name: String(body.name),
			abbrev: String(body.abbrev).toUpperCase(),
			description: String(body.description),
			active: true
		};
		data = mongoSanitize.sanitize(data);

		app.db.collection("tags").insertOne(data, function(err, insertRes){
			if(err) throw err;
			res.send({success: true, auth: true, result: data._id});
		});
	}else{
		res.send({success: false, auth: true, error: errors});
	}
});

router.patch("/:tagId", checkAuth(function(req, res, auth){
	if(res.locals.user.access.district > 0){
		getTag(req.params.tagId, {_id: 1}, function(err, tag){
			if(tag == null){
				auth(false);
				return;
			}

			res.locals.tag = tag;
			auth(true);
		})
	}else{
		auth(false);
	}
}),function(req, res, next){
	var body = req.body;
	var data = {};
	var warnings = {};

	if("name" in body){
		data.name = String(body.name);
	}

	if("abbrev" in body){
		data.abbrev = String(body.abbrev).toUpperCase();
	}

	if("description" in body){
		data.description= String(body.description);
	}
	
	if("active" in body){
		var active = utils.toBool(body.active);
		if(active != null){
			data.active = active;
		}else{
			warnings.active = "Needs to be boolean";
		}
	}

	if(Object.keys(data).length > 0){
		var tagQuery = {_id: res.locals.tag._id};
		app.db.collection("tags").updateOne(tagQuery, {$set: mongoSanitize.sanitize(data)}, function(err, updateRes){
			if(err) throw err;
			if(Object.keys(warnings).length == 0){
				res.send({success: true, auth: true});
			}else{
				res.send({success: true, auth: true, warning: warnings});
			}
		});
	}else{
		if(Object.keys(warnings).length == 0){
			res.send({success: true, auth: true});
		}else{
			res.send({success: true, auth: true, warning: warnings});
		}
	}
});

module.exports = function(newApp){
	app = newApp;
	utils = require('mrf-utils')(app);
	return {
		router: router,
		getTag: getTag,
		getTags: getTags
	};
}