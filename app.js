var express               = require("express"),
    app                   = express(),
    methodOverride        = require("method-override"),
    bodyParser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    expressSanitizer      = require("express-sanitizer"),
    Blog                  = require("./models/blog.js"),
    Comment               = require("./models/comment.js"),
    User                  = require("./models/user"),
    Comment               = require("./models/comment"),
    flash                 = require("connect-flash"),
    mongoose              = require("mongoose");
    
var commentRoutes = require("./routes/commentRoutes.js"),
    blogRoutes = require("./routes/blogRoutes.js"),
    authRoutes = require("./routes/authRoutes.js");

const port = process.env.PORT || 3000;
const ip = process.env.IP || "127.0.0.1";

app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

    
app.use("/blogs/:id",commentRoutes);
app.use(blogRoutes);
app.use(authRoutes);
mongoose.connect("mongodb+srv://arina:pass435@cluster0-dagh6.mongodb.net/test?retryWrites=true&w=majority", {
	useNewUrlParser: true,
	useCreateIndex: true
}).then(() =>{
	console.log("Connected to DB");
}).catch(err => {
	console.log("Error: ", err.message);
});


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));




app.listen(port, function(){
    console.log("SERVER STARTED");
});