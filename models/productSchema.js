const mongoose = require('mongoose');
const {Schema} = mongoose;


const productSchema = new Schema({
    productName:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    category:{
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    regularPrice:{
        type: Number,
        required: true
    },
    salePrice:{
        type: Number,
        required: true
    },
    productOffer:{
        type: Number,
        default: 0
    },
    variant: [
        {
            size:{
                type: String,
                enum: ['S', 'M', 'L', 'XL'],
                required: true
            },
            stock:{
                type: Number,
                required: true
            }

        }
    ],
    productImage:{
        type: [String],
        required: true
    },
    type:{
        type: String,
        enum: ['Home', 'Away'],
        required: true
    },
    isBlocked:{
        type: Boolean,
        default: false
    },
    status:{
        type: String,
        enum: ['In stock', 'Out of stock'],
        required: true,
        default: 'In stock'
    }
}, {timestamps: true});


const Product = mongoose.model('Product', productSchema);
module.exports = Product;
















// size:{
//     type: String,
//     required: true
// },
// stock:{
//     type: Number,
//     required: true
// },