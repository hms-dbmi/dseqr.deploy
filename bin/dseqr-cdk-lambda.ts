#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { CDKLambdaDocker } from "../lib/dseqr-cdk-lambda-stack";

const app = new cdk.App();
new CDKLambdaDocker(app, "CDKLambdaDockerStack");
