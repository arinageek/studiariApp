require('dotenv').config();
var express               = require("express"),
    methodOverride        = require("method-override"),
    bodyParser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    expressSanitizer      = require("express-sanitizer"),
    Blog                  = require("./models/blog.js"),
    User                  = require("./models/user"),
    Season                = require("./models/season.js"),
	Movie                 = require("./models/movie.js"),
	Episode               = require("./models/episode.js"),
    flash                 = require("connect-flash"),
    mongoose              = require("mongoose"),
	session               = require("express-session"),
	nodeMailer            = require("nodemailer"),
	MongoStore            = require('connect-mongo')(session),
	request               = require("request"),
	async                 = require("async");

const cheerio = require('cheerio');
const fs = require("fs");
const aws = require("aws-sdk");

var seasonRoutes = require("./routes/seasonRoutes.js"),
	episodeRoutes = require("./routes/episodeRoutes.js"),
	movieRoutes = require("./routes/movieRoutes.js"),
    blogRoutes = require("./routes/blogRoutes.js"),
    authRoutes = require("./routes/authRoutes.js");

const app = require("express")();
const port = process.env.PORT || 3000;
const ip = process.env.IP || "127.0.0.1";

const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;
const stripe = require("stripe")(keySecret);

app.use(session({
    secret: "This is a study blog!",
    resave: false,
    saveUninitialized: false,
	store: new MongoStore({mongooseConnection: mongoose.connection,
						  ttl: 1 * 5 * 60 * 60})
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
app.use(movieRoutes);

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

aws.config.setPromisesDependency();
			aws.config.update({
				accessKeyId: "AKIAT2GZ6CC2MBQ2EDG3",
				secretAccessKey: "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",
				region: 'eu-west-2',
				http_open_timeout: 10,
				http_read_timeout: 10
			});
	
app.get("/warning1", isLoggedIn, (req,res) =>{
	res.render("warning1");
});
app.get("/warning2", isLoggedIn, (req,res) =>{
	res.render("warning2");
});
app.get("/warning3", isLoggedIn, (req,res) =>{
	res.render("warning3");
});

app.post("/success", async (req,res) =>{
	console.log(req);
	var d = new Date();
	if(req.body.withdraw_amount == "299.00"){
		d.setDate(d.getDate()+30);
	}else if(req.body.withdraw_amount == "750.00"){
		d.setDate(d.getDate()+90);
	}else{
		d.setDate(d.getDate()+180);
	}
	
	try{
		const user = await User.findOneAndUpdate({ username: req.body.email }, { $set: { expirationDate: d }} );
		res.status(200).send();
	} catch(e){
		console.log(e);
	}
	
});

app.get("/profile",isLoggedIn, (req,res) => {
	res.render("profile");
});

app.get("/terms", (req,res) =>{
	res.render("terms");
});

app.get("/contacts", (req,res) => {
	res.render("contact");
});

app.get("/about", (req,res) => {
	res.render("about");
});

app.post('/emailus', function(req, res) {
	let transporter = nodeMailer.createTransport({
          service: 'Gmail', 
          auth: {
			  user: 'studiariweb@gmail.com',
			  pass: "LadySansa979!"
          }
    });
      let mailOptions = {
          from: 'studiariweb@gmail.com', // sender address
          to: 'studiariweb@gmail.com', // list of receivers
          subject: 'A question from studiari', // Subject line
          text: 'Sender email: '+req.body.email+'\n'+
		  'Sender name: '+req.body.name+'\n'+
		  'Message: '+req.body.message+'\n'
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              return console.log(error);
          }
		  req.flash('success', 'Your message has been sent!');
              res.redirect("/blogs");
      });
});


app.get("/movie/:movieId",pay, (req,res) => {
	
	(async function(){
		try{
			
			const s3 = new aws.S3();
			var file = fs.createWriteStream('./public/subs/subtitles.vtt');
			var fileRus = fs.createWriteStream('./public/subs/rus.vtt');
			var fileEspTxt = fs.createWriteStream('./public/subs/esp.txt');
			var fileRusTxt = fs.createWriteStream('./public/subs/rus.txt');
			
			function getSubs(foundEpisode){
				return new Promise(resolve => {
					s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.subtitles
					}, resolve(1)).createReadStream().pipe(file);
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
			
			function getEsp(foundEpisode){
				return new Promise(resolve => {
					var stream = s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.spanishTxt
					}).createReadStream();
					stream.pipe(fileEspTxt);
					stream.on('end', () => {
					  resolve(1);
					});
				});
			}
			
			function getRusTxt(foundEpisode){
				return new Promise(resolve => {
					var stream = s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.russianTxt
					}).createReadStream();
					stream.pipe(fileRusTxt);
					stream.on('end', () => {
					  resolve(1);
					});
				});
			}
			
			Movie.findById(req.params.movieId, function(err, foundMovie){
			
				if(err){
					console.log("Error in finding the movie!");
					console.log(err);
				}else{
					
					async function work(){

						var getSubsResolved = await getSubs(foundMovie);					
						if(foundMovie.russianSub){
							var resolvedRus = await getRus(foundMovie);
						}
						if(foundMovie.spanishTxt){
							var resEsp = await getEsp(foundMovie);
						}
						if(foundMovie.russianTxt){
							var resRus = await getRusTxt(foundMovie);
						}
						if(foundMovie.spanishTxt){
							var esp = await getEspFile();
						}
						if(foundMovie.russianTxt){
							var rus = await getRusFile();
						}
						
						function getRes(){
							var resultArray = [];
							for(var i=0; i<rus.length; i++){
								var obj = {ru: rus[i]};
								if(esp){
									obj["es"] = esp[i];
								}
								resultArray.push(obj);
							}
							return resultArray;
						}
						
						var result;
						if(foundMovie.russianTxt && foundMovie.spanishTxt){
							result = await getRes();
						}else{
							result=[""];
						}
						
						res.render("movie",{res: result, episode: foundMovie, movie: foundMovie});
	
					}
					
					work();
					
				}	
				
			});	
				
		}catch(e){
			console.log("error", e);
		}
	})();
	
});

app.get("/movie/:movieId/:seasonId/:episodeId",pay, (req,res) => {
	
	(async function(){
		try{
			
			const s3 = new aws.S3();
			
			var file = fs.createWriteStream('./public/subs/subtitles.vtt');
			var fileRus = fs.createWriteStream('./public/subs/rus.vtt');
			var fileEspTxt = fs.createWriteStream('./public/subs/esp.txt');
			var fileRusTxt = fs.createWriteStream('./public/subs/rus.txt');
			
			function getSubs(foundEpisode){
				return new Promise(resolve => {
					s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.subtitles
					}, resolve(1)).createReadStream().pipe(file);
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
			
			function getEsp(foundEpisode){
				return new Promise(resolve => {
					var stream = s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.spanishTxt
					}).createReadStream();
					stream.pipe(fileEspTxt);
					stream.on('end', () => {
					  resolve(1);
					});
				});
			}
			
			function getRusTxt(foundEpisode){
				return new Promise(resolve => {
					var stream = s3.getObject({
						Bucket: 'studiari',
						Key: foundEpisode.russianTxt
					}).createReadStream();
					stream.pipe(fileRusTxt);
					stream.on('end', () => {
					  resolve(1);
					});
				});
			}
			
			
			Blog.findById(req.params.movieId, function(err, foundMovie){
			
			Episode.findById(req.params.episodeId, function(err, foundEpisode){
				if(err){
					console.log("Error in finding the episode!");
					console.log(err);
				}else{
					
					async function work(){
						
						var getSubsResolved = await getSubs(foundEpisode);
						
						if(foundEpisode.russianSub){
							var resolvedRus = await getRus(foundEpisode);
						}
						
						if(foundEpisode.spanishTxt){
							var resEsp = await getEsp(foundEpisode);
						}
						if(foundEpisode.russianTxt){
							var resRus = await getRusTxt(foundEpisode);
						}
						if(foundEpisode.spanishTxt){
							var esp = await getEspFile();
						}
						if(foundEpisode.russianTxt){
							var rus = await getRusFile();
						}
						
						function getRes(){
							var resultArray = [];
							for(var i=0; i<rus.length; i++){
								var obj = {ru: rus[i]};
								if(esp){
									obj["es"] = esp[i];
								}
								resultArray.push(obj);
							}
							return resultArray;
						}
						var result;
						if(foundEpisode.russianTxt && foundEpisode.spanishTxt){
							result = await getRes();
						}else{
							result=[""];
						}
						
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