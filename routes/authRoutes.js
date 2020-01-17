var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user.js");
var bodyParser = require("body-parser");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
router.use(bodyParser.urlencoded({extended: true}));

router.get("/register", function(req,res){
    res.render("register");
});

router.post('/register', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
	function(token, done) {
      crypto.randomBytes(20, function(err, buf) {
        var randomPassword = buf.toString('hex');
        done(err, token, randomPassword);
      });
    },
    function(token, randomPassword, done) {
	var d = new Date();
	d.setDate(d.getDate()+3);
	var newUser = new User({
        username: req.body.email,
		expirationDate: d
      });
	crypto.randomBytes(20, function(err, buf) {
        randomPassword = buf.toString('hex');
      });
    User.register(newUser,randomPassword, function(err,user){
        if(err){
            console.log(err);
			req.flash("error", err.message);
            res.redirect("/register");
        }else{
			user.registerPasswordToken = token;
			user.registerPasswordExpires = Date.now() + 3600000; // 1 hour

			user.save(function(err) {
			  done(err, token, user);
			});
		}
    });
      
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'studiariweb@gmail.com',
          pass: process.env.GMAILPASS
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'studiariweb@gmail.com',
        subject: 'StudiAri Account Setup',
        text: 'You received this email because you tried to create an account on StudiAri\n\n' +
          'Please click on the following link or copy it to your browser to continue:\n\n' +
          'http://' + req.headers.host + '/register/' + token + '\n\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An email was sent to ' + user.username + ' with following instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/register');
  });
});

router.get('/register/:token', function(req, res) {
  User.findOne({ registerPasswordToken: req.params.token, registerPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Account registration token is invalid or has expired.');
      return res.redirect('/register');
    }
    res.render('createpassword', {token: req.params.token});
  });
});

router.post('/register/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ registerPasswordToken: req.params.token, registerPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Account registration token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.registerPasswordToken = undefined;
            user.registerPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords don't match!");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      done("no error");
    }
  ], function(err) {
	req.flash("success", "Your 3 DAY FREE TRIAL starts now!");
    res.redirect('/blogs');
  });
});

router.get("/login", function(req,res){
    res.render("login");
});

router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/blogs",
        failureRedirect: "/login",
	    failureFlash: true
    }), function(req, res){
	req.flash("error", err.message);
    res.redirect("/login");
});

router.get("/logout", function(req, res){
   req.logout();
   res.redirect("/blogs");
});

router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ username: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'studiariweb@gmail.com',
          pass: process.env.GMAILPASS
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'studiariweb@gmail.com',
        subject: 'Password reset',
        text: 'You received this email because you requested a password reset for your account on StudiAri\n\n' +
          'Please click on the following link or copy it to your browser to continue:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request a password reset from your account, ignore this request and the password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An email was sent to ' + user.username + ' with following instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords don't match!");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'studiariweb@gmail.com',
          pass: process.env.GMAILPASS
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'studiariweb@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for the account ' + user.username + ' has been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Your password has been successfully changed!');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/blogs');
  });
});



module.exports = router;