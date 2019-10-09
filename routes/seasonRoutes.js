var express= require("express");
var bodyParser = require("body-parser");
var router = express.Router({mergeParams: true});
var Blog = require("../models/blog.js");
var Season = require("../models/season.js");

router.use(bodyParser.urlencoded({extended: true}));

router.get("/newseason",isAdmin, function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            console.log(err);
        }else{
            res.render("newseason", {blog: foundBlog});
        }
    });
});

router.post("/newseason",isAdmin, function(req, res){
   //lookup blog using ID
   Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
           console.log(err);
           res.redirect("/blogs");
       } else {
        Season.create(req.body.season, function(err, season){
           if(err){
               console.log(err);
           } else {
               foundBlog.seasons.push(season);
               foundBlog.save();
               res.redirect("/blogs/" + foundBlog._id);
           }
        });
       }
   });
});

function isAdmin(req,res,next){
	if(req.isAuthenticated() && req.user.isAdmin){
		return next();
	}
	res.redirect("/blogs");
}

module.exports = router;