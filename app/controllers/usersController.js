const User = require("../models/User.model");
const UserWallet = require("../models/UserWallet.model");
const PaymentsHistory = require("../models/PaymentsHistory");

const async = require("async");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwt_key = require("../../config/env");

// const checkAuth = require("../middlewares/checkAuth");

const usersController = {
  /**
   *
   */
  attemptSignup(req, res) {
    // req.checkBody("username", "username is required").notEmpty();
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
          console.log(results);
          const newUser = new User({
            firstname: firstname,
            lastname: lastname,
            mobile: mobile,
            email: email,
            role: "User",
            created_by: "Self",
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
            p_check: password
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
                      user_id: createdUser._id,
                      wallet_ref: createdWallet._id,
                      firstname,
                      lastname,
                      mobile,
                      email
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
  },

  /**
   *
   */
  attemptSignin(req, res) {
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();
    req.checkBody("password", "Password is required").notEmpty();

    const errors = req.validationErrors();

    if (errors) {
      return res.status(400).json({ errors });
    }
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    // console.log(jwt_key);
    emailQuery = { email: email };

    async.parallel(
      {
        findAccount: callback => {
          User.findOne(emailQuery).exec(callback);
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
            message: "This email is invalid"
          });
        } else {
          // console.log(results);
          // console.log(password, userPassword);
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
                message: "Authentication failed"
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
                jwt_key.JWT_KEY,
                {
                  expiresIn: "5d"
                }
              );
              return res.status(200).json({
                success: true,
                message: "Authentication successful",
                token
              });
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
    console.log(req.userToken);
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
            createdAt
          } = results.findAccount;
          return res.status(302).json({
            success: true,
            message: "Fetched user data successfully",
            userData: {
              user_id: results.findAccount._id,
              firstname,
              lastname,
              mobile,
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
          return res.status(302).json({
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
    const pay_amount = req.body.pay_amount;
    const remark = req.body.remark || null;
    const min_amount = 0;

    const receiver_id = req.body.receiver_id;
    const receiver_wallet_id = req.body.mobile;

    const userToken = req.userToken;
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
          if (pay_amount > payerWallet.ballance) {
            return res.status(400).json({
              success: false,
              message: `Your ballance is too low, cannot pay N${pay_amount}, when you only have N${
                payerWallet.ballance
              }, try again with a lower amount `
            });
          } else {
            async.parallel(
              {
                receiverWallet: callback => {
                  UserWallet.findOne(receiverWalletQuery).exec(callback);
                },

                foundReceiver: callback => {
                  User.findOne({ mobile: receiver_wallet_id }).exec(callback);
                }
              },
              (err, result) => {
                // console.log('after async: ',result);
                if (err) {
                  return res.status(400).json({
                    success: false,
                    error: err
                  });
                } else {
                  if (!result.receiverWallet) {
                    return res.status(400).json({
                      success: false,
                      message: `Issue with this reciever account, the account might be invalid or inaccessible at the momemnt`
                    });
                  } else if (!result.foundReceiver) {
                    return res.status(400).json({
                      success: false,
                      message: `Issue with this reciever account, the receiver details are inaccurate`
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
                              return res.status(400).json({
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
  }
};

module.exports = usersController;
