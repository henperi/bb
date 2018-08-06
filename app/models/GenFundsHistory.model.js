//app/models/GenFundsHistory.model.js

//Bring in the essentials
const mongoose = require('mongoose');
const Admin = require('./Admin.model')
const Schema = mongoose.Schema;

//Define the admin schema model
const genFundSchema = mongoose.Schema({
    // wallet_id: String,
    user_id: {
        type: Schema.Types.ObjectId,
        ref: Admin,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    remark: {
        type: String,
        required: false
    }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

module.exports = mongoose.model('GenFundsHistory', genFundSchema);