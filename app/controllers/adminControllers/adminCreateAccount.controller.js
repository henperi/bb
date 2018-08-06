
// let createUsers =  (req, res) => {
    
//     // console.log(req.body.firstname, req.body.lastname, req.body.mobile, req.body.email, req.body.password);

//     // req.checkBody('firstname', 'Firstname is required').notEmpty();
//     // req.checkBody('lastname', 'Lastname is required').notEmpty();
//     // req.checkBody('mobile', 'Mobile is required').notEmpty();
//     // req.checkBody('email', 'Email is required').notEmpty();
//     // req.checkBody('email', 'Email is not valid').isEmail();
//     // req.checkBody('account_type', 'Account Type is required').notEmpty();
//     // req.checkBody('password', 'Password is required').notEmpty();
    
//     // let errors = req.validationErrors();

//     // if(errors){
//     //     console.log(`Validation Errors: ${JSON.stringify(errors)}`);
//     //     req.flash('error', errors);
//     //     res.redirect('create');
//     // } 

// }

// module.exports = createUsers;

// const firstname = req.body.firstname;
// const lastname = req.body.lastname;
// const mobile = req.body.mobile;
// const email = req.body.email.toLowerCase();
// const password = req.body.password;
// // const password_confirmation = req.body.password_confirmation;

// let errors = req.validationErrors();

// if(errors){
//     console.log(`Validation Errors: ${JSON.stringify(errors)}`);
//     req.flash('error', errors);
//     res.redirect('signup');
// } else {
//     emailQuery = {email: email};
    
//     Admin.findOne(emailQuery, (err, admin) => {
//         if(err) {
//             console.log(`Error: ${err}`)
//         }
//         if(admin) {
//             console.log(`This admin email exists already: ${admin}`);
//             req.flash('errorMsg', 'This email has been taken');
//             res.redirect('signup');
//         } else {
//             mobileQuery = {mobile: mobile};
//             Admin.findOne(mobileQuery, (err, admin_mobile) => {
//                 if(err) {
//                     console.log(`Error: ${err}`)
//                 }
//                 if(admin_mobile) {
//                     console.log(`This admin mobile exists already: ${admin_mobile}`);
//                     req.flash('errorMsg', 'This mobile has been taken');
//                     res.redirect('signup');
//                 } else {
//                     console.log("checking for mobile:" +mobile)
//                     let newAdmin = new Admin({
//                         firstname: firstname,
//                         lastname: lastname, 
//                         mobile: mobile, 
//                         email: email, 
//                         role: "Super-Admin", 
//                         password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
//                         p_check: password
//                     });

//                     newAdmin.save( (err, registeredAdmin) => {
//                         if(err) throw err;
//                         else {
//                             console.log(`Admin saved to the database ${registeredAdmin}`);

//                             let newAdminWallet = new AdminWallet({
//                                 wallet_id: mobile,
//                                 user_id: registeredAdmin._id, 
//                             });
//                             newAdminWallet.save( (err, registerdWallet) => {
//                                 if(err) throw err;
//                                 else {
//                                     console.log(`AdminWallet saved to the database ${registerdWallet}`);
//                                 }
//                             })

//                             req.flash('successMsg', 'You have registered successfully, Login to your account now');
//                             res.redirect('login');
//                         }
//                     });

//                 }
//             })
//         }
//     })
// }