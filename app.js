require('dotenv').config();
var express               = require("express"),
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

const fs = require("fs");
const aws = require("aws-sdk");
    
var commentRoutes = require("./routes/commentRoutes.js"),
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
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

app.get("/movie", (req,res) => {
	
	(async function(){
		try{
			aws.config.setPromisesDependency();
			aws.config.update({
				accessKeyId: process.env.aws_access_key_id,
				secretAccessKey: process.env.aws_secret_access_key,
				region: 'eu-west-2'
			});
			
			const s3 = new aws.S3();
			var fileVideo = fs.createWriteStream('./public/video/studiari.mp4');
			var file = fs.createWriteStream('./public/subs/subtitles.vtt');
			var fileEng = fs.createWriteStream('./public/subs/eng.txt');
			var fileEsp = fs.createWriteStream('./public/subs/esp.txt');
			s3.getObject({
				Bucket: 'studiari',
				Key: 'subn.vtt'
			}, getEng).createReadStream().pipe(file);
			
			
			function getEng(){
				s3.getObject({
			      Bucket: 'studiari',
			      Key: 'eng.txt'
			    }, getEsp).createReadStream().pipe(fileEng);
			}
			
			function getEsp(){
				s3.getObject({
				Bucket: 'studiari',
				Key: 'esp.txt'
			    }, mergeAndRedirect).createReadStream().pipe(fileEsp);
			}
			
			function mergeAndRedirect(){

		    var eng,esp;
			var result=[];
			fs.readFile("./public/subs/eng.txt", "utf-8", (err, data) => {
				if (err) { console.log(err) }
				eng = data.toString().replace(/\r/g,"").split("\n");
				getEsp();
			});	

			function getEsp() {
				fs.readFile("./public/subs/esp.txt", "utf-8", (err, data) => {
				if (err) { console.log(err) }
				esp = data.toString().replace(/\r/g,"").split("\n");
				getRes();
			});
			}

			function getRes() {
				if(eng != undefined){
				for(var i=0; i<eng.length; i++){
					var obj = {en: eng[i], es: esp[i]};
					result.push(obj);
				}
				console.log(result);
				res.render("movie",{res: result});
				}
			}
	        }	
			
		}catch(e){
			console.log("error", e);
		}
	})();
	
});

app.get('/cancel', (req, res) => res.send('Cancelled'));


app.listen(port, function(){
    console.log("SERVER STARTED");
});