const mongoose = require("mongoose")
const mongooseLocalStrategy = require("passport-local-mongoose")
const user = require("../../Recipe v3/models/user")

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  trades: [{type: mongoose.Schema.Types.ObjectId,
           ref: "Trade"}],
  files: [String],
  picture: String
})

userSchema.plugin(mongooseLocalStrategy);

const User = mongoose.model("User", userSchema)

module.exports = User;