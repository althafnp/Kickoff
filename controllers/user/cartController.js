const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Cart = require('../../models/cartSchema')


const loadCartPage = async (req, res) => {
    try {

        if(req.user){
            const userId = req.user._id;

            const cart = await Cart.findOne({userId: userId, }).populate('items.productId');

            if(!cart || cart.items.length === 0){
                return res.render('cart', { user: req.user, items: [], message: 'Your Cart is Empty'})
            }

        
            return res.render('cart', {user: req.user, cart, items: cart.items})
        }
        else{
            return res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.log('Cart not found', error);
        res.status(500).send('Server error');
    }
}


const addCart = async (req, res) => {
    try {

        if(req.user){
            const {productId, size} = req.body;
            const userId = req.user._id;

            const product = await Product.findById(productId);
            if(!product){
                return res.status(404).json({error: 'Product not found'})
            }

            const variant = product.variant.find(v => v.size == size);
            if(!variant || variant.stock <= 0){
                return res.status(400).json({error: 'Selected size is out of stock'})
            }

            const price = product.salePrice;
            const totalPrice = price * 1;

            let cart = await Cart.findOne({userId})
            if(!cart){
                cart = new Cart({userId: userId, items: []})
            }


            const existingItemIndex = cart.items.findIndex(item => {
                return item.productId.toString() == productId && item.size == size
            })

            if(existingItemIndex >= 0){
                cart.items[existingItemIndex].quantity += 1;
                cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].quantity * price;
            }
            else{
                cart.items.push({
                    productId,
                    quantity: 1,
                    size,
                    totalPrice
                })
            }

            await cart.save();

            return res.status(200).json({message: 'Product added to cart', cart})
        }else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}


const updateCart = async (req, res) => {
    try {

        const {itemId, quantity} = req.body;
        const userId = req.user._id;

        if(quantity < 1){
            return res.status(400).json({success: false, message: 'Quantity cannot be less than 1'})
        }

        let cart = await Cart.findOne({userId: userId}).populate('items.productId')

        if(!cart){
            return res.status(404).json({success: false, message: 'Cart not Found'})
        }

        let item = cart.items.find(item => item._id == itemId);

        if(!item){
            return res.status(404).json({success: false, message: 'Item not found in cart'})
        }
        console.log('item', item.productId.productName)

        item.quantity = quantity;
        item.totalPrice = item.productId.salePrice * quantity;

        await cart.save()

        return res.status(200).json({success: true, message:'Cart updated successfully', newTotalPrice: item.totalPrice})

        
    } catch (error) {
        console.log('Error updating cart', error);
        return res.status(500).json({ error: 'Server error' });
    }
}


const removeCart = async (req, res) => {
    try {

        const userId = req.user._id;
        const {productId} = req.params;
        const {size} = req.query;

        let cart = await Cart.findOne({userId: userId});

        if(!cart){
            return res.status(404).json({success: false, message: 'Cart not Found'})
        }

        cart.items = cart.items.filter(item => !(item.productId == productId && item.size == size))
        

        await cart.save();

        res.redirect('/cart')
        
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).send('Server error');
    }
}





module.exports = {
    loadCartPage,
    addCart,
    updateCart,
    removeCart
}