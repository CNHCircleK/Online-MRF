var express = require('express');
var router = express.Router();
var app;
var mongo = require('mongodb');

router.all('*', function(req, res, next){
	app = req.app;
	next();
});

module.exports = router;