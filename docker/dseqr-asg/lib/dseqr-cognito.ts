import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as cr from "aws-cdk-lib/custom-resources";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import { RemovalPolicy } from "aws-cdk-lib";


interface DseqrCognitoProps extends cdk.StackProps {
  zone: route53.IHostedZone;
}
export class DseqrCognitoStack extends cdk.Stack {
  public readonly userPoolClientSecret: string;
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolClient: cognito.IUserPoolClient;
  public readonly authCertificate: acm.ICertificate;
  
  constructor(scope: cdk.App, id: string, props: DseqrCognitoProps) {
    super(scope, id, props);
    
    // user configurable parameters (e.g. cdk deploy -c instance_type="r5.large")
    const zoneName = this.node.tryGetContext("domain_name");
    
    // both zone name and id
    if (!zoneName) {
      throw "must provide domain_name";
    }

    // cognito for authentication
    // create new pool/client
    const userPool = new cognito.UserPool(this, "userpool", {
      userPoolName: "dseqr-userpool",
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // email: cognito.UserPoolEmail.withSES({fromEmail: "noreply@dseqr.com"}),
      userInvitation: {
        emailBody: "Due to technical issue we reset your <a href='https://docs.dseqr.com'>dseqr.com</a> password for {username}. Your temporary password is <b>{####}</b>"
      },
    });
    
    const userPoolClient = userPool.addClient("dseqr-app-client", {
      oAuth: {
        callbackUrls: [`https://${zoneName}/login/oauth2/code/shinyproxy`],
        logoutUrls: [`https://${zoneName}`],
      },
      generateSecret: true,
    });
    
    
    // get client secret (need in configure.sh)
    const describeCognitoUserPoolClient = new cr.AwsCustomResource(
      this,
      "DescribeCognitoUserPoolClient",
      {
        resourceType: "Custom::DescribeCognitoUserPoolClient",
        onCreate: {
          region: "us-east-2",
          service: "CognitoIdentityServiceProvider",
          action: "describeUserPoolClient",
          parameters: {
            UserPoolId: userPool.userPoolId,
            ClientId: userPoolClient.userPoolClientId,
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            userPoolClient.userPoolClientId
            ),
          },
          // TODO: can we restrict this policy more?
          policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
            resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
          }),
        }
        );
        
        const userPoolClientSecret = describeCognitoUserPoolClient.getResponseField(
          "UserPoolClient.ClientSecret"
          );
          
          // backup user emails to S3 bucket with lambda
          const s3Policy = new iam.PolicyStatement({
            resources: ["*"],
            actions: [
              "s3:*"
            ],
          });
          
          const backupUsersLambda = new lambda.Function(this, 'BackupUsers', {
            code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
            handler: "backup-users.handler",
            runtime: lambda.Runtime.NODEJS_18_X,
            initialPolicy: [s3Policy],
            environment: {
              userPoolId: userPool.userPoolId
            }
          });
          
          // permission for lambda
          const invokeCognitoTriggerPermission = {
            principal: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
            sourceArn: userPool.userPoolArn
          }
          
          backupUsersLambda.addPermission('InvokeBackupUsersPermission', invokeCognitoTriggerPermission)
          
          // set backup lambda to run after user confirmation
          new cr.AwsCustomResource(this, "UpdateUserPool", {
            resourceType: "Custom::UpdateUserPool",
            onUpdate: {
              region: "us-east-2",
              service: "CognitoIdentityServiceProvider",
              action: "updateUserPool",
              parameters: {
                UserPoolId: userPool.userPoolId,
                LambdaConfig: {
                  PostConfirmation: backupUsersLambda.functionArn,
                },
              },
              physicalResourceId: cr.PhysicalResourceId.of(userPool.userPoolId),
            },
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE }),
          });
          
          // using custom domain for userpool authentication requires certificate in us-east-1
          const authCertificate = new acm.DnsValidatedCertificate(
            this,
            "authCertificate",
            {
              domainName: `auth.${zoneName}`,
              hostedZone: props.zone,
              region: "us-east-1",
            },
            );
            
            this.userPoolClientSecret = userPoolClientSecret;
            this.userPool = userPool;
            this.userPoolClient = userPoolClient;
            this.authCertificate = authCertificate;
            
          }
        }
        