require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// mongoose-encryption
// const encrypt = require("mongoose-encryption");
// const md5 = require('md5');
// bcrypthash
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
// passport
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

// initialize session
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}));

// initialize passport
app.use(passport.initialize());

app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

// passport optional
// mongoose.set('useCreateIndex', true);

// login users with the local authentication method
// const userSchema = new mongoose.Schema({
//   username: String,
//   password: String
// });

// login with auth google
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String
});

// passport
userSchema.plugin(passportLocalMongoose);
// google auth
userSchema.plugin(findOrCreate);

// used for mongoose-encryption
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

// creating mongoose model
const User = new mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// use static serialize and deserialize of model for auth google
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/", function(req, res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
    console.log("User is autenticated");
  } else {
    console.log("User is not autenticated");
    res.render("login");
  }
});

app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
    console.log("User logout")
  });
});

app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

// login using passport, hint: function with parameter
app.post("/login", function(req, res) {
  // password
  const userLogin = new User({
    username: req.body.username,
    password: req.body.password
  });

  console.log(userLogin.username);

  req.login(userLogin, function(err) {
    if (err) {
      console.log("Incorrect credentials");
      res.redirect("/login");
    }
    else {
      passport.authenticate("local", {
        successReturnToOrRedirect: '/secrets',
        failureRedirect: '/login',
        failureMessage: true
      })(req, res, function(returnCode) {
        console.log(returnCode);
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });