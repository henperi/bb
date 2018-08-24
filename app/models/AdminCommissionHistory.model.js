//app/models/CommissionHistory.model.js

//Bring in the essentials
const mongoose = require('mongoose');
const Admin = require('./Admin.model')
const Schema = mongoose.Schema;

//Define the commission History schema model
const AdminCommissionHistorySchema = mongoose.Schema({
    
    commissionsData: {
        com_received: {
            type: String,
            required: true
        },
        received_by: {
            type: String,
            required: true
        },
        
        com_charged: {
            type: Number,
            required: true
        },
        charged_on: {
            type: String,
            required: true
        },
    },

    foundingData: {
        fund_amount: {
            type: Number,
            required: true
        },
        fund_type: {
            type: String,
            required: true
        },
        fund_sender: {        
            sender_wallet_id: {
                type: String,
                required: true
            },       
            sender_name: {
                type: String,
                required: true
            },
            sender_role: {
                type: String,
                required: true,
            },
        },
    
        fund_receiver: {        
            receiver_wallet_id: {
                type: String,
                required: true
            },       
            receiver_name: {
                type: String,
                required: true
            },
            receiver_role: {
                type: String,
                required: true,
            },
        },      
    },

}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

module.exports = mongoose.model('AdminCommissionHistory', AdminCommissionHistorySchema);