const User = require('../../models/userSchema');
const Product = require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const bcrypt = require('bcrypt')


const loadProfilePage = async (req, res) => {
    try {

        if(req.user){

            const user = await User.findOne({_id: req.user})
            // console.log(user)

            const address = await Address.findOne({userId: req.user})
            // console.log('address',address)

            return res.render('profile', {user, address})
        }else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.log('Profile details not found', error);
        res.status(500).send('Server error');
    }
}


const editProfile = async (req, res) => {
    const {name, phone, email, userId} = req.body;
    if(phone.length !== 10){
        return res.json({error: 'Mobile Number not Valid'})
    }

    try {

        await User.updateOne({_id: userId}, {
            $set:{
                name: name,
                phone: phone,
                email: email
            }
        })

        res.status(200).json({ success: true, message: 'Profile Updated Successfully' });
        
    } catch (error) {
        console.log('Error updating profile', error)
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
}


const addAddress = async (req, res) => {
    const {name, phone, houseNo, city, landmark, state, pincode, userId} = req.body;

    if(phone.length !== 10){
        return res.json({error: 'Mobile Number Not Valid'})
    }
    else if(pincode.length !== 6){
        return res.json({error: 'Pincode must be 6 '})
    }

    try {
        
        let address = await Address.findOne({userId});
        console.log('address',address);
        
        if(!address){
            address = new Address({userId, address: []});
        }

        address.address.push({
            name,
            phone,
            houseNo,
            city,
            landmark,
            state,
            pincode
        })

        await address.save();

        return res.status(200).json({success: true, message: 'Address Added Successfully', address: address.address[0] })

    } catch (error) {
        console.log('Error adding address',error);
        return res.status(500).json({error: 'Error occured while adding Address'})
    }
}


const editAddress = async (req, res) => {
    const {name, phone, houseNo, city, landmark, state, pincode, addressId} = req.body;

    if(phone.length !== 10){
        return res.json({error: 'Mobile Number Not Valid'})
    }
    else if(pincode.length !== 6){
        return res.json({error: 'Pincode must be of 6'})
    }

    try {

        const userId = req.user._id;
        const address = await Address.updateOne({userId: userId, "address._id": addressId}, {
            $set: {
                "address.$.name": name,
                "address.$.phone": phone,
                "address.$.houseNo": houseNo,
                "address.$.city": city,
                "address.$.landmark": landmark,
                "address.$.state": state,
                "address.$.pincode": pincode
            }
        })

        return res.status(200).json({success: true, message: 'Address Edited Successfully'})
        
    } catch (error) {
        console.log('Error editing address', error);
        return res.status(500).json({success: false, message: 'Failed to edit address'})
    }
}



const deleteAddress = async (req, res) => {

    const addressId = req.params.id;
    try {

        const address = await Address.updateOne({'address._id': addressId}, {$pull: {address: {_id: addressId}}})
        
        res.status(200).json({ success: true, message: 'Address deleted successfully' });

    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Failed to delete address' });
    }
}


const changePassword = async (req, res) => {
    try {

        console.log(req.body)

        const userId = req.user._id;

        const {currentPassword, newPassword} = req.body;

        const user = await User.findById(userId);
        console.log('user', user);
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        console.log(isMatch)
        if(!isMatch){
            return res.status(400).json({success: false, message: 'The Password is Incorrect'})
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedNewPassword;

        await user.save();

        return res.json({ success: true, message: 'Password updated successfully.' });
        
    } catch (error) {
        console.error('Error changing  password:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
}


module.exports = {
    loadProfilePage,
    editProfile,
    addAddress,
    editAddress,
    deleteAddress,
    changePassword
}