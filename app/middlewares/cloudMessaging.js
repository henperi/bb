const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(__dirname + '/../../config/bewla-a5988-firebase-adminsdk-h1r17-ee4cae2b73.json')

/*
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'bewla-a5988',
    clientEmail: 'firebase-adminsdk-h1r17@bewla-a5988.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCn876nVSXpShaM\nX9VkI5YFv5c6/KPFXB9GrJxT3MLSBfvC+KNXpO6soaLDA0oPtmBlkdKO6fJCYyrW\noYeR8eCcVmjfnJKXRHYLZku0438D0D7TOlb1Vh7++w6d+7gj2tQOONdFAmcPw5Sn\n8D4Zr0YK21qUat6NtvQ7eSsvylSXYfm4idzZrmayBba84xISB2YfplcJXGT2NYbk\na8vWC0uBV61auXTdUrQKdNIGU/fbi/6mJQWfOGKd9/V0sjP7ZI31sxvCUwL4/KHX\n7hg2eWiJIAs22Pr6gFlG63So+tmovXQcEoTXTwBKtEp923PIeMG0gpIAFdvf153l\nOs/uWtmPAgMBAAECggEASqXW6Ne7FG/WCskzdqEsdlyb8l9EyRzzV72zc8CspJ19\nM0DAlN1dKcRjq6qEGey09p/0Boorn18lNKUxtOfdLY9oaG7WZr5KezGZ14m/s+m0\narzE1qFTAICElCpDw0fpNXMFFwqE1ShYI7ZvW4ogJwYswceoKDOXZPGrhL+4jlmI\nybCWHw7zKMeV1HZghWc1cgLZiPwrXXBHa0W5C+LPB3X2QMJGHq0tJg8M9P+g89kX\nI8YWjSHtieK2DG29MJgIBKkCNwDZsglb12sLRp36h+kWxFWwGjnfxOuNB8aPSFMB\nVkX9qdnzptR21j39CkyCRl9lW6uvsxY+LiqaQ/iIYQKBgQDQSWZQ3aK+LfZ9TtXh\nDa2AeJase3nDMsQBL9ERV8wiSGDyoZxWectP1QO9il+j6ydnS+0ysxuixX5qsmUr\nNo1834vkRVn3dQ9PirbFlY+uNmn2yThSSSgys4lT968iuOxWCs6lhYo9IoS2kYIV\nzjkX0WZPPOjM8l38dXdB/04coQKBgQDObP7bG4D9OAJaNytFT9kVUNwN9IsrKyXu\nstUOUFqMFEaShHuTYjZdt13rrreD6pwQs+rXYW+9Mo1BaqG1F/zN36rySUpncy8n\nZb3n7JpbNX8qswcJ1Zoix+SENlijRfFrL3JkJMCNc5UljttmwT6/u3w8Mls55/Xz\n0VZaC4SYLwKBgHm/rdLu+sX3z/EHN/XJLPW/hzNjKZV0AyY+cRKWI3iWnjS1StEx\neCo99WXBkI4cUngK5aeREkJe9rofdQuBY8ruULMp5qDDCCQSjSuJdOb8X4wlqopO\nwPSCBW/Tg8fkGCFjR89w85EwsCqXe1aLqMvHVupSTDIgKdf8Qa2OMnaBAoGBAIb5\nNdtGrJzl1oPutthnUWZirMBjOexMFk1xmWX2nH4jc9Gx1quT+EBm+X51i4EyEkHJ\norCaAVoQh9RSSNIEkUR8D2bFDWV/J0H3gKj5SCSDYlclIGEJzfMYCQ96CZMY1LZl\nG8LnVRAol0krk8IocUMk8CLcOlIund+C7ZeLGHP5AoGAPhCAu28lryfjZbhrdqGY\nyrhW1dy46zVlfyKGzGkSvPfcF/dUe/w+f3d7DQlBzcZkE5YlYmWBlG4AMUWT75vh\nfLYWbjpww22OyCCDxRy7cyHV135OyBfKfNykGpyN9LuVKKbr/7lxBPZ1XDSUN3wP\nQQzAA0CNJhHYcbdYH2eJArI=\n-----END PRIVATE KEY-----\n'
  }),
  databaseURL: 'https://bewla-a5988.firebaseio.com'
});
*/

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bewla-a5988.firebaseio.com"
});

const sendFCM = (targetUserAppToken, title, body) => {
  const registrationToken = targetUserAppToken;

  const payload = {
    // title: "Account Deposit",
    // body: "A deposit to your savings account has just cleared."
    notification: {
      title: title,
      body: body
    },
    // data: {
    //   amount: data.amount,
    //   balance: "$3020.25"
    // }
  };

  const options = {
    contentAvailable: true,
    priority: "high",
  };

  admin.messaging().sendToDevice(registrationToken, payload, options)
    .then((response) => {
        console.log("Successfully sent message:", response);
    })
    .catch((error) => {
        console.log("Error sending message:", error);
    }); 
}

module.export = sendFCM;