const express = require("express")
const app = express();
const mongoose = require("mongoose")
const methodOverride = require("method-override")
const expressSession = require("express-session");
const passport = require("passport")
const localStrategy = require("passport-local")
const flash = require("connect-flash")

const bodyParser = require("body-parser")
// DB

app.use(methodOverride("_method"));
app.use(express.static("./public"))
app.use(express.static("./models"))
app.use(bodyParser.json());
app.use(flash());

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(expressSession({
  secret: "Once again Coco wins cutest dog!",
  resave: false,
  saveUninitialized: false
}))
// connection
 mongoose.connect("mongodb://localhost/safepay", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});



app.set("view engine", "ejs")




//models 
const User = require("./models/user.js")
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next) {
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  res.locals.currentUser = req.user;
  next();
})
//routes
const authRoute = require("./routes/auth.js")
const tradeRoute = require("./routes/trades.js");
const filesRoute = require("./routes/files.js");
const middleware = require("./middleware.js");
const Trade = require("./models/trade.js");

app.use(authRoute)
app.use(tradeRoute)
app.use(filesRoute)



app.get("/", (req,res) => res.render("./index"))



//start server port 3000
app.listen("3000", (req,res) => console.log("Server listening on port 3"))