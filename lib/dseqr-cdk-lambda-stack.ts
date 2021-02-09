import * as path from "path";
import * as iam from "@aws-cdk/aws-iam";

import * as cdk from "@aws-cdk/core";
import * as Lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";

export class CDKLambdaDocker extends cdk.Stack {
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
      ],
    });

    // Create AWS Lambda function and push image to ECR
    // couldn't figure out how to add api gateway endpoint
    // need to add in console
    new Lambda.DockerImageFunction(this, "function", {
      code: Lambda.DockerImageCode.fromImageAsset(dockerfile),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      initialPolicy: [cloudformationPolicy, resourcePolicy],
    });
  }
}
