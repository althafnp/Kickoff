const User = require('../../models/userSchema')


const loadWalletPage = async (req, res) => {
    try {

        if(req.user){
            const user = await User.findOne({_id: req.user._id})

            if(user && user.transactions){
                user.transactions.sort((a, b) => b.createdOn - a.createdOn)
            }
            return res.render('wallet', {user})
        }
        else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.log('Wallet not found', error);
        res.status(500).send('Server error');
    }
}



module.exports = {
    loadWalletPage
}