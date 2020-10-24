const  express = require("express"),
router = express.Router(),
passport = require("passport"),
localStrategy = require("passport-local");

const User = require("../models/user.js")
//render the register page
router.get("/register", (req,res) => res.render("./Auth/register"))

//register post form
router.post("/register", (req,res) => {
  
  User.register(new User({username: req.body.username}), req.body.password, (err, user) =>{
    if(err) {
      console.log(err);
      res.redirect("back")
    } else {

      passport.authenticate("local")(req, res, () =>{
        req.flash("success", "User successfully registered");
        res.redirect("/");
      });
    }
  })
})

  //LOGIN ROUTE
  router.get("/login",  (req, res) =>{
    res.render("./auth/login")
  })
  //Login authentication
  router.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: 'Invalid username or password',
    successFlash: 'Welcome!'
  }) ,(req, res) =>{

  })

  router.get("/logout", (req, res) =>{
    req.logOut();
    req.flash("success", "Successfully logged out")
    res.redirect("/");
  })
module.exports = router;