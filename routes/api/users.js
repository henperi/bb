const express = require("express");
const moment = require("moment");

const router = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/users/profile");
  },
  filename: (req, file, cb) => {
    cb(null, `${req.userToken.email}.${file.mimetype.split("/")[1]}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    //reject file
    cb(error => new Error("Invalid image format"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 2
  },
  fileFilter
});

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
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
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

/**
 * Search an Admin to Cashout through
 * {@returns the admins data required to pay}
 */
router.get(
  "/search/cashout/:adminMobile",
  checkAuth,
  usersController.searchAdmin
);
/**
 * Pay/Cashout via an Admin
 * {@param requires the data from the cashout search}
 * [@returns] the payment status
 */
router.post("/cashout", checkAuth, usersController.payAdmin);

router.post("/set-pin", checkAuth, usersController.setPin);
router.post("/update-pin", checkAuth, usersController.updatePin);
router.post("/reset-pin", checkAuth, usersController.updatePin);

router.post("/update-password", checkAuth, usersController.updatePassword);
router.post("/reset-password", checkAuth, usersController.updatePassword);

router.get(
  "/transaction-history",
  checkAuth,
  usersController.getTransactionHistory
);

router.post(
  "/profile/update-pic",
  checkAuth,
  upload.single("profile_image"),
  usersController.updatePic
);

router.use("", (req, res) =>
  res.status(404).json({ message: "This endpoint does not exist" })
);

module.exports = router;
