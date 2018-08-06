//app/models/adminWallet.model.js

//Bring in the essentials
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Admin =  require('./Admin.model');

//Define the admin schema model
const adminWalletSchema = mongoose.Schema({
    wallet_id: {
        type: String,
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: Admin,
        required: true
    },
    ballance: {
        type: Number,
        default: 0,
        required: true
    },
    wallet_type: {
        type: String,
        default: "Manager",
        required: true
    },
    wallet_status: {
        type: String,
        default: "Active",
        required: true
    }
});

module.exports = mongoose.model('AdminWallet', adminWalletSchema);