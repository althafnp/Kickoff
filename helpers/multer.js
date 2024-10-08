const multer = require('multer');
const path = require('path');



const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        cb(null, path.join(__dirname, '../public/uploads/re-image'));
    },
    // filename: (req, res, cb) => {
    //     cb(null, Date.now() + '-' + file.originalname);
    // }
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
})

module.exports = storage;