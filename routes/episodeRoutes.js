var express= require("express");
var bodyParser = require("body-parser");
var router = express.Router({mergeParams: true});
var Blog = require("../models/blog.js");
var Season = require("../models/season.js");
var Episode = require("../models/episode.js");

router.use(bodyParser.urlencoded({extended: true}));

router.get("/newepisode", isAdmin, function(req, res){
    Season.findById(req.params.id, function(err, foundSeason){
        if(err){
            console.log(err);
        }else{
            res.render("newepisode", {season: foundSeason});
        }
    });
});

router.post("/newepisode", isAdmin, function(req, res){
   Season.findById(req.params.id, function(err, foundSeason){
       if(err){
           console.log(err);
           res.redirect("/blogs");
       } else {
        Episode.create(req.body.episode, function(err, episode){
           if(err){
               console.log(err);
           } else {
               foundSeason.episodes.push(episode);
               foundSeason.save();
               res.redirect("/blogs");
           }
        });
       }
   });
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/register");
}

function pay(req,res,next){
	if(req.isAuthenticated() && (req.user.isAdmin || req.user.paid) ){
		return next();
	}
	res.redirect("/blogs");
}

function isAdmin(req,res,next){
	if(req.isAuthenticated() && req.user.isAdmin){
		return next();
	}
	res.redirect("/blogs");
}

module.exports = router;