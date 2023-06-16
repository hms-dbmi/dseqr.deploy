#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DseqrFromLambdaStack } from "../lib/dseqr-from-lambda";

const app = new cdk.App();
new DseqrFromLambdaStack(app, "DseqrFromLambdaStack");
