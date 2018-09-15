//app/models/sendFundsHistory.model.js

//Bring in the essentials
const mongoose = require("mongoose");
const Admin = require("./Admin.model");
const Schema = mongoose.Schema;

//Define the admin schema model
const paymentSchema = mongoose.Schema(
  {
    payer_wallet_id: {
      type: String,
      required: true
    },
    payer_name: {
      type: String,
      required: false
    },
    receiver_wallet_id: {
      type: String,
      required: true
    },
    receiver_name: {
      type: String,
      required: false
    },
    amount: {
      type: Number,
      required: true
    },
    remark: {
      type: String,
      required: false
    }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  }
);

module.exports = mongoose.model("PaymentsHistory", paymentSchema);
