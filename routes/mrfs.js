var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var checkAuth = require("../auth").checkAuth;
var utils;

var moment = require('moment');

function mrfDefaults(clubId, year, month){
	return {
		club_id: ObjectId(clubId),
		year: year,
		month: month,
		status: 0,
		submissionTime: null,
		numDuesPaid: null,
		goals: [],
		meetings:[],
		boardMeetings: [],
		dcm: {
			date: null,
			presidentAttended: null,
			numMembers: null,
			nextDate: null
		},

		communications:{
			ltg: null,
			dboard: null
		},

		kfamReport: null,
		fundraising: []
	}
}

function getMRF(clubId, year, month, projection, callback){
	var query = {year: year, month: month};
	if(Array.isArray(clubId)){
		query.$or = clubId.map(function(clubId){ return {club_id: ObjectId(clubId)} });

		var haveClubId = false;
		if("club_id" in projection && projection.club_id == 1){
			haveClubId = true;
		}else{
			if(Object.keys(projection).length > 0){
				projection["club_id"] = 1;
			}
		}

		app.db.collection("mrfs").find(query, {projection: projection}).toArray(function(mrfErr, mrfs){
			if(mrfErr) throw err;
			if("events" in projection){
				var eventQuery = {
					$or: query.$or,
					status: 2,
					"time.start": {
						$gte: new Date(year, month - 1, 1), 
						$lte: new Date(year, month, 1)
					}
				};
				var eventProjection = {club_id: 1, name: 1, time: 1, tags: 1, totals: 1, labels: 1};

				app.db.collection("events").find(eventQuery, {projection: eventProjection}).toArray(function(err, events){
					if(err) throw err;
					
					var clubToMRF = {};
					mrfs.forEach(function(mrf){
						clubToMRF[String(mrf.club_id)] = mrf;
					});

					clubId.forEach(function(clubIdSingle){
						if(!(clubIdSingle in clubToMRF)){
							var defaultMRF = mrfDefaults(clubIdSingle, year, month);
							if(Object.keys(projection).length > 0){
								Object.keys(defaultMRF).forEach(function(key){
									if(!(key in projection) || projection[key] === 0){
										delete defaultMRF[key];
									}
								});
							}

							clubToMRF[String(clubIdSingle)] = defaultMRF;
							mrfs.push(defaultMRF);
						}

						var clubMRF = clubToMRF[String(clubIdSingle)];

						if(!haveClubId){
							delete clubMRF.club_id;
						}

						if("_id" in clubMRF){
							delete clubMRF._id;
						}
					});

					events.forEach(function(event){
						delete event.club_id;
						clubToMRF[String(event.club_id)].events = event;

					});

					callback(mrfs);
				});	
			}else{
				callback(mrfs);
			}
		});
		
	}else{
		query.club_id = ObjectId(clubId);
		app.db.collection("mrfs").findOne(query, {projection: projection}, function(mrfErr, mrf){
			if(mrfErr) throw err;

			if(mrf == null){
				mrf = mrfDefaults(clubId, year, month);
				if(Object.keys(projection).length > 0){
					Object.keys(mrf).forEach(function(key){
						if(!(key in projection) || projection[key] === 0){
							delete mrf[key];
						}
					});
				}
			}

			if("_id" in mrf){
				delete mrf._id;
			}

			if("events" in projection){
				var eventQuery = {
					club_id: res.locals.club._id,
					status: 2,
					"time.start": {
						$gte: new Date(year, month - 1, 1), 
						$lte: new Date(year, month, 1)
					}
				};
				var eventProjection = {name: 1, time: 1, tags: 1, totals: 1, labels: 1};
				app.db.collection("events").find(eventQuery, {projection: eventProjection}).toArray(function(err, events){
					if(err) throw err;
					mrf.events = events;
					
					callback(mrf);
				});	
			}else{
				callback(mrf);
			}
		});	
	}

}

module.exports = function(newApp){
	app = newApp;
	utils = require('mrf-utils')(app);
	return {
		router: router,
		getMRF: getMRF,
		mrfDefaults: mrfDefaults
	};
}