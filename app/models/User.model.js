//app/models/User.model.js

//Bring in the essentials
const mongoose = require("mongoose");
// const bcrypt = require('bcryptjs');

//Define the admin schema model
const userSchema = mongoose.Schema(
  {
    firstname: String,
    lastname: String,
    mobile: String,
    email: String,
    password: String,
    role: String,
    profile_pic: {
      type: String,
      default: "/public/uploads/users/vector-3.png",
      required: false
    },
    created_by: {
      type: String,
      required: false
    },
    p_check: {
      type: String,
      required: false
    },
    pin: {
      type: Number,
      required: false
    }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  }
);

//admin methods===========================================================
//Generate Bcrypt hash
// adminSchema.methods.generateHash = (password) => {
//     return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
// };

//Check Password Validity
// adminSchema.checkPassword = (password) => {
//     return bcrypt.compareSync(password, this.password);
// };

// create the model for the admins and expose it to our app
module.exports = mongoose.model("User", userSchema);
