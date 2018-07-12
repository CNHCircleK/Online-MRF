var express = require('express');
var router = express.Router();
var app;

var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

var bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

router.all('*', function(req, res, next){
	app = req.app;
	next();
});

router.get('/', function(req, res, next){
	signup("5b4690cb33ddc958eb898e7353bc350fcff9f577bc24a1c681c3c78ba99f7c5dd27d0027", "test@gmail.com", "testUser", "testPass", function(res){
		console.log(res);
	});
	res.send("Send signup page");
});

function fieldsPresent(json, fields){
	var hasAll = true;
	fields.forEach(function(elem){
		if(!(elem in json)){
			hasAll = false;
			return false;
		} 
	});

	return hasAll;
}

router.post('/', function(req, res, next){
	var body = req.body;
	if(fieldsPresent(body, ['registration-code', 'email', 'username', 'password'])){
		signup(body['registration-code'], body['email'], body['username'], body['password']);
	}

	res.send("Done");
});

function signup(code, email, username, password, callback = function(){}){
	var registrationId = code.substring(0, 24);
	var secret = code.substring(24);

	if(!ObjectId.isValid(registrationId)){
		callback(false);
		return;
	}

	var registrationQuery = {"registration._id": ObjectId(registrationId), "username": {$exists: false}}
	app.db.collection("members").findOne(registrationQuery, function(err, res){
		if(err) throw err;
		var user = res;
		bcrypt.compare(secret, user.registration.secret, function(err, matched){
			if(err) throw err;
			if(matched){
				bcrypt.hash(password, SALT_ROUNDS, function(err, hash){
					if(err) throw err;
					var setData = {$set:{
						"email": email,
						"username": username,
						"password": hash
					}};

					app.db.collection("members").updateOne(registrationQuery, setData, function(err, res){
						if(err) throw err;
						callback(true);
					});
				});
			}else{
				var removeCode = {$unset: {registration: 1}};
				app.db.collection("members").updateOne(registrationQuery, removeCode, function(err, res){
					if(err) throw err;
					callback(false);
				})
			}
		});
	});
}

module.exports = router;