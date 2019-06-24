var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user.js");
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({extended: true}));

router.get("/register", function(req,res){
    res.render("register");
});

router.post("/register", function(req,res){
    User.register(new User({username: req.body.username}), req.body.password, function(err,user){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, function(){
                req.flash("success", "You are now registered!");
                res.redirect("/blogs");
            });
        }
    });
});

router.get("/login", function(req,res){
    res.render("login");
});

router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/blogs",
        failureRedirect: "/login"
    }), function(req, res){
});

router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "You are now logged out!");
   res.redirect("/blogs");
});

module.exports = router;