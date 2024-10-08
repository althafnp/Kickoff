const mongoose = require('mongoose');
const {Schema} = mongoose;



const couponSchema = new Schema({
    code:{
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    couponOffer:{
        type: Number,
        required: true
    },
    minAmount:{
        type: Number,
        required: true
    },
    maxAmount:{
        type: Number,
        required: true
    },
    expireOn:{
        type: Date,
        required: true
    },
    status:{
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    userId:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
})


const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;