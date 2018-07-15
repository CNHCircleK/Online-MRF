var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var utils;

router.all('*', function(req, res, next){
	if(req.session.userId == null){
		res.redirect('signin');
	}else{
		app = req.app;
		utils = require('mrf-utils')(app);
		next();			
	}
});

function checkMrfId(req, res, next){
	if(req.params.mrfId != null && ObjectId.isValid(req.params.mrfId)){
		app.db.collection("mrfs").findOne({"_id": ObjectId(req.params.mrfId)}, function(err, mrfRes){
			if(err) throw err;
			if(mrfRes != null){
				// TODO: Check if access level matches
				res.locals.mrfData = mrfRes;
				next();
			}else{
				res.send("Not allowed to view content");
			}			
		});
	}else{
		res.send("Not allowed to view content");
	}

}

router.all("/:mrfId", checkMrfId);
router.all("/:mrfId/*", checkMrfId);

router.get("/:mrfId", function(req, res, next){
	res.send("Show mrf info");
});

module.exports = router;