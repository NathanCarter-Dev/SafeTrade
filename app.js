const express = require("express")
const app = express();
const mongoose = require("mongoose")
const methodOverride = require("method-override")
const expressSession = require("express-session");
const passport = require("passport")
const localStrategy = require("passport-local")
const fileUpload = require('express-fileupload');

mongoose.connect("mongodb://localhost/safepay", {useNewUrlParser: true, useUnifiedTopology: true});

app.set("view engine", "ejs")
app.use(fileUpload());
app.use(methodOverride("_method"));
app.use(express.static("./public"))
app.use(express.static("./models"))


app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(expressSession({
  secret: "Once again Coco wins cutest dog!",
  resave: false,
  saveUninitialized: false
}))



//models 
const User = require("./models/user.js")
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next) {
  res.locals.currentUser = req.user;
  next();
})
//routes
const authRoute = require("./routes/auth.js")
const tradeRoute = require("./routes/trades.js")
app.use(authRoute)
app.use(tradeRoute)



app.get("/", (req,res) => res.render("./index"))

app.post('/upload', (req, res) => {
  if(req.files) {
    
    const file = req.files.file
    console.log(file)
    const fileName = file.name
    
        file.mv("./uploads/"+ fileName, (err) => {
          if(err) {
            console.log(err)
          } else {
           res.send("file uploaded!")
          }
        })

  }
});

//start server port 3000
app.listen("3000", (req,res) => console.log("Server listening on port 3"))