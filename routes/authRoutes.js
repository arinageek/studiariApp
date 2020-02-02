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
	d.setDate(d.getDate()+1);
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
        text: 'Вы получили это письмо, потому что пытались создать учетную запись на StudiAri\n\n' +
          'Пожалуйста, нажмите на следующую ссылку или скопируйте ее в браузер, чтобы продолжить:\n\n' +
          'http://' + req.headers.host + '/register/' + token + '\n\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'Письмо было отправлено на ' + user.username + ' со следующими инструкциями.');
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
            req.flash("error", "Пароли не совпадают!");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      done("no error");
    }
  ], function(err) {
	req.flash("success", "Ваш 24 часовой бесплатный пробный период начинается сейчас!");
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
          req.flash('error', 'Нет аккаунта с таким адресом электронной почты.');
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
        text: 'Вы получили это письмо, потому что запросили сброс пароля для вашей учетной записи на StudiAri\n\n' +
          'Пожалуйста, нажмите на следующую ссылку или скопируйте ее в браузер, чтобы продолжить:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'Если вы не запрашивали сброс пароля из своей учетной записи, игнорируйте этот запрос, и пароль останется без изменений.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'Сообщение было отправлено на ' + user.username + ' со следующими инструкциями.');
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
            req.flash("error", "Пароли не совпадают!");
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
        subject: 'Ваш пароль был изменен',
        text: 'Добрый день,\n\n' +
          'Это подтверждение того, что пароль для учетной записи ' + user.username + ' был изменен.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Ваш пароль был успешно изменен!');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/blogs');
  });
});



module.exports = router;