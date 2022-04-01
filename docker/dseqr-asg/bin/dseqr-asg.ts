#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { DseqrZoneStack } from "../lib/dseqr-zone";
import { DseqrAsgStack } from "../lib/dseqr-asg";
import { DseqrCognitoStack } from "../lib/dseqr-cognito";
import { DseqrEfsStack } from "../lib/dseqr-efs";
import { DseqrVpcStack } from "../lib/dseqr-vpc";
import { DseqrRedirectStack } from "../lib/desqr-redirect";

const app = new cdk.App();
const env = { region: "us-east-2" };

// stacks for auto scaling group setup
const zoneStack = new DseqrZoneStack(app, "DseqrZoneStack", {
  env,
});

const VpcStack = new DseqrVpcStack(app, "DseqrVpcStack", { env });

const EfsStack = new DseqrEfsStack(app, "DseqrEfsStack", {
  vpc: VpcStack.vpc,
  env,
});

const cognitoStack = new DseqrCognitoStack(app, "DseqrCognitoStack", {
  zone: zoneStack.zone,
  env,
});

new DseqrAsgStack(app, "DseqrAsgStack", {
  certificate: zoneStack.certificate,
  authCertificate: cognitoStack.authCertificate,
  zone: zoneStack.zone,
  vpc: VpcStack.vpc,
  userPool: cognitoStack.userPool,
  userPoolClient: cognitoStack.userPoolClient,
  userPoolClientSecret: cognitoStack.userPoolClientSecret,
  fileSystem: EfsStack.fileSystem,
  env,
});

// stack that redirects dseqr.com to docs.dseqr.com when DseqrAsgStack is down
// new DseqrRedirectStack(app, "DseqrRedirectStack", {
//   zone: zoneStack.zone,
// });
