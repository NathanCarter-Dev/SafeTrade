//models
const User = require("./models/user")

const middleware = {
  isLoggedIn: function(req,res,next) {
    if(req.isAuthenticated()) {
      return next();
    } else {
      res.redirect("/login")
    }
    
  }
}

module.exports = middleware;
