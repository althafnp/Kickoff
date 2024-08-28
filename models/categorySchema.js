const mongoose = require('mongoose');
const {Schema} = mongoose;



const categorySchema = new Schema({
    categoryName:{
        type: String,
        required: true
    },
    subCategory:[{
        name:{
            type: String,
            required: true
        }
    }],
    createdAt:{
        type: Date,
        default: Date.now
    }
});



const Category = mongoose.model('Category', categorySchema);

module.exports = Category;