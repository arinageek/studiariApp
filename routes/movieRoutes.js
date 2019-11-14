var express = require("express");
var router = express.Router();
var Movie = require("../models/movie.js");
var methodOverride = require("method-override");
var expressSanitizer = require("express-sanitizer");
var bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({extended: true}));
router.use(methodOverride("_method"));
router.use(expressSanitizer());

router.get("/movies", function(req, res){
    Movie.find({}, function(err,movies){
        if(err){
            console.log(err);
        }else{
            res.render("movies", {movies: movies});
        }
    });
});

router.get("/movies/new",isAdmin, function(req,res){
    res.render("newmovie");
});

router.post("/movies",isAdmin, function(req, res){
    Movie.create(req.body.movie, function(err, newMovie){
        if(err){
            res.render("newmovie");
        }else{
            res.redirect("/movies");
        }
    });
});


router.get("/movies/:id", function(req,res){
    Movie.findById(req.params.id).exec(function(err,foundMovie){
		if(err){
            res.redirect("/movies");
        }else{
            res.render("showmovie", {movie: foundMovie});
        }
         });
});

// router.get("/blogs/:id/edit", isAdmin, function(req, res){
//     Blog.findById(req.params.id, function(err,foundBlog){
//         if(err){
//             res.redirect("/blogs");
//         }else{
//             res.render("edit", {blog: foundBlog});
//         }
//     });
    
// });

// router.put("/blogs/:id",isAdmin, function(req,res){
//     Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
//         if(err){
//             res.redirect("/blogs");
//         }else{
//             res.redirect("/blogs/" + req.params.id);
//         }
//     });
// });

// router.delete("/blogs/:id",isAdmin, function(req,res){
//     Blog.findByIdAndRemove(req.params.id, function(err){
//         if(err){
//             res.redirect("/blogs");
//         }else{
//             res.redirect("/blogs");
//         }
        
//     });
// });

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/register");
}
function isAdmin(req,res,next){
	if(req.isAuthenticated() && req.user.isAdmin){
		return next();
	}
	res.redirect("/blogs");
}
module.exports = router;


