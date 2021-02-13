import * as path from "path";
import * as iam from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as targets from "@aws-cdk/aws-events-targets";
import { Rule, Schedule, RuleTargetInput } from "@aws-cdk/aws-events";

export class DseqrFromLambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Configure path to Dockerfile
    const dockerfile = path.join(__dirname, "../docker");

    const cloudformationPolicy = new iam.PolicyStatement({
      resources: ["*"],
      actions: [
        "cloudformation:DescribeStacks",
        "cloudformation:CreateChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:GetTemplate",
        "cloudformation:GetTemplateSummary",
        "cloudformation:DescribeStackEvents",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DeleteChangeSet",
        "cloudformation:DeleteStack",
      ],
    });

    // TODO: make more restrictive
    const resourcePolicy = new iam.PolicyStatement({
      resources: ["*"],
      actions: [
        "s3:*",
        "elasticfilesystem:*",
        "elasticloadbalancing:*",
        "acm:*",
        "route53:*",
        "ec2:*",
        "cognito-identity:*",
        "cognito-idp:*",
        "autoscaling:*",
        "iam:*",
        "lambda:*",
        "cloudfront:*",
        "logs:*",
        "events:*",
      ],
    });

    // Create AWS Lambda function and push image to ECR
    // couldn't figure out how to add http api gateway endpoint
    // need to add in console
    const cdkLambda = new lambda.DockerImageFunction(
      this,
      "DeployDseqrLambda",
      {
        code: lambda.DockerImageCode.fromImageAsset(dockerfile),
        timeout: cdk.Duration.minutes(15),
        memorySize: 512,
        initialPolicy: [cloudformationPolicy, resourcePolicy],
      }
    );

    // check every hour for possible destroy
    new Rule(this, "ScheduleRule", {
      schedule: Schedule.rate(cdk.Duration.hours(1)),
      targets: [
        new targets.LambdaFunction(cdkLambda, {
          event: RuleTargetInput.fromObject({ destroy: true }),
        }),
      ],
    });
  }
}
