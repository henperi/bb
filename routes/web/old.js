    //Taking off User and Agents
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
    //Taking off User and Agents