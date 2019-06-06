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
		fundraising: [],
		events: []
	}
}

module.exports = function(newApp){
	app = newApp;
	utils = require('mrf-utils')(app);
	return {
		router: router,
		mrfDefaults: mrfDefaults
	};
}