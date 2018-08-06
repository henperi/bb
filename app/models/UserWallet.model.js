//app/models/adminWallet.model.js

//Bring in the essentials
const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;
const User =  require('./User.model');

//Define the admin schema model
const userWalletSchema = mongoose.Schema({
    wallet_id: {
        type: String,
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: User,
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
    }
});

module.exports = mongoose.model('UserWallet', userWalletSchema);