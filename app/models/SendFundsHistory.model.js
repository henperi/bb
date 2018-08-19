//app/models/sendFundsHistory.model.js

//Bring in the essentials
const mongoose = require('mongoose');
const Admin = require('./Admin.model')
const Schema = mongoose.Schema;

//Define the admin schema model
const sendFundSchema = mongoose.Schema({
    // wallet_id: String,
    // sender_id: {
    //     type: Schema.Types.ObjectId,
    //     ref: Admin,
    //     required: true
    // },
    // receiver_id: {
    //     type: Schema.Types.ObjectId,
    //     required: true
    // },
    sender_wallet_id: {
        type: String,
        required: true
    },
    sender_name: {
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
    sender_role: {
        type: String,
        required: true,
    },
    receiver_role: {
        type: String,
        required: true,
    },
    remark: {
        type: String,
        required: false
    },
    commission: {
        type: String,
        required: false
    }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

module.exports = mongoose.model('SendFundsHistory', sendFundSchema);