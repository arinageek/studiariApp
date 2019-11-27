var express= require("express");
var bodyParser = require("body-parser");
var router = express.Router({mergeParams: true});
var Blog = require("../models/blog.js");
var Season = require("../models/season.js");
var Episode = require("../models/episode.js");
var methodOverride = require("method-override");

router.use(bodyParser.urlencoded({extended: true}));
router.use(methodOverride("_method"));
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

router.get("/episodes/:episodeId/edit", isAdmin, function(req,res){
	Season.findById(req.params.id, function(err, season){
		if(err){
			console.log("Could not find the season!");
			res.redirect("/blogs");
		}else{
			Episode.findById(req.params.episodeId, function(err, episode){
			if(err){
				console.log("Could not find the episode!");
				res.redirect("/blogs");
			}
			res.render("editEpisode", {season: season, episode: episode});
		});
		}
	});
	
});

router.put("/episodes/:episodeId", isAdmin, function(req,res){
	 Episode.findByIdAndUpdate(req.params.episodeId, req.body.episode, function(err, updatedEpisode){
		 if(err){
			 console.log(err);
			 console.log("Can not update the episode!");
		 }
		 res.redirect("/blogs");
    });
});

function isAdmin(req,res,next){
	if(req.isAuthenticated() && req.user.isAdmin){
		return next();
	}
	res.redirect("/blogs");
}

module.exports = router;