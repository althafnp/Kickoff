// const { model } = require('mongoose');
const User = require('../../models/userSchema');



const customerInfo = async (req, res) => {
    try {

        let search = "";
        if(req.query.search){
            search = req.query.search;
        }

        let page = 1;
        if(req.query.page){
            page = req.query.page;
        }
        const limit = 5;

        

        const userData = await User.find({
            isAdmin: false,
            $or: [
                {name: {$regex: '.*' + search + '.*', $options: 'i'}},
                {email: {$regex: '.*' + search + '.*', $options: 'i'}}
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec()

        const count = await User.find({
            isAdmin: false,
            $or: [
                {name: {$regex: '.*' + search + '.*', $options: 'i'}},
                {email: {$regex: '.*' + search + '.*', $options: 'i'}}
            ]
        }).countDocuments();




        const totalPages = Math.ceil(count / limit);

        const pages = Array.from({length: totalPages}, (_, i) => i + 1)

        res.render('customers', {
            userData,
            pages,
            totalPages,
            currentPage: page
        })
        
    } catch (error) {
        console.log('Error loading customers', error);
        res.redirect('/admin/page-error')
    }
}


const userBlocked = async (req, res) => {
    try {

        let id = req.query.id;
        await User.updateOne({_id: id}, {$set:{isBlocked: true}});

        if(req.session.user){
            delete req.session.user
        }

        res.redirect('/admin/users')
        
    } catch (error) {
        console.log(error);
        res.redirect('/admin/page-error')
    }
}


const userUnblocked = async (req, res) => {
    try {

        let id = req.query.id;
        await User.updateOne({_id: id}, {$set: {isBlocked: false}});
        res.redirect('/admin/users');
        
    } catch (error) {
        console.log(error);
        res.redirect('/admin/page-error')
    }
}


module.exports = {
    customerInfo,
    userBlocked,
    userUnblocked
}