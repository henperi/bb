//app/models/CommissionSettings.model.js

//Bring in the essentials
const mongoose = require('mongoose');
// const Admin = require('./Admin.model')
// const Schema = mongoose.Schema;

//Define the admin schema model
const CommissionsSchema = mongoose.Schema({
    standard: {
        percent: {
            type: Number,
            required: true,
            default: 3,
        },
        capped: {
            type: Number,
            required: true,
            default: 50,
        }
    },

    on_agent: {
        percent: {
            type: Number,
            required: true,
            default: 2,
        },
        capped: {
            type: Number,
            required: true,
            default: 30,
        }
    },
    
    // on_user: {
    //     percent: {
    //         type: Number,
    //         required: true,
    //         default: 1.8,
    //     },
    //     capped: {
    //         type: Number,
    //         required: true,
    //         default: 30,
    //     }
    // }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

module.exports = mongoose.model('CommissionSettings', CommissionsSchema);