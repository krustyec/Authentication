// require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// used for mongoose-encryption
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash
    }); 
  
    try {
      // save the new user
      newUser.save();
      console.log('User added successfully.');
      res.render("secrets");
    } catch (error) {
      console.log(err);
    }
  });
});

app.post("/login", function(req, res) {
  // console.log(req.body);
  let result = req.body;

  const username = result.usernamelogin;
  const password = result.passwordlogin;

  // find all documents
  User.findOne({email: username}).then((foundUser) => {
    // console.log(data.password == password);
    try {
      if (foundUser) {
        // Load hash from your password DB.
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if (result === true) {
            res.render("secrets");
          } else {
            console.log("Your password was incorrect, try again.");
          } 
        });
      } else {
        console.log("User not found.");
      }
    } catch (error) {
      console.log(error);
    }
  });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });