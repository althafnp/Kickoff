const User = require("../../models/userSchema");
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');




const loadShopDetails = async (req, res) => {
    try {

        const productId = req.params.id;
        const product = await Product.findById(productId)
        // console.log(product);

        

        if(req.user){
            return res.render('shop-details', {user: req.user, product})
        }
        else{
            return res.render('shop-details', {product})
        }
        
    } catch (error) {
        console.log('Shop details not found', error);
        res.status(500).send('Server error');
    }
}


const stockDetails = async (req, res) => {
    try {

        const {productId, size} = req.params;

        const product = await Product.findById(productId)
        if(!product){
            return res.json({error: 'Product not Found'})
        }

        const stock = product.variant.find(v => v.size === size)?.stock || 0;

        return res.json({stock})
        
    } catch (error) {
        console.log('Error fetching stock', error);
        return res.status(500).json({success: false, message: 'Cannot fetch stock'})
    }
}





module.exports = {
    loadShopDetails,
    stockDetails
}