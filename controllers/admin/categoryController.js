const Category = require('../../models/categorySchema');



const categoryInfo = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categories = await Category.find({})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)



        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        res.render('category', {
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
            categories
        });

        
    } catch (error) {
        console.log('Error Loading category', error);
        res.redirect('/admin/page-error');
    }
}



const addCategory = async (req, res) => {
    const {categoryType, name} = req.body;
    console.log(categoryType, name)
    try {

        const existingClubOrNation = await Category.findOne({name});

        if(existingClubOrNation){
            return res.status(400).json({error: 'Club or Nation already exist'})
        }

        const newCategory = new Category({
            categoryType,
            name
        })

        await newCategory.save()
        res.status(200).json({ message: 'Category added successfully' });
       

    } catch (error) {
        console.log('Error adding category', error);
        res.redirect('/admin/page-error')
    }
}





const categoryListed = async (req, res) => {
    try {

        let {id} = req.body;
        await Category.updateOne({_id: id}, {$set: {isListed: true}});
        res.status(200).json({message: 'Category listed successfully'})
        
    } catch (error) {
        console.log(error);
        res.redirect('/admin/page-error')
    }
}


const categoryUnlisted = async (req, res) => {
    try {

        let {id} = req.body;
        await Category.updateOne({_id: id}, {$set: {isListed: false}});
        res.status(200).json({message: 'Category unlisted successfully'})
        
    } catch (error) {
        console.log(error);
        res.redirect('/admin/page-error');
    }
}




const getEditCategory = async (req, res) => {
    try {

        const category = await Category.findById(req.params.id);
        res.render('edit-category', {category})
        
    } catch (error) {
        console.log('Error getEditCategory', error);
        res.redirect('/admin/page-error')
    }
}





const editCategory = async (req, res) => {
    const {categoryType, name} = req.body;
    try {

        const id = req.params.id;

      
        const existingClubOrNation = await Category.findOne({ name });

        if (existingClubOrNation) {
            return res.status(400).json({ error: 'Club or Nation already exists' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { categoryType, name },
            { new: true }
        );

        res.status(200).json({ message: 'Category updated successfully' });
       

    } catch (error) {
        console.log('Error editing category', error);
        res.redirect('admin/page-error');
    }
}

module.exports = {
    categoryInfo,
    addCategory,
    categoryListed,
    categoryUnlisted,
    getEditCategory,
    editCategory
}