import { exec } from "child_process";

exports.run = (event, context, callback) => {
  exec(
    "cd /var/task/dseqr-asg && cdk deploy DseqrAsgFromLambdaStack --require-approval never --output /tmp/cdk.out",
    (error, stdout, stderr) => {
      if (error) {
        callback(error);
      }
      callback(null, stdout);
    }
  );
};
