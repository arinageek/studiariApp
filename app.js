require('dotenv').config();
var express               = require("express"),
    methodOverride        = require("method-override"),
    bodyParser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    expressSanitizer      = require("express-sanitizer"),
    Blog                  = require("./models/blog.js"),
    User                  = require("./models/user"),
    Season               = require("./models/season.js"),
	Episode               = require("./models/episode.js"),
    flash                 = require("connect-flash"),
    mongoose              = require("mongoose");

const fs = require("fs");
const aws = require("aws-sdk");
    
var seasonRoutes = require("./routes/seasonRoutes.js"),
	episodeRoutes = require("./routes/episodeRoutes.js"),
    blogRoutes = require("./routes/blogRoutes.js"),
    authRoutes = require("./routes/authRoutes.js");

const app = require("express")();
const port = process.env.PORT || 3000;
const ip = process.env.IP || "127.0.0.1";

const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;
const stripe = require("stripe")(keySecret);


app.use(require("express-session")({
    secret: "This is a study blog!",
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


app.use("/blogs/:id",seasonRoutes);
app.use("/seasons/:id",episodeRoutes);
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
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

app.get("/profile",isLoggedIn, (req,res) => {
	res.render("profile");
});

app.get("/movie/:movieId/:seasonId/:episodeId",pay, (req,res) => {
	
	(async function(){
		try{
			aws.config.setPromisesDependency();
			aws.config.update({
				accessKeyId: process.env.aws_access_key_id,
				secretAccessKey: process.env.aws_secret_access_key,
				region: 'eu-west-2'
			});
			
			const s3 = new aws.S3();
			var file = fs.createWriteStream('./public/subs/subtitles.vtt');
			var fileEng = fs.createWriteStream('./public/subs/eng.txt');
			var fileEsp = fs.createWriteStream('./public/subs/esp.txt');
			var fileRus = fs.createWriteStream('./public/subs/rus.txt');

			function getEngFile(){
				return new Promise(resolve => {
					fs.readFile("./public/subs/eng.txt", "utf-8", (err, data) => {
						if (err) console.log(err); 
						
						var eng = [];
						eng = data.toString().replace(/\r/g,"").split("\n");
						resolve(eng);
					
					});	
				});
			}
			
			function getEspFile(){
				return new Promise(resolve => {
					fs.readFile("./public/subs/esp.txt", "utf-8", (err, data) => {
							if (err) console.log(err);
							
							var esp = [];
							esp = data.toString().replace(/\r/g,"").split("\n"); 
							resolve(esp);						
					});
				});
			}
			
			function getRusFile(){
				return new Promise(resolve => {
					fs.readFile("./public/subs/rus.txt", "utf-8", (err, data) => {
							if (err) console.log(err);
							
							var rus = [];
							rus = data.toString().replace(/\r/g,"").split("\n"); 
							resolve(rus);						
					});
				});
			}
			
			function getSubs(foundEpisode){
				return new Promise(resolve => {
					s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.subtitles
					}, resolve(1)).createReadStream().pipe(file);
				});
			}
			
			function getEng(foundEpisode){
				return new Promise(resolve => {
					var stream = s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.englishSub
					}).createReadStream();
					stream.pipe(fileEng);
					stream.on("end", () => {
						resolve(1);
					});
				});
			}
			
			function getEsp(foundEpisode){
				return new Promise(resolve => {
					var stream = s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.spanishSub
					}).createReadStream();
					stream.pipe(fileEsp);
					stream.on('end', () => {
					  resolve(1);
					});
				});
			}
			
			function getRus(foundEpisode){
				return new Promise(resolve => {
					var stream = s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.russianSub
					}).createReadStream();
					stream.pipe(fileRus);
					stream.on('end', () => {
					  resolve(1);
					});
				});
			}
			
			function getRes(eng,esp,rus){
				return new Promise(resolve => {
					var result = [];
						for(var i=0; i<eng.length; i++){
							var obj = {en: eng[i], es: esp[i], ru: rus[i]};
							result.push(obj);
						}
						console.log(result);
						resolve(result);
				});
			}
			Blog.findById(req.params.movieId, function(err, foundMovie){
			
			Episode.findById(req.params.episodeId, function(err, foundEpisode){
				if(err){
					console.log("Error in finding the episode!");
					console.log(err);
				}else{
					
					async function work(){
						
						var eng,esp;
						var result = [];
						
					
						var getSubsResolved = await getSubs(foundEpisode);
						var resolvedEng = await getEng(foundEpisode);
						var resolvedEsp = await getEsp(foundEpisode);
						var resolvedRus = await getRus(foundEpisode);
						
						var eng = await getEngFile();
						var esp = await getEspFile();
						var rus = await getRusFile();
						var result = await getRes(eng,esp, rus);
						
						res.render("movie",{res: result, episode: foundEpisode, movie: foundMovie});
	
					}
					
					work();
					
				}	
				
			});	
				
			});
		}catch(e){
			console.log("error", e);
		}
	})();
	
});

app.put('/changeLanguage', isLoggedIn, (req, res) => {
	var newvalues = { $set: { language: req.body.language } };
	User.findByIdAndUpdate(req.user._id, newvalues, function(err, updatedUser){
        if(err){
            res.redirect("/blogs");
        }else{
            res.redirect("/profile");
        }
    });
});

function pay(req,res,next){
	var d = new Date();
	if(req.isAuthenticated() && (req.user.isAdmin || (d.getTime() < req.user.expirationDate.getTime())) ){
		return next();
	}
	res.redirect("/profile");
}

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/register");
}

app.listen(port, function(){
    console.log("SERVER STARTED");
});