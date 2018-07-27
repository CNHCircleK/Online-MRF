var config = {};

config.mongoURL = "mongodb://127.0.0.1:27017";

// CHANGE TOKEN SECRET IN PRODUCTION
config.tokenSecret = "TOKEN_SECRET" in process.env ? process.env['TOKEN_SECRET'] : "bd5432a6a2ab96f9471c2f9c1e50ab243c0178add068f1cc44112f215fb3f738b36daeae58d0bd8c45495f18c0e34d12dbd2da797c459dde02b0b7acd2e9e987";
config.bcryptSaltRounds = 10;

module.exports = config;