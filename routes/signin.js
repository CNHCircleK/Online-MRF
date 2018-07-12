var express = require('express');
var router = express.Router();
var app;

var bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

router.all('*', function(req, res, next){
	app = req.app;
	next();
});

router.get('/', function(req, res, next){
	signin(req, "testUser", "testPass", function(res){
		console.log(req.session.userId);
	});
	
	res.send("Send signin page");
});

router.get('/*', function(req, res, next){
	res.send("Ha");
});

function signin(req, name, password, callback = function(){}){
	var findUser = {$or:[{"username": name}, {"email": name}]};
	app.db.collection("members").findOne(findUser, function(err, user){
		if(err) throw err;
		if(user != null){
			bcrypt.compare(password, user.password, function(err, matched){
				if(err) throw err;
				if(matched){
					req.session.userId = user._id;
					callback(true);
				}else{
					callback(false);
				}		
			})
		}
	});
}

module.exports = router;