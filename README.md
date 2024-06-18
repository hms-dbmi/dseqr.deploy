## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


## Deploying

```
# build child stack inside `docker/dseqr-asg`
AWS_PROFILE='profile_name'
AWS_DEFAULT_REGION='us-east-2'
nvm use v16.16.0

cd docker/dseqr-asg
yarn install
npm run build

# update stack
# BE CAREFUL: CHECK THAT NOT DELETING RESOURCE
cdk diff DseqrZoneStack
cdk deploy DseqrZoneStack
```

```
# build/deploy parent stack
#
cd ../..
yarn install
npm run build
cdk diff
cdk deploy
```
