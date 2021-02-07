#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const { DseqrCdkLambdaStack } = require('../lib/dseqr-cdk-lambda-stack');

const app = new cdk.App();
new DseqrCdkLambdaStack(app, 'DseqrCdkLambdaStack');
