const admin = require("firebase-admin");

const serviceAccount = require("../../config/bewla-a5988-firebase-adminsdk-h1r17-d66efec786.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bewla-a5988.firebaseio.com"
});

const notifier = {
  /**
   * @description This method is used to send notifications combined with data
   * @param {String} fcm_token
   * @param {Object} data
   * @returns {Boolen} Status of sent email
   */
  sendCombined(fcm_token, payload) {
    const options = {
      priority: "high"
    };
    if(fcm_token) {
      admin.messaging().sendToDevice(fcm_token, payload, options)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
    }
  },
  /**
   * @description This method is used to send notifications combined with data
   * @param {String} fcm_token
   * @param {Object} data
   * @returns {Boolen} Status of sent email
   */
  sendNotificationOnly(fcm_token, data) {
    
    const payload = {
      notification: {
        title: data.title,
        body: data.body
      }
    };
    const options = {
      priority: "high"
    };

    if (fcm_token) {
      admin.messaging().sendToDevice(fcm_token, payload, options)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
    }
  },
  /**
   * @description This method is used to send data to a device
   * @param {String} fcm_token
   * @param {Object} data
   * @returns {Boolen} Status of sent email
   */
  sendDataOnly(fcm_token, data) {
    
    const payload = {
      data: {
        account: "Savings",
        balance: "$3020.25"
      }
    };
    const options = {
      priority: "high"
    };

    if(fcm_token) {
      admin.messaging().sendToDevice(fcm_token, payload, options)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
    }
  }
};

module.exports = notifier;