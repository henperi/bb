const jwt = require("jsonwebtoken");
const jwt_key = require("../../config/env");

module.exports = (req, res, next) => {
  try {
    const sentToken = req.headers.authorization.split(" ")[1] || req.body.token;
    // || req.params.token;
    if (!sentToken) {
      return res.status(400).json({
        success: false,
        message: "Token is required"
      });
    }
    const decodedToken = jwt.verify(sentToken, jwt_key.JWT_KEY);
    req.userToken = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};
