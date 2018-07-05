var express = require('express');
var router = express.Router();
var app;

/* GET users listing. */
router.get('/', function(req, res, next) {
	app = req.app;
  	res.send('respond with a resource ');
});

function test(){
}

module.exports = router;
