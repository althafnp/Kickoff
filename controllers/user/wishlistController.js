const User = require('../../models/userSchema')
const Wishlist = require('../../models/wishlistSchema')
const Product = require('../../models/productSchema')



const loadWishlistPage = async (req, res) => {
    try {
        
        if(req.user){
            const userId = req.user._id;

            const wishlist = await Wishlist.findOne({userId: userId}).populate('products.productId');

            if(!wishlist || wishlist.products.length == 0){
                return res.render('wishlist', {user: req.user, products: [], message: 'Your Wishlist is Empty'})
            }

            return res.render('wishlist', {user: req.user, wishlist, products: wishlist.products})
        }
        else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.log('Wishlist not found', error);
        res.status(500).send('Server error');
    }
}


const addWishlist = async (req, res) => {
    try {

        if(req.user){
            const userId = req.user._id;
            const {productId} = req.body
            console.log('dfa', productId)

            const product = await Product.findById(productId)

            if(!product){
                return res.status(404).json({error: 'Product not found'})
            }

            let wishlist = await Wishlist.findOne({userId: userId})
            if(!wishlist){
                wishlist = new Wishlist({userId: userId, products: []})
            }

            const existingProduct = wishlist.products.find(p => p.productId == productId)

            if(existingProduct){
                return res.status(400).json({error: 'Product already exist in Wishlist'})
            }
            else{
                wishlist.products.push({
                    productId: productId
                })
            }

            await wishlist.save()

            return res.status(200).json({message: 'Product Added to Wishlist'})

        }
        else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.error('Error adding to Wishlist:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}


const removeWishlist = async (req, res) => {
    try {

        const {productId} = req.params;
        const userId = req.user._id

        const wishlist = await Wishlist.findOne({userId: userId})
        if(!wishlist){
            return res.status(404).json({message: 'Wishlist not Found'})
        }

        wishlist.products = wishlist.products.filter(p => p.productId != productId)

        await wishlist.save()
        
        return res.redirect('/wishlist')

    } catch (error) {
        console.log('Error removing from Wishlist:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}



module.exports = {
    loadWishlistPage,
    addWishlist,
    removeWishlist
}