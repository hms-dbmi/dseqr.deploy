const AWS = require("aws-sdk");

// get reference to S3 client
const s3 = new AWS.S3();
const Bucket = "dseqr-user-backup";


exports.handler = async (event: any, context: any, callback: Function) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  
  if (event.request.userAttributes.email) {
    // add user email to bucket
    const Body = {
      date: Date.now().toString(),
      userAttributes: event.request.userAttributes
    }

    const params = {
      Bucket,
      Key: event.request.userAttributes.email,
      Body: JSON.stringify(Body)
    };

    try {
      await s3.putObject(params).promise();
    } catch (error) {
      console.log(error);
    }
  }
  // Return to Amazon Cognito
  callback(null, event);
};
