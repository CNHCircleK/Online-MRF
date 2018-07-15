var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var utils;

router.all('*', function(req, res, next){
	//if(req.session.userId == null){
		//res.redirect('signin');
//	}else{
		app = req.app;
		utils = require('mrf-utils')(app);
		next();			
//	}
});

router.all("/", function(req, res, next){
	res.redirect("/");
})

function checkClubId(req, res, next){
	if(req.params.clubId != null && ObjectId.isValid(req.params.clubId)){
		app.db.collection("clubs").findOne({"_id": ObjectId(req.params.clubId)}, function(err, clubRes){
			if(err) throw err;
			if(clubRes != null){
				// TODO: Check if access level matches
				res.locals.clubData = clubRes;
				next();
			}else{
				res.send("Not allowed to view content");
			}			
		});
	}else{
		res.send("Not allowed to view content");
	}

}

router.all("/:clubId", checkClubId);
router.all("/:clubId/*", checkClubId);

router.get("/:clubId", function(req, res, next){
	res.send("Show options");
});

router.get("/:clubId/members", function(req, res, next){
	res.send("Show list of members");
});

router.get("/:clubId/goals", function(req, res, next){
	res.send("Show list of goals");
});

router.post("/:clubId/goals", function(req, res, next){
		
});

router.get("/:clubId/mrfs", function(req, res, next){
	res.send("Show list of mrfs");
});

module.exports = router;