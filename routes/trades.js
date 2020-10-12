const express = require("express")

const middleware = require("../middleware.js")
const router = express.Router();
const Trade = require("../models/trade.js"),
      User = require("../models/user.js")
router.get("/trades", middleware.isLoggedIn, (req,res) =>{
    User.findById(req.user._id).populate("trades").exec((err, user) => {
      if(err) {
        res.redirect("back")
      } else {
        res.render("./trades/index", {user})
      }
    })
    
})

//trade create routes
router.get("/trades/new", middleware.isLoggedIn, (req,res) => res.render("./trades/new"))

router.post("/trades/new",middleware.isLoggedIn, (req,res) => {
  
  Trade.create({title: req.body.title}, (err, newTrade) => {
    if(err) {
      console.log(err)
      res.redirect("back")
    } else {
      //add author to trade
      User.findOne({username: req.body.recipient}, (err, recipient) => {
        if(err) {
          res.redirect("back")
        }else {
          //make sure user exists before sending trade, if not prompt the user to retry trade
          if(recipient) {

          newTrade.recipient.id = recipient._id
          newTrade.recipient.username = req.body.recipient
          newTrade.author.id = req.user._id
          newTrade.author.username = req.user.username

      //put trade into authors current trades
      newTrade.save((err, trade) => {
        console.log(trade)
        User.findById(req.user._id, (err, user) => {
          user.trades.push(newTrade)
          user.save()
         
      })
      //put trade into recipients pending trades
      recipient.trades.push(newTrade)
        recipient.save()

        res.redirect("/trades")
      });
    } else {
      res.redirect("back")
    }
  }
  })
  }
})
      
})

//trade show route
router.get("/trades/:id", (req, res) => {
  Trade.findById(req.params.id, (err, trade) => { res.render("./trades/show", {trade})
  
})
})
 


module.exports = router;