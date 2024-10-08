const mongoose = require('mongoose');
const {Schema} = mongoose;
const {v4:uuidv4} = require('uuid');


const orderSchema = new Schema({
    orderId:{
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    userId :{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderedItems:[{
        product:{
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity:{
            type: Number,
            required: true
        },
        price:{
            type: Number,
            default: 0
        },
        size: {
            type: String,
            required: true
        }
    }],
    totalPrice:{
        type: Number,
        required: true
    },
    discount:{
        type: Number,
        default: 0
    },
    finalAmount:{
        type: Number,
        required: true
    },
    address:{
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    coupon:{
        code:{
            type: String,
            default: null
        },
        offer:{
            type: Number,
            default: null
        }
    },
    deliveryCharge:{
        type: Number,
        required: true
    },
    paymentMethod:{
        type: String,
        required: true,
    },
    paymentStatus:{
        type: String,
        default: 'Pending'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    razorpaySignature: {
        type: String
    },
    invoiceDate:{
        type: Date
    },
    status:{
        type: String,
        required: true,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Returned'],
    },
    createdOn:{
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied:{
        type: Boolean,
        default: false
    }
});


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;