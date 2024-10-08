const express = require('express');
const app = express();
const path = require('path');
const env = require('dotenv').config();
const hbs = require('hbs')
const morgan = require('morgan')
const session = require('express-session');
const nocache  = require('nocache')


const passport = require('./config/passport')
const db = require('./config/db')
db();

const registerHelper = require('./helpers/hbsHelpers')
registerHelper();

const userRouter = require('./routes/userRouter')
const authRouter = require('./routes/authRouter')
const adminRouter = require('./routes/adminRouter')
const adminAuthRouter = require('./routes/adminAuthRouter');


app.set('view engine', 'hbs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);



hbs.registerPartials(path.join(__dirname, 'views/partials'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(morgan('dev'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        secure: false,
        httpOnly: true,
        maxAge: 72*60*60*1000
    }
}));
app.use(nocache());

app.use(passport.initialize());
app.use(passport.session());


app.use('/', userRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter)
app.use('/admin/auth', adminAuthRouter)



app.listen(process.env.PORT, () => {
    console.log('Server running on http://localhost:5000');
})


module.exports = app;