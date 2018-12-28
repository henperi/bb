const User = require("../models/User.model");
const UserWallet = require("../models/UserWallet.model");

const Admin = require("../models/Admin.model");
const AdminWallet = require("../models/AdminWallet.model");

const PaymentsHistory = require("../models/PaymentsHistory");
const SendFundsHistory = require("../models/SendFundsHistory.model");

const async = require("async");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwt_key = require("../../config/env");

// const checkAuth = require("../middlewares/checkAuth");
const mailer = require("../helpers/mailer");
const notifier = require("../helpers/notifier");

const usersController = {
  /**
   *
   */
  attemptSignup(req, res) {
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();
    req.checkBody("password", "Password is required").notEmpty();
    req
      .checkBody("password_confirmation", "Passwords do not match")
      .equals(req.body.password);
    req.checkBody("firstname", "firstname is required").notEmpty();
    req.checkBody("lastname", "lastname is required").notEmpty();
    req.checkBody("mobile", "Mobile is required").notEmpty();

    const errors = req.validationErrors();

    if (errors) {
      return res.status(409).json({ errors });
    }
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const mobile = req.body.mobile;
    const email = req.body.email.toLowerCase();
    const account_type = "User";
    const password = req.body.password;
    const fcm_token = req.body.fcm_token;

    if (isNaN(mobile)) {
      return res.status(409).json({
        success: false,
        message: "Please signup with a valid number, numeric characters only"
      });
    } else if (mobile.length != 11) {
      return res.status(409).json({
        success: false,
        message: "Your mobile number must be 11 digits only (e.g 08033444555)"
      });
    }
    if (mobile.charAt(0) != "0") {
      return res.status(409).json({
        success: false,
        message: "Mobile number must start with a zero(0) i.e 08067272176"
      });
    } else {
      emailQuery = { email: email };
      mobileQuery = { mobile: mobile };

      async.parallel(
        {
          userEmail: callback => {
            User.findOne(emailQuery).exec(callback);
          },
          userMobile: callback => {
            User.findOne(mobileQuery).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            return res.status(500).json({
              success: false,
              errors: err
            });
          } else if (results.userEmail) {
            return res.status(409).json({
              success: false,
              message: "This email has already been taken"
            });
          } else if (results.userMobile) {
            return res.status(409).json({
              status: false,
              message: "This mobile has already been taken"
            });
          } else {
            // console.log(results);
            const newUser = new User({
              firstname: firstname,
              lastname: lastname,
              mobile: mobile,
              email: email,
              role: "User",
              profile_pic: `${
                req.headers.host
              }/public/uploads/users/vector-3.png`,
              created_by: "Self",
              password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
              p_check: password,
              fcm_token
            });

            newUser.save((err, createdUser) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  errors: err
                });
              } else {
                if (createdUser) {
                  const newUserWallet = new UserWallet({
                    wallet_id: mobile,
                    user_id: createdUser._id,
                    wallet_type: account_type
                  });
                  newUserWallet.save((err, createdWallet) => {
                    if (err) {
                      return res.status(500).json({
                        success: false,
                        errors: err
                      });
                    } else {
                      createdAccount = {
                        // wallet_ref: createdWallet._id,
                        user_id: createdUser._id,
                        firstname,
                        lastname,
                        mobile,
                        email
                      };

                      createdWallet = {
                        wallet_id: createdWallet.wallet_id,
                        user_id: createdWallet.user_id,
                        wallet_type: createdWallet.wallet_type,
                        ballance: createdWallet.ballance,
                        wallet_status: createdWallet.wallet_status
                      };

                      return res.status(201).json({
                        success: true,
                        message: "Your Account has been created",
                        createdAccount,
                        createdWallet
                      });
                    }
                  });
                }
              }
            });
          }
        }
      );
    }
  },
  /**
   *
   */
  attemptSignin(req, res) {
    req.checkBody("email", "Email is required").notEmpty();
    // req.checkBody("email", "Email is not valid").isEmail();
    req.checkBody("password", "Password is required").notEmpty();

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ errors });
    }
    // console.log(req.body.email);
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const fcm_token = req.body.fcm_token;
    
    // console.log(jwt_key);
    emailQuery = { email: email };
    mobileQuery = { mobile: email };

    async.parallel(
      {
        findAccount: callback => {
          User.findOne({
            $or: [emailQuery, mobileQuery]
          }).exec(callback);
        }
      },
      (err, results) => {
        if (err) {
          return res.status(500).json({
            success: false,
            errors: err
          });
        }
        if (!results.findAccount) {
          return res.status(404).json({
            success: false,
            message:
              "Authentication failed, wrong email/mobile and password combination"
          });
        } else {
          const userPassword = results.findAccount.password;
          // if the user is found but the password is wrong
          bcrypt.compare(password, userPassword, (err, isMatch) => {
            if (err) {
              return res.status(500).json({
                success: false,
                errors: err
              });
            }
            if (!isMatch) {
              console.log(`user is found but the password is wrong`);
              return res.status(401).json({
                success: false,
                message:
                  "Authentication failed, wrong email/mobile and password combination"
              });
            } else {
              const token = jwt.sign(
                {
                  user_id: results.findAccount._id,
                  email: results.findAccount.email,
                  wallet_id: results.findAccount.mobile,
                  fullname:
                    results.findAccount.firstname +
                    " " +
                    results.findAccount.lastname
                },
                jwt_key.JWT_KEY
              );
              
              async.parallel(
                {
                  userUpdate: callback => {
                    User.update(emailQuery, {
                      $set: {
                        fcm_token
                      }
                    }).exec(callback);
                  }
                },
                err => {
                  if (err) {
                    console.log(err)
                  } else {
                    const data = {
                      title: "Welcome to Bewla",
                      body: "Make petty payments on the go without stress!"
                    }
                    notifier.sendNotificationOnly(fcm_token, data);
                    return res.status(200).json({
                      success: true,
                      message: "Authentication successful",
                      token
                    });
                  }
                }
              );
            }
          });
        }
      }
    );
  },
  /**
   *
   */
  getUserData(req, res) {
    // console.log(req.userToken);
    const userToken = req.userToken;
    const user_id = userToken.user_id;
    const wallet_id = userToken.wallet_id;
    const email = userToken.email;

    userQuery = { email: email, _id: user_id };
    walletQuery = { wallet_id: wallet_id };

    async.parallel(
      {
        findAccount: callback => {
          User.findOne(userQuery).exec(callback);
        },
        findWallet: callback => {
          UserWallet.findOne(walletQuery).exec(callback);
        }
      },
      (err, results) => {
        // console.log(results);
        if (err) {
          return res.status(500).json({
            success: false,
            errors: err
          });
        }
        if (!results.findAccount) {
          return res.status(404).json({
            success: false,
            message: "This account is invalid"
          });
        }
        if (!results.findWallet) {
          return res.status(404).json({
            success: false,
            message: "This account is invalid"
          });
        } else {
          const {
            firstname,
            lastname,
            mobile,
            email,
            profile_pic,
            createdAt
          } = results.findAccount;

          if (results.findWallet.pin_status == "unset") {
            return res.status(200).json({
              success: true,
              message: "Please Setup Your Payment Pin First",
              userData: {
                user_id: results.findAccount._id,
                firstname,
                lastname,
                mobile,
                email,
                profile_pic,
                createdAt
              },
              userWallet: {
                user_id: results.findWallet.user_id,
                wallet_id: results.findWallet.wallet_id,
                wallet_status: results.findWallet.wallet_status,
                ballance: results.findWallet.ballance,
                wallet_type: results.findWallet.wallet_type,
                pin_status: results.findWallet.pin_status
              }
            });
          }

          return res.status(200).json({
            success: true,
            message: "Fetched user data successfully",
            userData: {
              user_id: results.findAccount._id,
              firstname,
              lastname,
              mobile,
              profile_pic,
              email,
              createdAt
            },
            userWallet: {
              user_id: results.findWallet.user_id,
              wallet_id: results.findWallet.wallet_id,
              wallet_status: results.findWallet.wallet_status,
              ballance: results.findWallet.ballance,
              wallet_type: results.findWallet.wallet_type
            }
          });
        }
      }
    );
  },
  /**
   *
   */
  searchReceiver(req, res) {
    const wallet_id = req.params.recieverMobile;

    userQuery = { mobile: wallet_id };

    async.parallel(
      {
        findAccount: callback => {
          User.findOne(userQuery).exec(callback);
        }
      },
      (err, results) => {
        // console.log(results);
        if (err) {
          return res.status(500).json({
            success: false,
            errors: err
          });
        }
        if (!results.findAccount) {
          return res.status(404).json({
            success: false,
            message: "The receiver mobile does not exist"
          });
        } else {
          console.log(results.findAccount);
          const { _id, firstname, lastname, mobile } = results.findAccount;
          return res.status(200).json({
            success: true,
            message: "Receiver account found",
            receiverData: {
              // wallet_id: mobile,
              _id,
              mobile,
              firstname,
              lastname
            }
          });
        }
      }
    );
  },
  /**
   *
   */
  payUser(req, res) {
    req.checkBody("pay_amount", "Amount is required").notEmpty();
    req.checkBody("receiver_id", "Receiver ID is required").notEmpty();
    req.checkBody("mobile", "Receiver mobile is required").notEmpty();
    req.checkBody("pin", "Your payment pin is required").notEmpty();

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ errors });
    }

    const min_amount = 0;
    const remark = req.body.remark || null;

    const pay_amount = req.body.pay_amount;
    const pin = req.body.pin;

    const receiver_id = req.body.receiver_id;
    const receiver_wallet_id = req.body.mobile;

    const userToken = req.userToken;
    const email = userToken.email;
    const payer_id = userToken.user_id;
    const payer_wallet_id = userToken.wallet_id;
    const payer_name = userToken.fullname;

    if (isNaN(pay_amount)) {
      return res.status(400).json({
        success: false,
        message: "Payment amount is not valid, it must be a number"
      });
    } else if (pay_amount <= min_amount) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount is too small, increase the amount and try again"
      });
    } else {
      payerWalletQuery = {
        user_id: payer_id,
        wallet_id: payer_wallet_id
      };
      receiverWalletQuery = {
        user_id: receiver_id,
        wallet_id: receiver_wallet_id
      };

      UserWallet.findOne(payerWalletQuery, (err, payerWallet) => {
        // console.log(payerWallet);
        if (err) {
          return res.status(400).json({
            success: false,
            error: err
          });
        }
        if (!payerWallet) {
          return res.status(400).json({
            success: false,
            message:
              "Your wallet is inaccessible at the moment, try again later."
          });
        } else {
          if (payerWallet.pin_status != "set") {
            return res.status(400).json({
              success: false,
              message: `Your need to setup your pin `
            });
          }
          if (pin != payerWallet.pin) {
            return res.status(400).json({
              success: false,
              message: `Your pin is invalid `
            });
          }
          if (pay_amount > payerWallet.ballance) {
            return res.status(400).json({
              success: false,
              message: `Your ballance is too low, cannot pay N${pay_amount}, when you only have N${
                payerWallet.ballance
              }, try again with a lower amount`
            });
          } else {
            async.parallel(
              {
                receiverWallet: callback => {
                  UserWallet.findOne(receiverWalletQuery).exec(callback);
                },

                foundReceiver: callback => {
                  User.findOne({ mobile: receiver_wallet_id }).exec(callback);
                },

                foundPayer: callback => {
                  User.findOne({ email }).exec(callback);
                }
              },
              (err, result) => {
                if (err) {
                  return res.status(400).json({
                    success: false,
                    error: err
                  });
                } else {
                  if (!result.receiverWallet) {
                    return res.status(400).json({
                      success: false,
                      message: `Issue with this reciever account, the account might be invalid or inaccessible at the moment.`,
                      developer_msg: `Ensure the receiver_id and mobile sent belongs to the same receiving user. fetch the receivers data from api/users/search/pay endpoint`
                    });
                  } else if (!result.foundReceiver) {
                    return res.status(400).json({
                      success: false,
                      message: `Issue with this reciever account, the receiver mobile could not be found`
                    });
                  } else {
                    const foundReceiver_fullname =
                      result.foundReceiver.firstname +
                      " " +
                      result.foundReceiver.lastname;

                    async.parallel(
                      {
                        payerWalletUpdate: callback => {
                          UserWallet.update(payerWalletQuery, {
                            $inc: { ballance: -pay_amount }
                          }).exec(callback);
                        },

                        receiverWalletUpdate: callback => {
                          UserWallet.update(receiverWalletQuery, {
                            $inc: { ballance: pay_amount }
                          }).exec(callback);
                        }
                      },
                      err => {
                        if (err) {
                          return res.status(400).json({
                            success: false,
                            error: err
                          });
                        } else {
                          const dataToPayer = {
                            notification: {
                              title: `DEBIT: Your Payout of ${pay_amount} was successful`,
                              body: `You transferred N${pay_amount} to ${foundReceiver_fullname}`
                            },
                            data: {
                              debit: pay_amount
                            }
                          }
                          notifier.sendCombined(result.foundPayer.fcm_token, dataToPayer);

                          const dataToReciever = {
                            notification: {
                              title: `CREDIT: You recieved a payment of ${pay_amount}`,
                              body: `N${pay_amount} transferred to you from ${result.foundPayer.firstname} ${result.foundPayer.lastname}`
                            },
                            data: {
                              credit: pay_amount
                            }
                          }
                          notifier.sendCombined(result.foundReceiver.fcm_token, dataToReciever);

                          let newPaymentsHistory = new PaymentsHistory({
                            payer_wallet_id,
                            payer_name,
                            receiver_wallet_id,
                            receiver_name: foundReceiver_fullname,
                            amount: pay_amount,
                            remark: remark
                          });

                          newPaymentsHistory
                            .save()
                            .then(save => {
                              return res.status(200).json({
                                success: true,
                                message: `Payment Successfull`,
                                paymentData: {
                                  pay_amount,
                                  receiver_wallet_id,
                                  receiver_name: foundReceiver_fullname
                                }
                              });
                            })
                            .catch(err => {
                              return res.status(500).json({
                                success: false,
                                errors: err
                              });
                            });
                        }
                      }
                    );
                  }
                }
              }
            );
          }
        }
      });
    }
  },
  /**
   *
   */
  setPin(req, res) {
    req.checkBody("pin", "Pin is required").notEmpty();
    req
      .checkBody(
        "pin_confirmation",
        "Pin Confirmation does not match with supplied pin"
      )
      .equals(req.body.pin);

    const errors = req.validationErrors();

    if (errors) {
      return res.status(409).json({ errors });
    }

    const pin = req.body.pin;

    const userToken = req.userToken;
    const user_id = userToken.user_id;
    const wallet_id = userToken.wallet_id;

    const pin_size = 4;

    if (isNaN(pin)) {
      return res.status(400).json({
        success: false,
        message: "Pin is not valid, it must be a number"
      });
    } else if (pin.length != pin_size) {
      return res.status(400).json({
        success: false,
        message: "Your pin must be a 4 digit number"
      });
    } else {
      userQuery = {
        user_id,
        wallet_id
      };

      UserWallet.findOne(userQuery, (err, userWallet) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: err
          });
        }
        if (!userWallet) {
          return res.status(400).json({
            success: false,
            message:
              "Your wallet is inaccessible at the moment, try again later or contact an Admin"
          });
        }
        if (userWallet.pin_status == "set") {
          return res.status(400).json({
            success: false,
            message: "Your pin has already been setup"
          });
        } else {
          async.parallel(
            {
              userWalletUpdate: callback => {
                UserWallet.update(userQuery, {
                  $set: {
                    pin: pin,
                    pin_status: "set"
                  }
                }).exec(callback);
              }
            },
            err => {
              // console.log('after async: ',result);
              if (err) {
                return res.status(400).json({
                  success: false,
                  error: err
                });
              } else {
                return res.status(200).json({
                  success: true,
                  message: `Pin Setup Successfully`
                });
              }
            }
          );
        }
      });
    }
  },
  /**
   *
   */
  updatePin(req, res) {
    req.checkBody("old_pin", "Pin is required").notEmpty();
    req.checkBody("pin", "Pin is required").notEmpty();
    req
      .checkBody(
        "pin_confirmation",
        "Pin Confirmation does not match with supplied pin"
      )
      .equals(req.body.pin);

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ success: false, errors });
    }

    const old_pin = req.body.old_pin;
    const pin = req.body.pin;

    const userToken = req.userToken;
    const user_id = userToken.user_id;
    const wallet_id = userToken.wallet_id;

    const pin_size = 4;

    if (isNaN(pin)) {
      return res.status(400).json({
        success: false,
        message: "Pin is not valid, it must be a number"
      });
    } else if (pin.length != pin_size) {
      return res.status(400).json({
        success: false,
        message: "Your pin must be a 4 digit number"
      });
    } else {
      userQuery = {
        user_id,
        wallet_id
      };

      UserWallet.findOne(userQuery, (err, userWallet) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err
          });
        }
        if (!userWallet) {
          return res.status(404).json({
            success: false,
            message:
              "Your wallet is inaccessible at the moment, try again later or contact an Admin"
          });
        }
        if (userWallet.pin != old_pin) {
          return res.status(409).json({
            success: false,
            message:
              "Your old pin is incorrect. Please supply the old pin to correctly setup a new pin"
          });
        } else {
          async.parallel(
            {
              userWalletUpdate: callback => {
                UserWallet.update(userQuery, {
                  $set: {
                    pin: pin
                  }
                }).exec(callback);
              }
            },
            err => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  error: err
                });
              } else {
                return res.status(200).json({
                  success: true,
                  message: `Pin Updated Successfully`
                });
              }
            }
          );
        }
      });
    }
  },
  /**
   * This method needs to be updated
   */
  updatePassword(req, res) {
    req.checkBody("old_password", "Password is required").notEmpty();
    req.checkBody("new_password", "Password is required").notEmpty();
    req
      .checkBody(
        "password_confirmation",
        "Password Confirmation does not match with supplied new password"
      )
      .equals(req.body.new_password);

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ success: false, errors });
    }

    const old_password = req.body.old_password;
    const new_password = req.body.new_password;
    const reset_code = req.body.reset_code;

    if (new_password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Your password must be at least 4 characters or more"
      });
    } else {
      
      const userToken = req.userToken;
      const { email } = userToken;

      userQuery = {
        email
      };

      User.findOne(userQuery, (err, user) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err
          });
        }
        if (!user) {
          return res.status(404).json({
            success: false,
            message:
              "Your wallet is inaccessible at the moment, try again later or contact an Admin"
          });
        }
        if (user.p_check != old_password) {
          return res.status(409).json({
            success: false,
            message:
              "Your old password is incorrect. Please supply the old password to correctly setup a new password"
          });
        } else {
          async.parallel(
            {
              userUpdate: callback => {
                User.update(userQuery, {
                  $set: {
                    p_check: new_password,
                    password: bcrypt.hashSync(new_password, bcrypt.genSaltSync(10))
                  }
                }).exec(callback);
              }
            },
            err => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  error: err
                });
              } else {
                return res.status(200).json({
                  success: true,
                  message: `Password Updated Successfully`
                });
              }
            }
          );
        }
      });
    }
  },

  resetPassword(req, res) {
    req.checkBody("reset_code", "Reset Code is required").notEmpty();
    req.checkBody("new_password", "Password is required").notEmpty();
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();
    req
      .checkBody(
        "password_confirmation",
        "Password Confirmation does not match with supplied new password"
      )
      .equals(req.body.new_password);

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ success: false, errors });
    }

    const new_password = req.body.new_password;
    const reset_code = req.body.reset_code;
    const email = req.body.email;

    if (new_password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Your password must be at least 4 characters or more"
      });
    } else {
      
      userQuery = {
        email
      };

      User.findOne(userQuery, (err, user) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err
          });
        }
        if (!user) {
          return res.status(404).json({
            success: false,
            message:
              "Your wallet is inaccessible at the moment, try again later or contact an Admin"
          });
        }
        if (user.resetCode != reset_code) {
          return res.status(409).json({
            success: false,
            message:
              "The reset code is incorrect. Please supply the a correct reset code to continue"
          });
        } else {
          async.parallel(
            {
              userUpdate: callback => {
                User.update(userQuery, {
                  $set: {
                    p_check: new_password,
                    password: bcrypt.hashSync(new_password, bcrypt.genSaltSync(10))
                  }
                }).exec(callback);
              }
            },
            err => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  error: err
                });
              } else {
                return res.status(200).json({
                  success: true,
                  message: `Password Updated Successfully`
                });
              }
            }
          );
        }
      });
    }
  },

  resetPin(req, res) {
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();
    req.checkBody("reset_code", "Reset Code is required").notEmpty();
    req.checkBody("new_pin", "New Pin is required").notEmpty();
    req
      .checkBody(
        "pin_confirmation",
        "Pin Confirmation does not match with supplied new password"
      )
      .equals(req.body.new_pin);

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ success: false, errors });
    }

    const new_pin = req.body.new_pin;
    const reset_code = req.body.reset_code;
    const email = req.body.email;

    if (new_pin.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Your new pin must be at least 4 characters or more"
      });
    } else {
      
      userQuery = {
        email
      };

      User.findOne(userQuery, (err, user) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err
          });
        }
        if (!user) {
          return res.status(404).json({
            success: false,
            message:
              "Your wallet is inaccessible at the moment, try again later or contact an Admin"
          });
        }
        if (user.resetCode != reset_code) {
          return res.status(409).json({
            success: false,
            message:
              "The reset code is incorrect. Please supply the a correct reset code to continue"
          });
        } else {
          userWalletQuery = {
            wallet_id: user.mobile
          };
          async.parallel(
            {
              userWalletUpdate: callback => {
                UserWallet.update(userWalletQuery, {
                  $set: {
                    pin: new_pin
                  }
                }).exec(callback);
              }
            },
            err => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  error: err
                });
              } else {
                return res.status(200).json({
                  success: true,
                  message: `Your Pin Updated Successfully`
                });
              }
            }
          );
        }
      });
    }
  },

  resetPasswordMailer(req, res) {
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ success: false, errors });
    }

    const email = req.body
    userQuery = {
      email
    };

    User.findOne(userQuery, (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err
        });
      } else {
        // Generate Random Capital Strings
        const resetCode = Math.floor(Math.random() * (25 ** 6)).toString(36);
        // Set Password Checker
        // Send An Email
        async.parallel(
          {
            userUpdate: callback => {
              User.update(userQuery, {
                $set: {
                  resetCode
                }
              }).exec(callback);
            }
          },
          err => {
            if (err) {
              return res.status(500).json({
                success: false,
                error: err
              });
            } else {
              mailer.sendPasswordResetMail(email, user.firstname, resetCode)
              return res.status(200).json({
                success: true,
                message: `An email has been sent to you with instructions to reset your password`
              });
            }
          }
        );
      }
    });
    
  },

  resetPinMailer(req, res) {
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ success: false, errors });
    }

    const email = req.body
    userQuery = {
      email
    };

    User.findOne(userQuery, (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err
        });
      } else {
        // Generate Random Capital Strings
        const resetCode = Math.floor(Math.random() * (25 ** 6)).toString(36);
        // Set Password Checker
        // Send An Email
        async.parallel(
          {
            userUpdate: callback => {
              User.update(userQuery, {
                $set: {
                  resetCode
                }
              }).exec(callback);
            }
          },
          err => {
            if (err) {
              return res.status(500).json({
                success: false,
                error: err
              });
            } else {
              mailer.sendPinResetMail(email, user.firstname, resetCode)
              return res.status(200).json({
                success: true,
                message: `An email has been sent to you with instructions to reset your pin`
              });
            }
          }
        );
      }
    });
    
  },
  /**
   *
   */
  getTransactionHistory(req, res) {
    const userToken = req.userToken;
    const user_id = userToken.user_id;
    const wallet_id = userToken.wallet_id;
    const email = userToken.email;

    payoutQuery = { payer_wallet_id: wallet_id };
    receiveQuery = { receiver_wallet_id: wallet_id };

    async.parallel(
      {
        payOutHistory: callback => {
          PaymentsHistory.find(payoutQuery)
            .sort({ _id: -1 })
            .exec(callback);
        },
        receiveHistory: callback => {
          PaymentsHistory.find(receiveQuery)
            .sort({ _id: -1 })
            .exec(callback);
        },
        receiveFundHistory: callback => {
          SendFundsHistory.find(receiveQuery)
            .sort({ _id: -1 })
            .exec(callback);
        }
      },
      (err, result) => {
        if (err) return next(err);
        else {
          const receiveFundHistory = result.receiveFundHistory;

          const fundingHistory = [];
          receiveFundHistory.forEach(historyItem => {
            let transaction_type = "Bank To Wallet Transaction";
            if (
              historyItem.sender_role == "Super-Admin" ||
              historyItem.sender_role == "Manager"
            ) {
              transaction_type = "Admin To User Transaction";
            }
            if (historyItem.sender_role == "Agent") {
              transaction_type = "Agent To User Transaction";
            }

            item = {
              from: historyItem.sender_name,
              to: historyItem.receiver_name,
              amount: historyItem.amount,
              commission: historyItem.commission,
              remark: historyItem.remark,
              transaction_type,
              createdAt: historyItem.createdAt
            };

            fundingHistory.push(item);
          });

          return res.status(200).json({
            success: true,
            message: `Your History Fetched Successfully`,
            payOutHistory: result.payOutHistory,
            receiveHistory: result.receiveHistory,
            fundingHistory
          });
        }
      }
    );
  },
  /**
   *Search an Admin To pay
   *{@param: mobile} adminMobile
   */
  searchAdmin(req, res) {
    const wallet_id = req.params.adminMobile;

    userQuery = { mobile: wallet_id };

    async.parallel(
      {
        findAccount: callback => {
          Admin.findOne(userQuery).exec(callback);
        }
      },
      (err, results) => {
        if (err) {
          return res.status(500).json({
            success: false,
            errors: err
          });
        }
        if (!results.findAccount) {
          return res.status(404).json({
            success: false,
            message: "There is no admin with this mobile account"
          });
        } else {
          console.log(results.findAccount);
          const { _id, firstname, lastname, mobile } = results.findAccount;
          return res.status(200).json({
            success: true,
            message: "Admin cashout account found",
            receiverData: {
              _id,
              mobile,
              firstname,
              lastname
            }
          });
        }
      }
    );
  },
  /**
   * Cashout via admin is synonunymous to paying an Admin
   * {@param} requires => {pay_amount, receiver_id, mobile, pin}
   */
  payAdmin(req, res) {
    req.checkBody("pay_amount", "Amount is required").notEmpty();
    req.checkBody("receiver_id", "Receiver ID is required").notEmpty();
    req.checkBody("mobile", "Receiver mobile is required").notEmpty();
    req.checkBody("pin", "Your payment pin is required").notEmpty();

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ success: false, errors });
    }

    const min_amount = 0;
    const remark = req.body.remark || null;

    const pay_amount = req.body.pay_amount;
    const pin = req.body.pin;

    const receiver_id = req.body.receiver_id;
    const receiver_wallet_id = req.body.mobile;

    const userToken = req.userToken;
    const email = userToken.email;
    const payer_id = userToken.user_id;
    const payer_wallet_id = userToken.wallet_id;
    const payer_name = userToken.fullname;

    if (isNaN(pay_amount)) {
      return res.status(400).json({
        success: false,
        message: "Cashout amount is not valid, it must be a number"
      });
    } else if (pay_amount <= min_amount) {
      return res.status(400).json({
        success: false,
        message:
          "Cashout amount is too small, increase the amount and try again"
      });
    } else {
      payerWalletQuery = {
        user_id: payer_id,
        wallet_id: payer_wallet_id
      };
      receiverWalletQuery = {
        user_id: receiver_id,
        wallet_id: receiver_wallet_id
      };

      UserWallet.findOne(payerWalletQuery, (err, payerWallet) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err
          });
        }
        if (!payerWallet) {
          return res.status(404).json({
            success: false,
            message:
              "Your wallet is inaccessible at the moment, try again later."
          });
        } else {
          if (payerWallet.pin_status != "set") {
            return res.status(400).json({
              success: false,
              message: `Your need to setup your pin `
            });
          }
          if (pin != payerWallet.pin) {
            return res.status(409).json({
              success: false,
              message: `Your pin is invalid `
            });
          }
          if (pay_amount > payerWallet.ballance) {
            return res.status(400).json({
              success: false,
              message: `Your ballance is too low, cannot pay N${pay_amount}, when you only have N${
                payerWallet.ballance
              }, try again with a lower amount`
            });
          } else {
            async.parallel(
              {
                receiverWallet: callback => {
                  AdminWallet.findOne(receiverWalletQuery).exec(callback);
                },

                foundReceiver: callback => {
                  Admin.findOne({ mobile: receiver_wallet_id }).exec(callback);
                },

                foundPayer: callback => {
                  User.findOne({ email }).exec(callback);
                }
              },
              (err, result) => {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    error: err
                  });
                } else {
                  if (!result.receiverWallet) {
                    return res.status(500).json({
                      success: false,
                      message: `Issue with this cashout account, the admin wallet account details sent might be invalid.`,
                      developer_msg: `Ensure the receiver_id and mobile sent belongs to the same receiving admin. fetch the receivers 
                      data from api/users/search/cashout/:adminMobile endpoint`
                    });
                  } else if (!result.foundReceiver) {
                    return res.status(404).json({
                      success: false,
                      message: `Issue with this Admin account, the admin mobile sent does not exist`
                    });
                  } else {
                    const foundReceiver_fullname =
                      result.foundReceiver.firstname +
                      " " +
                      result.foundReceiver.lastname;

                    async.parallel(
                      {
                        payerWalletUpdate: callback => {
                          UserWallet.update(payerWalletQuery, {
                            $inc: { ballance: -pay_amount }
                          }).exec(callback);
                        },

                        receiverWalletUpdate: callback => {
                          AdminWallet.update(receiverWalletQuery, {
                            $inc: { ballance: pay_amount }
                          }).exec(callback);
                        }
                      },
                      err => {
                        if (err) {
                          return res.status(500).json({
                            success: false,
                            error: err
                          });
                        } else {

                          const dataToPayer = {
                            notification: {
                              title: `DEBIT: Your Payout of ${pay_amount} was successful`,
                              body: `You transferred N${pay_amount} to ${foundReceiver_fullname}`
                            },
                            data: {
                              debit: pay_amount
                            }
                          }
                          notifier.sendCombined(result.foundPayer.fcm_token, dataToPayer);

                          let newPaymentsHistory = new PaymentsHistory({
                            payer_wallet_id,
                            payer_name,
                            receiver_wallet_id,
                            receiver_name: foundReceiver_fullname,
                            amount: pay_amount,
                            remark: remark,
                            type: "Cashout"
                          });

                          let newFundsHistory = new SendFundsHistory({
                            sender_wallet_id: payer_wallet_id,
                            sender_name: payer_name,
                            receiver_wallet_id,
                            receiver_name: foundReceiver_fullname,
                            amount: pay_amount,
                            sender_role: "User",
                            receiver_role: result.foundReceiver.role,
                            remark: remark,
                            commission: 0
                          });

                          newPaymentsHistory
                            .save()
                            .then(newFundsHistory.save())
                            .then(save => {
                              return res.status(200).json({
                                success: true,
                                message: `Cashout amount successfully sent, collect your cash`,
                                paymentData: {
                                  pay_amount,
                                  receiver_wallet_id,
                                  receiver_name: foundReceiver_fullname
                                }
                              });
                            })
                            .catch(err => {
                              return res.status(500).json({
                                success: false,
                                errors: err
                              });
                            });
                        }
                      }
                    );
                  }
                }
              }
            );
          }
        }
      });
    }
  },
  /**
   * Update profile pic
   */
  updatePic(req, res) {
    console.log(req.userToken);
    console.log(req.file);

    const userToken = req.userToken;
    const { email } = userToken;

    userQuery = {
      email
    };

    User.findOne(userQuery, (err, user) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err
        });
      }
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Account not found"
        });
      } else {
        async.parallel(
          {
            userProfileUpdate: callback => {
              User.update(userQuery, {
                $set: {
                  profile_pic: req.file.path
                }
              }).exec(callback);
            }
          },
          err => {
            if (err) {
              return res.status(400).json({
                success: false,
                error: err
              });
            } else {
              return res.status(200).json({
                success: true,
                message: `Profile picture updated successfully`,
                profile_pic: `${req.headers.host}/${req.file.path}`
              });
            }
          }
        );
      }
    });
  }
};

module.exports = usersController;
