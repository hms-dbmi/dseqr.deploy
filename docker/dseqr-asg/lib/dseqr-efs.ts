import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk from "@aws-cdk/core";
import * as efs from "@aws-cdk/aws-efs";
import * as lambda from "@aws-cdk/aws-lambda";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import * as path from "path";

interface DseqrEfsProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class DseqrEfsStack extends cdk.Stack {
  public readonly fileSystem: efs.IFileSystem;
  constructor(scope: cdk.App, id: string, props: DseqrEfsProps) {
    super(scope, id, props);

    let { vpc } = props;

    // user configurable parameters (e.g. cdk deploy -c instance_type="r5.large")
    const keepEFS = this.node.tryGetContext("keep_efs") || true;
    const fileSystemId = this.node.tryGetContext("efs_id");
    const EFSSecurityGroupId = this.node.tryGetContext("efs_sg_id");

    // both efs is and efs security group id or neither
    if (
      (!fileSystemId && EFSSecurityGroupId) ||
      (fileSystemId && !EFSSecurityGroupId)
    ) {
      throw "must provide both efs_id and efs_sg_id to use existing EFS";
    }

    // are we keeping EFS on cdk destroy? default is TRUE
    const removalPolicy = keepEFS
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // script that is run on startup

    // EFS setup

    // new EFS to share between instances
    const fileSystem = new efs.FileSystem(this, "EFS", {
      vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS, // transition to infrequent access
      removalPolicy,
    });
    const accessPoint = fileSystem.addAccessPoint("AccessPoint", {
      posixUser: {
        gid: "0",
        uid: "0",
      },
    });

    fileSystem.connections.allowDefaultPortFromAnyIpv4();

    // lambda cleanup function (to delete fastq and other large files)
    const cronLambda = new lambda.Function(this, "CronLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      handler: "cron.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: cdk.Duration.minutes(3),
      filesystem: lambda.FileSystem.fromEfsAccessPoint(
        accessPoint,
        "/mnt/dseqr"
      ),
      vpc,
    });

    // run cleanup jobs every 6
    new Rule(this, "ScheduleRule", {
      schedule: Schedule.rate(cdk.Duration.hours(6)),
      targets: [new targets.LambdaFunction(cronLambda)],
    });

    this.fileSystem = fileSystem;
  }
}
