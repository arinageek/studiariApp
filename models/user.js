var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var UserSchema = new mongoose.Schema({
   email: {type: String, unique: true, required: true},
   username: String,
   resetPasswordToken: String,
   resetPasswordExpires: Date,
   password: String,
   isAdmin: {type: Boolean, default: false},
   paid: {type: Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);