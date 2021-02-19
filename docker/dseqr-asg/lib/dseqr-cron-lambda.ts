import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as path from "path";
import * as efs from "@aws-cdk/aws-efs";
import * as targets from "@aws-cdk/aws-events-targets";
import { Rule, Schedule } from "@aws-cdk/aws-events";

interface DseqrCronProps extends cdk.StackProps {
  fileSystem: efs.IFileSystem;
}

export class DseqrCronLambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: DseqrCronProps) {
    super(scope, id, props);

    const { fileSystem } = props;

    const ap = new efs.AccessPoint(this, "AccessPointLambda", { fileSystem });

    // check if live on port 8080
    const cronLambda = new lambda.Function(this, "CronLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      handler: "cron.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      filesystem: lambda.FileSystem.fromEfsAccessPoint(ap, "/mnt/dseqr"),
    });

    // run cleanup jobs every hour
    new Rule(this, "ScheduleRule", {
      schedule: Schedule.rate(cdk.Duration.hours(1)),
      targets: [new targets.LambdaFunction(cronLambda, {})],
    });
  }
}
