const User = require('../models/userSchema');


const userAuth = (req, res, next) => {
    if(req.session.user){
        User.findById(req.session.user)
        .then((data) => {
            if(data && !data.isBlocked){
                req.user = data;
            }
            next()
        })
        .catch((error) => {
            console.log('Error in user auth middleware', error);
            next()
        })
    }
    else{
        next()
    }
}


const adminAuth = (req, res, next) => {
    if(req.session.admin){
        console.log('Admin Authenticated');
        next();
    }
    else{
        return res.redirect('/admin/auth/login');
    }
}


module.exports = {
    userAuth,
    adminAuth
}










// User.findOne({isAdmin: true})
// .then((data) => {
//     if(data){
//         console.log('middleware');
//         next();
//     }
//     else{
//         res.redirect('/admin/auth/login')
//     }
// })
// .catch((error) => {
//     console.log('Error in admin auth middleware', error);
//     res.status(500).send('Server Error')
// })
// }