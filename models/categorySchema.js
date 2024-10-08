const mongoose = require('mongoose');
const {Schema} = mongoose;



const categorySchema = new Schema({
    name:{
        type: String,
        required: true
    },
    categoryType:{
        type: String,
        enum: ['Club', 'Nationality'],
        required: true
    },
    isListed:{
        type: Boolean,
        default: true
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
});



const Category = mongoose.model('Category', categorySchema);

module.exports = Category;