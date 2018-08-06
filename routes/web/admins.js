//routes/web/admins.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

//Bring in the Admin Model
const Admin =  require('../../app/models/Admin.model');
const AdminWallet =  require('../../app/models/AdminWallet.model');
const GenFundsHistory =  require('../../app/models/GenFundsHistory.model');

//Bring in the User Model
const User = require('../../app/models/User.model');
const UserWallet = require('../../app/models/UserWallet.model');

const bcrypt = require('bcryptjs')

const adminCreateAccounts = require('../../app/controllers/adminControllers/adminCreateAccount.controller')

/*
|=======================================================================================
|ADMIN LOGIN
|=======================================================================================
*/
//Show the login form
router.get('/login', redirectIfAuth, (req, res) => {
    // console.log(`res.locals.errorMsg ${res.locals.errorMsg}`)
    res.render('admins/login', {
        layout: 'reg-log-layout',
        title: 'Admin'
    });
});

//process the login request
router.post('/login', (req, res, next) => {
    passport.authenticate('local',{
        successRedirect: 'dashboard/',
        failureRedirect: 'login',
        failureFlash: true
    })(req, res, next);
});


//process the logout get request
router.get('/logout', (req, res) => {
    // console.log(req.user);
    req.logout();
    req.flash('infoMsg', 'You are now logged out');
    res.redirect('login');
})

//Show the signup form
router.get('/signup', redirectIfAuth, (req, res) => {
    res.locals.message = req.flash('message');
    
    req.flash('infoMsg', 'You cannot visit the admin signup page, get in touch with an admin first!');
    res.redirect('login');

    console.log(`res.locals.message ${res.locals.message}`)
    res.render('admins/signup', {
        layout: 'reg-log-layout',
        title: 'Admin',
        // message: req.flash(message) 
    });
});

// process the signup form
router.post('/signup', (req, res) => {

    console.log(req.body.firstname, req.body.lastname, req.body.mobile, req.body.email, req.body.password);

    req.checkBody('firstname', 'Firstname is required').notEmpty();
    req.checkBody('lastname', 'Lastname is required').notEmpty();
    req.checkBody('mobile', 'Mobile is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password_confirmation', 'Passwords do not match').equals(req.body.password);

    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const mobile = req.body.mobile;
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    // const password_confirmation = req.body.password_confirmation;

    let errors = req.validationErrors();

    if(errors){
        console.log(`Validation Errors: ${JSON.stringify(errors)}`);
        req.flash('error', errors);
        res.redirect('signup');
    } else {
        emailQuery = {email: email};
        
        Admin.findOne(emailQuery, (err, admin) => {
            if(err) {
                console.log(`Error: ${err}`)
            }
            if(admin) {
                console.log(`This admin email exists already: ${admin}`);
                req.flash('errorMsg', 'This email has been taken');
                res.redirect('signup');
            } else {
                mobileQuery = {mobile: mobile};
                Admin.findOne(mobileQuery, (err, admin_mobile) => {
                    if(err) {
                        console.log(`Error: ${err}`)
                    }
                    if(admin_mobile) {
                        console.log(`This admin mobile exists already: ${admin_mobile}`);
                        req.flash('errorMsg', 'This mobile has been taken');
                        res.redirect('signup');
                    } else {
                        console.log("checking for mobile:" +mobile)
                        let newAdmin = new Admin({
                            firstname: firstname,
                            lastname: lastname, 
                            mobile: mobile, 
                            email: email, 
                            role: "Super-Admin", 
                            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
                            p_check: password
                        });

                        newAdmin.save( (err, registeredAdmin) => {
                            if(err) throw err;
                            else {
                                console.log(`Admin saved to the database ${registeredAdmin}`);

                                let newAdminWallet = new AdminWallet({
                                    wallet_id: mobile,
                                    user_id: registeredAdmin._id, 
                                });
                                newAdminWallet.save( (err, registerdWallet) => {
                                    if(err) throw err;
                                    else {
                                        console.log(`AdminWallet saved to the database ${registerdWallet}`);
                                    }
                                })

                                req.flash('successMsg', 'You have registered successfully, Login to your account now');
                                res.redirect('login');
                            }
                        });

                    }
                })
            }
        })
    }
});


router.get('*', (req, res, next) => {
    res.locals.user = req.user || null;
    if(req.user) {
        // console.log('From all:' + req.user);
        // res.locals.admin = req.user || null;
        let mainAdmin = false;
        if(req.user.role == 'Super-Admin'){
            mainAdmin = true;
        } else {
            mainAdmin = false;
        }
        // console.log(mainAdmin);
        res.locals.mainAdmin = req.mainAdmin = mainAdmin;
    }
    
    next();
});

//Enter the user dashboard
router.get('/dashboard', ensureAuth, (req, res) => {
    // console.log('User:' + req.user, req.user._id);
    // console.log("RES " +req.wallet)
    
    console.log('from dashboard' +req.mainAdmin);
    if(req.user.role == 'Super-Admin' || req.user.role == 'Manager' || req.user.role == 'Admin'){
        AdminWallet.findOne({
            'wallet_id': req.user.mobile,
            'user_id': req.user._id
        }, (err, adminWallet) => {
            if(err) return next(err)
            else {
                
                User.aggregate([
                    {
                        $lookup: {
                            from: "userwallets",
                            localField: "mobile",
                            foreignField: "wallet_id",
                            as: "wallets"
                        }
                    }
                ], (err, usersData) => {
                    if(err) throw err;
                    else {
                        // console.log(usersData);
                        // console.log(usersData[0].wallets[0].wallet_status); usersData.[0].wallets.[0].ballance
                        res.render('admins/dashboard', {
                            adminWallet: adminWallet,
                            mainAdmin: req.mainAdmin,
                            usersData: usersData
                        });  
                    }                    
                })
                
            }
        });        
    } else {
        res.send("Invalid Access")
    }

});

router.get('/accounts/users', ensureAuth, (req, res) => {
    if(req.user.role == 'Super-Admin' || req.user.role == 'Manager'){
        AdminWallet.findOne({
            'wallet_id': req.user.mobile,
            'user_id': req.user._id
        }, (err, adminWallet) => {
            if(err) return next(err)
            else {
                
                User.aggregate([
                    { $match: { account_type: "User" } },
                    {
                        $lookup: {
                            from: "userwallets",
                            localField: "mobile",
                            foreignField: "wallet_id",
                            as: "wallets"
                        }
                    }
                ], (err, usersData) => {
                    if(err) throw err;
                    else {
                        // console.log(usersData);
                        // console.log(usersData[0].wallets[0].wallet_status); usersData.[0].wallets.[0].ballance
                        res.render('admins/accounts/users', {
                            adminWallet: adminWallet,
                            mainAdmin: req.mainAdmin,
                            usersData: usersData
                        });  
                    }                    
                })
            }
        });        
    } else {
        res.send("Invalid Access")
    }
})

router.get('/accounts/agents', ensureAuth, (req, res) => {
    if(req.user.role == 'Super-Admin' || req.user.role == 'Manager'){
        AdminWallet.findOne({
            'wallet_id': req.user.mobile,
            'user_id': req.user._id
        }, (err, adminWallet) => {
            if(err) return next(err)
            else {
                
                User.aggregate([
                    { $match: { account_type: "Agent" } },
                    {
                        $lookup: {
                            from: "userwallets",
                            localField: "mobile",
                            foreignField: "wallet_id",
                            as: "wallets"
                        }
                    }
                ], (err, usersData) => {
                    if(err) throw err;
                    else {
                        // console.log(usersData);
                        // console.log(usersData[0].wallets[0].wallet_status); usersData.[0].wallets.[0].ballance
                        res.render('admins/accounts/users', {
                            adminWallet: adminWallet,
                            mainAdmin: req.mainAdmin,
                            usersData: usersData
                        });  
                    }                    
                })
            }
        });        
    } else {
        res.send("Invalid Access")
    }
})

router.get('/accounts/managers', ensureAuth, (req, res) => {
    
    if(req.user.role == 'Super-Admin'){
        AdminWallet.findOne({
            'wallet_id': req.user.mobile,
            'user_id': req.user._id
        }, (err, adminWallet) => {
            if(err) return next(err)
            else {

                Admin.aggregate([
                    { $match: { mobile: { $ne: req.user.mobile} } },
                    {
                        $lookup: {
                            from: "adminwallets",
                            localField: "mobile",
                            foreignField: "wallet_id",
                            as: "wallets"
                        }
                    }
                ], (err, managersData) => {
                    if(err) throw err;
                    else {
                        console.log(`managersData: ${managersData}`);
                        // console.log(managersData[0], managersData[0].wallets[0].ballance); 
                        res.render('admins/accounts/managers', {
                            adminWallet: adminWallet,
                            mainAdmin: req.mainAdmin,
                            managersData: managersData
                        });  
                    }                    
                })
            }
        });        
    } else {
        res.send("Invalid Access")
    }
})

router.get('/accounts/create', ensureAuth, (req, res) => {
    if(req.user.role == 'Super-Admin' || req.user.role == 'Manager'){
        AdminWallet.findOne({
            'wallet_id': req.user.mobile,
            'user_id': req.user._id
        }, (err, adminWallet) => {
            if(err) return next(err)
            else {
                
                User.aggregate([
                    { $match: { created_by: req.user.id } },
                    {
                        $lookup: {
                            from: "userwallets",
                            localField: "mobile",
                            foreignField: "wallet_id",
                            as: "wallets"
                        }
                    }
                ], (err, usersData) => {
                    if(err) throw err;
                    else {
                        // console.log(usersData);
                        // console.log(usersData[0].wallets[0].wallet_status); usersData.[0].wallets.[0].ballance
                        res.render('admins/accounts/create', {
                            adminWallet: adminWallet,
                            mainAdmin: req.mainAdmin,
                            usersData: usersData
                        });  
                    }                    
                })
            }
        });        
    } else {
        res.send("Invalid Access")
    }
})

router.post('/accounts/create', ensureAuth, createUser)

router.post('/gen-funds', ensureAuth, genFunds)


router.post('/fund/accounts/:account_type', ensureAuth, fundAnyAccount)


/*
|=======================================================================================================
|// adminCreateAccount.controller Starts 
|=======================================================================================================
*/
function createUser(req, res) {
    console.log("loging userData" +req.body.firstname, req.body.lastname, req.body.mobile, req.body.email, req.body.password);

    req.checkBody('firstname', 'Firstname is required').notEmpty();
    req.checkBody('lastname', 'Lastname is required').notEmpty();
    req.checkBody('mobile', 'Mobile is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('account_type', 'Account Type is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    
    let errors = req.validationErrors();

    if(errors){
        console.log(`Validation Errors: ${JSON.stringify(errors)}`);
        req.flash('error', errors);
        res.redirect('create');
    } else {

        const firstname = req.body.firstname;
        const lastname = req.body.lastname;
        const mobile = req.body.mobile;
        const email = req.body.email.toLowerCase();
        const account_type = req.body.account_type;
        const password = '123456';

        emailQuery = {email: email};
        
        if(account_type == 'User' || account_type == 'Agent') {
            User.findOne(emailQuery, (err, user_email) => {
                if(err) {throw err}
                if(user_email){
                    console.log(`This admin email exists already: ${user_email}`);
                    req.flash('errorMsg', 'This email has been taken');
                    res.redirect('create');
                } else {
                    mobileQuery = {mobile: mobile};
                    User.findOne(mobileQuery, (err, user_mobile) => {
                        if(err){throw err}
                        
                        if(user_mobile){
                            console.log(`This user mobile exists already: ${user_mobile}`);
                            req.flash('errorMsg', 'This mobile has been taken');
                            res.redirect('create');
                        } else {
                            
                            console.log("attempting to save the user:");
                            const newUser = new User({
                                firstname: firstname,
                                lastname: lastname, 
                                mobile: mobile, 
                                email: email, 
                                account_type: account_type,
                                created_by: req.user._id,
                                password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
                                p_check: password
                            });
    
                            newUser.save( (err, registeredUser) => {
                                if(err){
                                    throw error
                                } else {
                                    console.log(`User saved to the database ${registeredUser.firstname}`);
    
                                    let newUserWallet = new UserWallet({
                                        wallet_id: mobile,
                                        user_id: registeredUser._id,
                                        wallet_type: account_type 
                                    });
    
                                    newUserWallet.save( (err, registerdWallet) => {
                                        if(err) throw err;
                                        else {
                                            console.log(`UserWallet saved to the database ${registerdWallet.wallet_id}`);
                                        }
                                    });
                                    
                                    req.flash('successMsg', `You have registered a new ${account_type} successfully, password is ${registeredUser.p_check}`);
                                    res.redirect('create');
                                }
                            });
                        }
                    })
                }
            });
        }
        
        if(account_type == 'Manager') {
            if(req.user.role != 'Super-Admin'){
                req.flash('errorMsg', `You don't have priviledges to create a ${account_type} account`);
                res.redirect('create');
            } else {

                Admin.findOne(emailQuery, (err, admin_email) => {
                    if(err) {throw err}
                    if(admin_email){
                        console.log(`This admin email exists already: ${admin_email}`);
                        req.flash('errorMsg', 'This manager email has been taken');
                        res.redirect('create');
                    } else {
                        mobileQuery = {mobile: mobile};
                        Admin.findOne(mobileQuery, (err, admin_mobile) => {
                            if(err){throw err}
                            
                            if(admin_mobile){
                                console.log(`This admin mobile exists already: ${admin_mobile}`);
                                req.flash('errorMsg', 'This manager mobile has been taken');
                                res.redirect('create');
                            } else {
                                
                                console.log("attempting to save the admin:");
                                const newAdmin = new Admin({
                                    firstname: firstname,
                                    lastname: lastname, 
                                    mobile: mobile, 
                                    email: email, 
                                    role: account_type,
                                    created_by: req.user._id,
                                    password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
                                    p_check: password
                                });
        
                                newAdmin.save( (err, registeredAdmin) => {
                                    if(err){
                                        throw error
                                    } else {
                                        console.log(`User saved to the database ${registeredAdmin.firstname}`);
        
                                        let newAdminWallet = new AdminWallet({
                                            wallet_id: mobile,
                                            user_id: registeredAdmin._id,
                                            wallet_type: account_type 
                                        });
        
                                        newAdminWallet.save( (err, registerdWallet) => {
                                            if(err) throw err;
                                            else {
                                                console.log(`AdminWallet saved to the database ${registerdWallet.wallet_id}`);
                                            }
                                        });
                                        
                                        req.flash('successMsg', `You have registered a new ${account_type} successfully, password is ${registeredAdmin.p_check}`);
                                        res.redirect('create');
                                    }
                                });
                            }
                        })
                    }
                });
            }
        }
        
    }

}
/*
|=======================================================================================================
|// adminCreateAccount.controller Ends 
|=======================================================================================================
*/

/*
|=======================================================================================================
|// Main Admin Action Starts 
|=======================================================================================================
*/
//Generate Fund
function genFunds(req, res) {
    console.log("loging genFundsData: " +req.body.gen_amount, req.body.remark);
    // console.log(req.user.role);
    

    req.checkBody('gen_amount', 'Amount is required').notEmpty();
    // req.checkBody('Remark', 'remark is required').notEmpty();
    
    let errors = req.validationErrors();
    if(errors) {
        console.log(`Validation Errors: ${JSON.stringify(errors)}`);
        req.flash('error', errors);
        res.redirect('dashboard');
    }    
    if(req.user.role != 'Super-Admin') {
        req.flash('errorMsg', `You cannot generate funds`);
        res.redirect('dashboard');
    } else {
        const amount = req.body.gen_amount;
        const remark = req.body.remark || null;
        
        const min_amount = 0;
        // console.log(!isNaN(amount));

        if(isNaN(amount)) {
            req.flash('warningMsg', `Please enter a valid amount: "${amount}" is not a number `);
            res.redirect('dashboard');
        } else {
            
            if(amount <= 0) {
                req.flash('infoMsg', `You can't generate anything bellow ${min_amount} `);
                res.redirect('dashboard');
            } else {
                mainAdminQuery = {user_id: req.user._id};
                AdminWallet.findOne(mainAdminQuery, (err, adminWallet) => {
                    if(err) throw err;
                    if(!adminWallet) {
                        req.flash('warningMsg', `Issue with your account, you can't generate right now`);
                        res.redirect('dashboard');
                    } else {
                        console.log(`Found admin with wallet id ${adminWallet} `);
                        
                        AdminWallet.update({ 'wallet_id': req.user.mobile, 'user_id': req.user._id }, 
                            { $inc: { 'ballance': amount } }, (err) => {
                            if(err) throw err;
                            
                            else {
                                console.log('Updating...');
                                
                                let newGenFundsHistory = new GenFundsHistory({
                                    user_id: req.user._id,
                                    amount: amount,
                                    remark: remark
                                });
                                newGenFundsHistory.save( (err, History) => {
                                    if(err) throw err;
                                    else {
                                        console.log(`GenerateFundHistory saved to the database ${History}`);
                                    
                                        req.flash('successMsg', `Accounted topped up by ${amount}, previous ballance: ${adminWallet.ballance} `);
                                        res.redirect('dashboard');
                                    }
                                })

                            }                            
                        });
                    }
                })
            }
        }

    }
}


//Fund User
function fundAnyAccount(req, res) {
    console.log("loging Fund data: " +req.body.fund_amount, req.body.remark, req.body.account_type, req.body.wallet_id, req.body.u_id);
    // console.log(req.user.role);
    
    req.checkBody('fund_amount', 'Amount is required').notEmpty();
    req.checkBody('account_type', 'Account Type is not defined').notEmpty();
    req.checkBody('wallet_id', 'Wallet is not defined').notEmpty();
    req.checkBody('u_id', 'Identity is not defined').notEmpty();
    // req.checkBody('Remark', 'remark is required').notEmpty();
    // return null;
    
    let errors = req.validationErrors();
    if(errors) {
        console.log(`Validation Errors: ${JSON.stringify(errors)}`);
        req.flash('error', errors);
        res.redirect('dashboard');
    }    
    // req.user.role = 'Admin';
    // console.log(req.user.role);
    if(req.user.role != 'Super-Admin' && req.user.role != 'Manager') {
        console.log(req.user.role);
        req.flash('errorMsg', `You do not have privileges to carry out this funding action`);
        res.redirect('/admins/dashboard');
    } else {
        console.log('checking', req.user.role);
        const fund_amount = req.body.fund_amount;
        const wallet_type = req.body.account_type;
        const wallet_id = req.body.wallet_id;
        const u_id = req.body.u_id;
        const remark = req.body.remark || null;
        
        let adminPercentage = 0;
        let adminCommission = req.body.com_to_admin || ((adminPercentage/100) * fund_amount);
        
        const min_amount = 0;
        // console.log(!isNaN(fund_amount));
        // return null;

        if(isNaN(fund_amount)) {
            console.log(isNaN(fund_amount))
            req.flash('warningMsg', `Please enter a valid amount: "${fund_amount}" is not a number `);
            res.redirect('/admins/dashboard');
        }
        else {
                       
            if(fund_amount <= min_amount) {
                req.flash('warningMsg', `You can't fund anything bellow ${min_amount} `);
                res.redirect('/admins/dashboard');
            }
            if(adminCommission < min_amount) {
                req.flash('warningMsg', `You can't apply a commission bellow ${min_amount} `);
                res.redirect('/admins/dashboard');
            } else {
                // if(wallet_type == 'User') {

                // }

                console.log(wallet_id, wallet_type, u_id )
                userWalletQuery = {user_id: u_id, wallet_id: wallet_id, wallet_type: wallet_type};

                if(wallet_type == 'User') {
                    let adminPercentage = 3;
                    let adminCommission = req.body.com_to_admin || ((adminPercentage/100) * fund_amount);
                
                    if(isNaN(adminCommission)) {
                        console.log(adminCommission)
                        req.flash('warningMsg', `Please enter a valid commission amount: "${req.body.com_to_admin}" is not a number `);
                        res.redirect('/admins/dashboard');
                    } else {

                        let WalletQuery = {user_id: req.user._id};
                        console.log('adminwallet',WalletQuery);
                        AdminWallet.findOne(
                            {user_id: req.user._id}, 
                            (err, adminWallet) => {
                                if(err) throw err;
                                if(!adminWallet) {
                                    console.log('inside !',adminWallet);
                                    req.flash('warningMsg', `Your admin account was not found`);
                                    res.redirect('/admins/dashboard');
                                } else {
                                    if(fund_amount > adminWallet.ballance) {
                                        req.flash('warningMsg', `Your ballance is too low, cannot move N${fund_amount}, when you only have N${adminWallet.ballance}, try again with a lower amount `);
                                        res.redirect('/admins/dashboard');
                                    } else {

                                        UserWallet.findOne(userWalletQuery, (err, userWallet) => {
                                            if(err) throw err;
                                            if(!userWallet) {
                                                req.flash('warningMsg', `Issue with this account, the account might be invalid`);
                                                res.redirect('/admins/dashboard');
                                            } else {
                                                console.log(`Found user with wallet id ${userWallet.wallet_id} `);
                                                // return null;
                                                const new_fund_amount = fund_amount - adminCommission; //deduct the commission from the funding amount
                    
                                                console.log(`Attempting to deduct ${fund_amount} from ${req.user.role}:${req.user.mobile}...`);
                                                AdminWallet.update(
                                                    { 'wallet_id': req.user.mobile, 'user_id': req.user._id }, 
                                                    { $inc: { 'ballance': -new_fund_amount } }, (err) => {
                                                    if(err) throw err;
                                                    
                                                    else {
                                                        console.log(`Deducted ${fund_amount} from ${req.user.role}:${req.user.mobile}..`);
                                                        
                                                        console.log(`Attempting to credit ${fund_amount} to ${wallet_type}:${wallet_id}...`);
                        
                                                        UserWallet.update(
                                                            { 'wallet_id': wallet_id, 'user_id': u_id},
                                                            { $inc: { 'ballance': new_fund_amount} }, 
                                                            (err) => {
                                                                if(err) throw err;
                                                                else {
                                                                    // console.log(`Attempting to credit commission:${fund_amount} to ${req.user.role}:${req.mobile} from ${wallet_type}:${wallet_id}...`);
                    
                                                                    console.log(`Fund:${fund_amount} moved from ${req.user.mobile} to ${wallet_id}...`);
                                                                    req.flash('successMsg', `Account ${wallet_type}:${wallet_id} topped up by ${fund_amount}. commission of N${adminCommission} was charged on ${wallet_type}:${wallet_id} and added back to ${req.user.role}:${req.user.mobile} `);
                                                                    res.redirect('/admins/dashboard');
                                                                }
                                                            }
                                                        )                
                                                    }                            
                                                });
                                            }
                                        })
                                    }
                                }
                            }
                        )

                    }
                    
                }

                if(wallet_type == 'Agent') {
                    let adminPercentage = 5;
                    let adminCommission = req.body.com_to_admin || ((adminPercentage/100) * fund_amount);
                
                    if(isNaN(adminCommission)) {
                        console.log(adminCommission)
                        req.flash('warningMsg', `Please enter a valid commission amount: "${req.body.com_to_admin}" is not a number `);
                        res.redirect('/admins/dashboard');
                    } else {

                        let WalletQuery = {user_id: req.user._id};
                        console.log('adminwallet',WalletQuery);
                        AdminWallet.findOne(
                            {user_id: req.user._id}, 
                            (err, adminWallet) => {
                                if(err) throw err;
                                if(!adminWallet) {
                                    console.log('inside !',adminWallet);
                                    req.flash('warningMsg', `Your admin account was not found`);
                                    res.redirect('/admins/dashboard');
                                } else {
                                    if(fund_amount > adminWallet.ballance) {
                                        req.flash('warningMsg', `Your ballance is too low, cannot move N${fund_amount}, when you only have N${adminWallet.ballance}, try again with a lower amount `);
                                        res.redirect('/admins/dashboard');
                                    } else {

                                        UserWallet.findOne(userWalletQuery, (err, userWallet) => {
                                            if(err) throw err;
                                            if(!userWallet) {
                                                req.flash('warningMsg', `Issue with this account, the account might be invalid`);
                                                res.redirect('/admins/dashboard');
                                            } else {
                                                console.log(`Found user with wallet id ${userWallet.wallet_id} `);
                                                // return null;
                                                const new_fund_amount = fund_amount - adminCommission; //deduct the commission from the funding amount
                    
                                                console.log(`Attempting to deduct ${fund_amount} from ${req.user.role}:${req.user.mobile}...`);
                                                AdminWallet.update(
                                                    { 'wallet_id': req.user.mobile, 'user_id': req.user._id }, 
                                                    { $inc: { 'ballance': -new_fund_amount } }, (err) => {
                                                    if(err) throw err;
                                                    
                                                    else {
                                                        console.log(`Deducted ${fund_amount} from ${req.user.role}:${req.user.mobile}..`);
                                                        
                                                        console.log(`Attempting to credit ${fund_amount} to ${wallet_type}:${wallet_id}...`);
                        
                                                        UserWallet.update(
                                                            { 'wallet_id': wallet_id, 'user_id': u_id},
                                                            { $inc: { 'ballance': new_fund_amount} }, 
                                                            (err) => {
                                                                if(err) throw err;
                                                                else {
                                                                    // console.log(`Attempting to credit commission:${fund_amount} to ${req.user.role}:${req.mobile} from ${wallet_type}:${wallet_id}...`);
                    
                                                                    console.log(`Fund:${fund_amount} moved from ${req.user.mobile} to ${wallet_id}...`);
                                                                    req.flash('successMsg', `Account ${wallet_type}:${wallet_id} topped up by ${fund_amount}. commission of N${adminCommission} was charged on ${wallet_type}:${wallet_id} and added back to ${req.user.role}:${req.user.mobile} `);
                                                                    res.redirect('/admins/dashboard');
                                                                }
                                                            }
                                                        )                
                                                    }                            
                                                });
                                            }
                                        })
                                    }
                                }
                            }
                        )

                    }                    
                }

                if(wallet_type == 'Manager') {
                    let adminPercentage = 0;
                    let adminCommission = req.body.com_to_admin || ((adminPercentage/100) * fund_amount);
                
                    if(isNaN(adminCommission)) {
                        console.log(adminCommission)
                        req.flash('warningMsg', `Please enter a valid commission amount: "${req.body.com_to_admin}" is not a number `);
                        res.redirect('/admins/dashboard');
                    }
                    if(req.user.role != 'Super-Admin') {
                        console.log('Checking for', req.user._id)
                        req.flash('warningMsg', `You cannot fund a fellow Managert: "${req.body.com_to_admin}" is not a number `);
                        res.redirect('/admins/dashboard');
                    } else {

                        let superWallet = {user_id: req.user._id};
                        console.log('superWallet',superWallet);
                        //find the main admin wallet
                        AdminWallet.findOne(
                            {user_id: req.user._id}, 
                            (err, superWallet) => {
                                if(err) throw err;
                                //if the wallet is not found
                                if(!superWallet) {
                                    console.log('inside !',superWallet);
                                    req.flash('warningMsg', `Your admin account was not found`);
                                    res.redirect('/admins/dashboard');
                                } else {
                                    //if the wallet is found
                                    //check the funding amount against the supper admin ballance
                                    if(fund_amount > superWallet.ballance) {
                                        req.flash('warningMsg', `Your ballance is too low, cannot move N${fund_amount}, when you only have N${superWallet.ballance}, try again with a lower amount `);
                                        res.redirect('/admins/dashboard');
                                    } else {
                                        //if all is well with the funding amount and ballance
                                        adminWalletQuery = {user_id: u_id, wallet_id: wallet_id, wallet_type: wallet_type};
                                        //find the manager to fund
                                        AdminWallet.findOne(adminWalletQuery, (err, adminWallet) => {
                                            if(err) throw err;
                                            if(!adminWallet) {
                                                req.flash('warningMsg', `Issue with this account, the account might be invalid`);
                                                res.redirect('/admins/dashboard');
                                            } else {
                                                console.log(`Found user with wallet id ${adminWallet.wallet_id} `);
                                                // return null;
                                                const new_fund_amount = fund_amount - adminCommission; //deduct the commission from the funding amount
                    
                                                console.log(`Attempting to deduct ${fund_amount} from ${req.user.role}:${req.user.mobile}...`);
                                                AdminWallet.update(
                                                    { 'wallet_id': req.user.mobile, 'user_id': req.user._id }, 
                                                    { $inc: { 'ballance': -new_fund_amount } }, (err) => {
                                                    if(err) throw err;
                                                    
                                                    else {
                                                        console.log(`Deducted ${fund_amount} from ${req.user.role}:${req.user.mobile}..`);
                                                        
                                                        console.log(`Attempting to credit ${fund_amount} to ${wallet_type}:${wallet_id}...`);
                        
                                                        AdminWallet.update(
                                                            { 'wallet_id': wallet_id, 'user_id': u_id},
                                                            { $inc: { 'ballance': new_fund_amount} }, 
                                                            (err) => {
                                                                if(err) throw err;
                                                                else {
                                                                    // console.log(`Attempting to credit commission:${fund_amount} to ${req.user.role}:${req.mobile} from ${wallet_type}:${wallet_id}...`);
                    
                                                                    console.log(`Fund:${fund_amount} moved from ${req.user.mobile} to ${wallet_id}...`);
                                                                    req.flash('successMsg', `Account ${wallet_type}:${wallet_id} topped up by ${fund_amount}. commission of N${adminCommission} was charged on ${wallet_type}:${wallet_id} and added back to ${req.user.role}:${req.user.mobile} `);
                                                                    res.redirect('/admins/dashboard');
                                                                }
                                                            }
                                                        )                
                                                    }                            
                                                });
                                            }
                                        })
                                    }
                                }
                            }
                        )

                    }                    
                }

                
                // if(wallet_type == 'Managers') {
                //     adminWalletQuery = {user_id: u_id, wallet_id: wallet_id, wallet_type: wallet_type};
                    
                //     let adminPercentage = 0;
                //     let adminCommission = req.body.com_to_admin || ((adminPercentage/100) * fund_amount);
                
                //     if(isNaN(adminCommission)) {
                //         console.log(adminCommission)
                //         req.flash('warningMsg', `Please enter a valid commission amount: "${req.body.com_to_admin}" is not a number `);
                //         res.redirect('/admins/dashboard');
                //     } else {

                //         AdminWallet.findOne(adminWalletQuery, (err, adminWallet) => {
                //             if(err) throw err;
                //             if(!adminWallet) {
                //                 req.flash('warningMsg', `Issue with this account, the account might be invalid`);
                //                 res.redirect('/admins/dashboard');
                //             } else {
                //                 console.log(`Found user with wallet id ${adminWallet.wallet_id} `);
                //                 // return null;
                //                 const new_fund_amount = fund_amount - adminCommission; //deduct the commission from the funding amount
    
                //                 console.log(`Attempting to deduct ${fund_amount} from ${req.user.role}:${req.user.mobile}...`);
                //                 AdminWallet.update(
                //                     { 'wallet_id': req.user.mobile, 'user_id': req.user._id }, 
                //                     { $inc: { 'ballance': -new_fund_amount } }, (err) => {
                //                     if(err) throw err;
                                    
                //                     else {
                //                         console.log(`Deducted ${fund_amount} from ${req.user.role}:${req.user.mobile}..`);
                                        
                //                         console.log(`Attempting to credit ${fund_amount} to ${wallet_type}:${wallet_id}...`);
        
                //                         AdminWallet.update(
                //                             { 'wallet_id': wallet_id, 'user_id': u_id},
                //                             { $inc: { 'ballance': new_fund_amount} }, 
                //                             (err) => {
                //                                 if(err) throw err;
                //                                 else {
                //                                     // console.log(`Attempting to credit commission:${fund_amount} to ${req.user.role}:${req.mobile} from ${wallet_type}:${wallet_id}...`);
    
                //                                     console.log(`Fund:${fund_amount} moved from ${req.user.mobile} to ${wallet_id}...`);
                //                                     req.flash('successMsg', `Account ${wallet_type}:${wallet_id} topped up by ${fund_amount}. commission of N${adminCommission} was charged on ${wallet_type}:${wallet_id} and added back to ${req.user.role}:${req.user.mobile} `);
                //                                     res.redirect('/admins/dashboard');
                //                                 }
                //                             }
                //                         )                
                //                     }                            
                //                 });
                //             }
                //         })
                //     }
                    
                // }

            }
        }
    }
}
/*
|=======================================================================================================
|// Main Admin Action Ends 
|=======================================================================================================
*/


//Access Control
function ensureAuth(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } else {
        req.flash('errorMsg', 'You need to login to access this page');
        res.redirect('/admins/login');
    }
}

function redirectIfAuth(req, res, next){
    if(req.isAuthenticated()){
        req.flash('infoMsg', 'You are already logged in');
        res.redirect('/admins/dashboard');
    } else {
        return next();
    }
}

module.exports = router;
