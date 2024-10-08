const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const User = require('../../models/userSchema')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { error } = require('console')




const getProductPage = async (req, res) => {
    try {

        
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const product = await Product.find({}).populate('category')
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)



        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);




        res.render('products', {
            product,
            currentPage: page,
            totalPages: totalPages,
            totalProducts: totalProducts
        })

    } catch (error) {
        console.log('Error loading Products page', error)
        res.redirect('/admin/page-error')
    }
}


const productBlocked = async (req, res) => {
    try {

        let id = req.query.id;
        await Product.updateOne({_id: id}, {$set: {isBlocked: true}});
        res.redirect('/admin/products')
        
    } catch (error) {
        console.log(error);
        res.redirect('/admin/page-error')
    }
}


const productUnblocked = async (req, res) => {
    try {

        let id = req.query.id;

        await Product.updateOne({_id: id}, {$set: {isBlocked: false}})
        res.redirect('/admin/products')
        
    } catch (error) {
        console.log(error);
        res.redirect('/admin/page-error')
    }
}





const getProductAddPage = async (req, res) => {
    try {

        const category = await Category.find({isListed: true})


        res.render('add-products', {
            category,
        })
        
    } catch (error) {
        console.log('Error loading Add Products page', error)
        res.redirect('/admin/page-error')
    }
}

const getNamesByCategory = async (req, res) => {

    const { categoryType } = req.query;

    try {
        const names = await Category.find({ categoryType, isListed: true }).select('name');

        res.status(200).json({names});
    } catch (error) {
        console.log('Error fetching names:', error);
        res.status(500).json({ error: 'Failed to fetch names' });
    }
};



const addProducts = async (req, res) => {
    try {

        const {productName, description, regularPrice, offer, size, stock, type, category, name, images} = req.body;
        const productExists = await Product.findOne({
            productName: productName,
        })

        const variants = size.map((s, index) => ({
            size: s,
            stock: stock[index]
        }));

        if(!productExists){
            const images = [];

            if(req.files && req.files.length > 0){
                for(let i = 0; i < req.files.length; i++){
                    const originalImagePath = req.files[i].path;

                    const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);
                    await sharp(originalImagePath).resize({width: 440, height: 440}).toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
            }

            const categoryId = await Category.findOne({categoryType: category, name: name})
            

            if(!categoryId){
                return res.status(400).send('Invalid category name')
            }

            let salePrice;
            if (offer && parseInt(offer) > 0) {
                salePrice = regularPrice - Math.floor(regularPrice * (offer / 100));
            } else {
                salePrice = regularPrice; // No offer, sale price equals regular price
            }

            const newProduct = new Product({
                productName,
                description,
                regularPrice,
                salePrice,
                productOffer: offer ? parseInt(offer) : 0,
                variant: variants,
                category: categoryId._id,
                type,
                productImage: images
            })

            await newProduct.save();
            return res.redirect('/admin/addProducts');
        }
        else{
            return res.status(400).json('Product already exists, please try with another name')
        }
        
    } catch (error) {
        console.log('Error adding product', error);
        res.redirect('/admin/page-error');
    }
}



const getEditProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.query.id).populate('category')
        
        res.render('edit-product', {
            product
        })

    } catch (error) {
        console.log(error);
        res.redirect('/admin/page-error')
    }
}

const editProduct = async (req, res) => {
    try {

        const id = req.params.id;
        const product = await Product.findOne({_id: id})
        const data = req.body;

        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: {$ne: id}
        })

        if(existingProduct){
            return res.status(400).json({success: false, message: 'Product with this name already exists!'})
        }

        const images = [];

        if(req.files && req.files.length > 0){
            for(let i = 0; i < req.files.length; i++){
                images.push(req.files[i].filename)
            }
        }
        
        const updateFields = {
            productName: data.productName,
            description: data.description,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            type: data.type
        }

        if (data.offer && parseInt(data.offer) > 0) {
            updateFields.salePrice = data.regularPrice - Math.floor(data.regularPrice * (data.offer / 100));
            updateFields.productOffer = parseInt(data.offer);
        } else {
            updateFields.salePrice = data.regularPrice; // No offer, sale price equals regular price
            updateFields.productOffer = 0;
        }

        if(req.files.length > 0){
            updateFields.$push = {productImage: {$each: images}}
        }

        if(data.size && data.stock){
            const variants = data.size.map((s, index) => ({
                size: s,
                stock: data.stock[index]
            }))
            updateFields.variant = variants;
        }

        if(data.category && data.name){
            const category = await Category.findOne({
                categoryType: data.category,
                name: data.name
            });

            if(!category){
                return res.status(400).json({error: 'Category not found!'})
            }
        }

        await Product.findByIdAndUpdate(id, updateFields, {new: true});

        res.json({success: true, redirectUrl: '/admin/products'})

    } catch (error) {
        console.log('Error editing products', error);
        res.redirect('/admin/page-error')
    }
}


const deleteSingleImage = async (req, res) => {
    try {

        const {imageNameToServer, productIdToServer} = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer, {$pull: {productImage: imageNameToServer}});        
        const imagePath = path.join('public', 'uploads', 're-image', imageNameToServer);
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`)
        }
        else{
            console.log(`Image ${imageNameToServer} not found`)
        }

        res.send({status: true});
        
    } catch (error) {
        console.log('Error deleting image', error);
        res.redirect('/admin/page-error')
    }
}


const addProductOffer = async (req, res) => {
    try {

        const {productId, percentage} = req.body;

        const product = await Product.findOne({_id: productId})

        product.salePrice = product.regularPrice - Math.floor(product.regularPrice * (percentage / 100))
        product.productOffer = parseInt(percentage)
        
        await product.save();

        res.json({status: true})

    } catch (error) {
        console.log('Error adding offer', error);
        res.redirect('/admin/page-error')
    }
}


const removeProductOffer = async(req, res) => {
    try {

        const {productId} = req.body;

        const product = await Product.findOne({_id: productId});
        const percentage = product.productOffer;

        product.salePrice = product.salePrice + Math.floor(product.regularPrice * (percentage / 100))
        product.productOffer = 0;

        await product.save();

        res.json({status: true})
        
    } catch (error) {
        console.log('Error removing offer', error);
        res.redirect('/admin/page-error')
    }
}


module.exports = {
    getProductPage,
    productBlocked,
    productUnblocked,
    getProductAddPage,
    getNamesByCategory,
    addProducts,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    addProductOffer,
    removeProductOffer
}