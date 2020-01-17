var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var UserSchema = new mongoose.Schema({
   username: {type: String, unique:true, required: true},
   registerPasswordToken: String,
   confirmed: {type: Boolean, default: false},
   registerPasswordExpires: Date,
   resetPasswordToken: String,
   resetPasswordExpires: Date,
   password: String,
   language: {type: String, default: "en"},
   isAdmin: {type: Boolean, default: false},
   expirationDate: Date
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);