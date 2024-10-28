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
        // Get search, category, and sort from query
        const search = req.query.search || '';
        const categoryName = req.query.category || '';
        const sortOption = req.query.sort || '';

        // Filter by category
        let categoryFilter = {};
        if (categoryName) {
            const category = await Category.findOne({ name: categoryName });
            if (category) {
                categoryFilter = { category: category._id };
            }
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        // Sorting
        let sort = {};
        switch (sortOption) {
            case 'priceAsc':
                sort = { salePrice: 1 };
                break;
            case 'priceDesc':
                sort = { salePrice: -1 };
                break;
            case 'nameAsc':
                sort = { productName: 1 };
                break;
            case 'nameDesc':
                sort = { productName: -1 };
                break;
            default:
                sort = {};
                break;              
        }

        // Product Query
        const totalProducts = await Product.countDocuments({
            isBlocked: false,
            productName: { $regex: '.*' + search + '.*', $options: 'i' },
            ...categoryFilter
        });

        const products = await Product.find({
            isBlocked: false,
            productName: { $regex: '.*' + search + '.*', $options: 'i' },
            ...categoryFilter
        })
        .sort(sort)
        .skip(skip)
        .limit(limit);

        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch categories for sidebar
        const clubs = await Category.find({ categoryType: 'Club', isListed: true });
        const nationality = await Category.find({ categoryType: 'Nationality', isListed: true });

        // Render the response
        if(req.user){
            return res.render('shop', {
                user: req.user,
                products,
                clubs,
                nationality,
                currentPage: page,
                totalPages,
                totalProducts,
                sort: sortOption,
                search: search,
                category: categoryName
            });
        }
        else{
            return res.render('shop', {
                products, 
                clubs,
                nationality,
                currentPage : page,
                totalPages,
                totalProducts,
                sort: sortOption,
                search: search,
                category: categoryName
            })
        }

    } catch (error) {
        console.log('Shop page not found', error);
        res.status(500).send('Server error');
    }
};


    




module.exports = {
    loadHomePage,
    loadShopPage,

}


