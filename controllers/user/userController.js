const User = require("../../models/userSchema");






const loadHomePage = async (req, res) => {
    try {

        const user = req.session.user;
        

        if(user){
            const userData = await User.findOne({_id: user});
            return res.render('home', {user: userData})
        }
        else{
            return res.render('home')
        }

    } catch (error) {
        console.log('Homepage not found', error);
        res.status(500).send('Server error');
    }
}






module.exports = {
    loadHomePage,
}