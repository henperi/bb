const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const async = require("async");

const router = express.Router();

//Bring in Necessary Models
const User = require("../../app/models/User.model");
const UserWallet = require("../../app/models/UserWallet.model");

//Bring in Necessary Controller
const usersController = require("../../app/controllers/usersController");

//Bring in Necessary Middlewares
const checkAuth = require("../../app/middlewares/checkAuth");

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE");
  }
  next();
});

router.post("/signup", usersController.attemptSignup);
router.post("/login", usersController.attemptSignin);
router.get("/get-user", checkAuth, usersController.getUserData);

router.get(
  "/search/pay/:recieverMobile",
  checkAuth,
  usersController.searchReceiver
);

router.post("/pay", checkAuth, usersController.payUser);

router.use("", (req, res) =>
  res.status(404).json({ message: "This endpoint does not exist" })
);

module.exports = router;
