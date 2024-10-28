const User = require('../../models/userSchema')


const loadWalletPage = async (req, res) => {
    try {

        if(req.user){

            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const skip = (page - 1) * limit;

            const user = await User.findOne({_id: req.user._id})


            if (user && user.transactions) {
                user.transactions.sort((a, b) => b.createdOn - a.createdOn);

                const totalTransactions = user.transactions.length;

                const paginatedTransactions = user.transactions.slice(skip, skip + limit);

                const totalPages = Math.ceil(totalTransactions / limit);

                return res.render('wallet', {
                    user,
                    transactions: paginatedTransactions,
                    currentPage: page,
                    totalPages,
                    totalTransactions,
                });
            } else {
                return res.render('wallet', {
                    user,
                    transactions: [],
                    currentPage: page,
                    totalPages: 0,
                    totalTransactions: 0,
                });
            }
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