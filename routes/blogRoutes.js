var express = require("express");
var router = express.Router();
var Blog = require("../models/blog.js");
var Season = require("../models/season.js");
var methodOverride = require("method-override");
var expressSanitizer = require("express-sanitizer");
var bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({extended: true}));
router.use(methodOverride("_method"));
router.use(expressSanitizer());
router.get("/", function(req, res){
    res.redirect("/blogs");
});

router.get("/blogs", function(req, res){
    Blog.find({}, function(err,blogs){
        if(err){
            console.log(err);
        }else{
            res.render("index", {blogs: blogs});
        }
    });
});

router.get("/blogs/new",isAdmin, function(req,res){
    res.render("new");
});

router.post("/blogs",isAdmin, function(req, res){
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            res.render("new");
        }else{
            res.redirect("/blogs");
        }
    });
});


router.get("/blogs/:id", function(req,res){
    Blog.findById(req.params.id).populate("seasons").exec(function(err,foundBlog){
		Season.populate(foundBlog.seasons, {path: 'episodes'}, function (err, doc) {
			if(err){
            res.redirect("/blogs");
        }else{
            res.render("show", {blog: foundBlog});
        }
         });
        
    });
});

router.get("/blogs/:id/edit", isAdmin, function(req, res){
    Blog.findById(req.params.id, function(err,foundBlog){
        if(err){
            res.redirect("/blogs");
        }else{
            res.render("edit", {blog: foundBlog});
        }
    });
    
});

router.put("/blogs/:id",isAdmin, function(req,res){
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
        if(err){
            res.redirect("/blogs");
        }else{
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

router.delete("/blogs/:id",isAdmin, function(req,res){
    Blog.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/blogs");
        }else{
            res.redirect("/blogs");
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


