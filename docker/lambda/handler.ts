const util = require("util");
const exec = util.promisify(require("child_process").exec);
const AWS = require("aws-sdk");

// get reference to S3 client
const s3 = new AWS.S3();
const Bucket = "dseqr-last-deploy";
const Key = "last-deploy.txt";
const params = {
  Bucket,
  Key,
};
// milliseconds in 12 hours
const minElapsed = 1000 * 60 * 60 * 12;

exports.run = async (event: any, context: any, callback: Function) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // get last deploy call
  let elapsedTime;
  try {
    const data = await s3.getObject(params).promise();
    var lastDeploy = data.Body.toString("ascii");
    console.log("lastDeploy:", lastDeploy);
    elapsedTime = Date.now() - parseInt(lastDeploy);
    console.log("elapsedTime:", elapsedTime);
  } catch (error) {
    console.log(error);
    elapsedTime = 0;
  }

  var cmd = "cd /var/task/dseqr-asg && ";
  const remainingTime = (minElapsed - elapsedTime) / 1000 / 60;

  // only destroy if elasped more than minimum
  if (event.destroy && remainingTime > 0 && !event.force) {
    console.log("Time until destroy:", Math.round(remainingTime), "mins");
    console.log("leaving");
    return;
  } else if (event.destroy) {
    // destroy DseqrAsgStack and deploy DseqrRedirectStack
    cmd +=
      "cdk destroy DseqrAsgStack " +
      "--force " +
      "--output /tmp/cdk.out " +
      "&& " +
      "cdk deploy DseqrRedirectStack " +
      "--require-approval never " +
      "--output /tmp/cdk.out";
  } else {
    // destroy DseqrRedirectStack and deploy DseqrAsgStack
    cmd +=
      "cdk destroy DseqrRedirectStack " +
      "--force " +
      "--output /tmp/cdk.out " +
      "&& " +
      "cdk deploy DseqrAsgStack " +
      "--require-approval never " +
      "--output /tmp/cdk.out";

    // reset last deploy
    try {
      await s3.putObject({ ...params, Body: Date.now().toString() }).promise();
    } catch (error) {
      console.log(error);
      return;
    }
  }
  await exec(cmd);
};
