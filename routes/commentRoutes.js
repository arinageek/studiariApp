var express= require("express");
var bodyParser = require("body-parser");
var router = express.Router({mergeParams: true});
var Blog = require("../models/blog.js");
var Comment = require("../models/comment.js");

router.use(bodyParser.urlencoded({extended: true}));
router.get("/newcom", function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            console.log(err);
        }else{
            res.render("newcom", {blog: foundBlog});
        }
    });
});

router.post("/newcom", function(req, res){
   //lookup blog using ID
   Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
           console.log(err);
           res.redirect("/blogs");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               foundBlog.comments.push(comment);
               foundBlog.save();
               res.redirect("/blogs/" + foundBlog._id);
           }
        });
       }
   });
});


module.exports = router;