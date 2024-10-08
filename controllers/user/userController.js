const User = require("../../models/userSchema");
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const { trusted } = require("mongoose");





const loadHomePage = async (req, res) => {
    try {

        if(req.user){
            return res.render('home', {user: req.user})
        }
        else{
            return res.render('home')
        }

    } catch (error) {
        console.log('Homepage not found', error);
        res.status(500).send('Server error');
    }
}


const loadShopPage = async (req, res) => {
    try {

        //SEARCH
        let search = '';
        if(req.query.search){
            search = req.query.search;
        }

        //FILTERING USING CATEGORY
        let categoryFilter = {};
        if(req.query.category){
            const category = await Category.findOne({name: req.query.category})

            if(category){
                categoryFilter = {category: category._id}
            }
            console.log('dfgd', categoryFilter)
        }

        //PAGINATION
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        //SORTING
        const sortOption = req.query.sort || '';
        let sort = {};

        switch(sortOption){
            case 'priceAsc':
                sort = {salePrice: 1};
                break;
            case 'priceDesc':
                sort = {salePrice: -1};
                break;
            case 'nameAsc':
                sort = {productName: 1};
                break;
            case 'nameDesc':
                sort = {productName: -1};
                break;
            default:
                sort = {};
                break;              
        }

        const totalProducts = await Product.countDocuments({
            isBlocked: false,
            productName: {$regex: '.*' + search + '.*', $options: 'i'},
            ...categoryFilter
        });

        const products = await Product.find({
            isBlocked: false,
            productName: {$regex: '.*' + search + '.*', $options: 'i'},
            ...categoryFilter
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)

        const totalPages = Math.ceil(totalProducts / limit)


        const clubs = await Category.find({categoryType: 'Club', isListed: true})
        const nationality = await Category.find({categoryType: 'Nationality', isListed: true})

        



        if(req.user){
            return res.render('shop', {
                user: req.user,
                products,
                clubs,
                nationality,
                currentPage : page,
                totalPages,
                totalProducts,
                sort: sortOption
            })
        }
        else{
            return res.render('shop', {
                products, 
                clubs,
                nationality,
                currentPage : page,
                totalPages,
                totalProducts,
                sort: sortOption
            })
        }
        
    } catch (error) {
        console.log('Shoppage not found', error);
        res.status(500).send('Server error');
    }
}


    




module.exports = {
    loadHomePage,
    loadShopPage,

}