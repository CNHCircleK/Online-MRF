var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;
var jwt = require('jsonwebtoken');

module.exports = {
	signToken: function(app, member, callback){
		jwt.sign({
			_id: member._id,
			club_id: member.club_id,
			division_id: member.division_id,
			name: member.name.first + " " + member.name.last,
			access: {
				club: member.access.club.level,
				division: member.access.division.level,
				district: member.access.district.level
			}
		}, app.get("config").tokenSecret, {
			expiresIn: '1h'
		}, function(err, token){
			callback(err, token);
		});
	},

	checkAuth: function(requirements){
		return function(req, res, next){
			var token = req.get("Authorization");
			if(token != null){
				token = String(token).split(" ");
				if(token.length < 2){
					res.send({success: false, auth: false});
					return;
				}

				token = token[1];
				jwt.verify(token, req.app.get("config").tokenSecret, function(err, decoded) {
		  			if(err){
		  				res.send({success: false, auth: false});
		  			}else{
		  				decoded._id = ObjectId(decoded._id);
		  				decoded.club_id = ObjectId(decoded.club_id);
		  				decoded.division_id = ObjectId(decoded.division_id);
		  				res.locals.user = decoded;
						
		  				requirements(req, res, function(auth, success = true, error){
		  					if(auth && success){
		  						next();
		  					}else if(auth && !success){
		  						res.send({success: false, auth: true, error: error})
		  					}else{
		  						res.send({success: false, auth: false});
		  					}
		  				});
		  			}
				});
			}else{
				res.send({success: false, auth: false});
			}
		}
	}
};
