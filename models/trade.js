const mongoose = require("mongoose")

const tradeSchema = new mongoose.Schema({ 
  title: String,
  author: {
    id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
    },
    username: String
  },
  recipient: {
    id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
    },
    username: String
  }
})

module.exports = mongoose.model("Trade", tradeSchema)