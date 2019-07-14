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

router.post("/register", function(req,res){
	var newUser = new User({
        username: req.body.username
      });
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            console.log(err);
			req.flash("error", err.message);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res, function(){
                req.flash("success", "Вы зарегистрировались!");
                res.redirect("/blogs");
            });
        }
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
   req.flash("success", "Вы вышли!");
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
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'studiariweb@gmail.com',
        subject: 'Сброс пароля',
        text: 'Вы получили это письмо, потому что запросили сброс пароля для своего аккаунта на StudiAri\n\n' +
          'Пожалуйста, нажмите на следующую ссылку или скопируйте ее в браузер, чтобы продолжить:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'Если вы не запрашивали сброс пароля от вашего аккаунта, проигнорийте этот запрос, и пароль останется неизменным.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'На почту ' + user.username + ' было отправлено письмо с последующими инструкциями.');
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
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'studiariweb@mail.com',
        subject: 'Ваш пароль был изменен',
        text: 'Здравствуйте,\n\n' +
          'Это подтверждение о том, что пароль от аккаунта ' + user.username + ' был изменен.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Ваш пароль был успешно изменен!');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/landing');
  });
});



module.exports = router;