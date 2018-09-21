//app/models/adminWallet.model.js

//Bring in the essentials
const mongoose = require("mongoose");
// const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;
const User = require("./User.model");

//Define the admin schema model
const userWalletSchema = mongoose.Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true
  },
  wallet_id: {
    type: String,
    required: true
  },
  ballance: {
    type: Number,
    default: 0,
    required: true
  },
  wallet_type: {
    type: String,
    // default: "Manager",
    required: true
  },
  wallet_status: {
    type: String,
    default: "Active",
    required: true
  },
  pin_status: {
    type: String,
    default: "unset",
    required: true
  },
  pin: {
    type: Number,
    required: false
  }
});

module.exports = mongoose.model("UserWallet", userWalletSchema);
