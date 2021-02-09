"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDKLambdaDocker = void 0;
const path = require("path");
const iam = require("@aws-cdk/aws-iam");
const cdk = require("@aws-cdk/core");
const Lambda = require("@aws-cdk/aws-lambda");
class CDKLambdaDocker extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.CDKLambdaDocker = CDKLambdaDocker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHNlcXItY2RrLWxhbWJkYS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRzZXFyLWNkay1sYW1iZGEtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQTZCO0FBQzdCLHdDQUF3QztBQUV4QyxxQ0FBcUM7QUFDckMsOENBQThDO0FBRzlDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQWMsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsK0JBQStCO1FBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXJELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ25ELFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUNoQixPQUFPLEVBQUU7Z0JBQ1AsK0JBQStCO2dCQUMvQixnQ0FBZ0M7Z0JBQ2hDLGtDQUFrQztnQkFDbEMsNEJBQTRCO2dCQUM1QixtQ0FBbUM7Z0JBQ25DLG9DQUFvQztnQkFDcEMsaUNBQWlDO2dCQUNqQyxnQ0FBZ0M7Z0JBQ2hDLDRCQUE0QjthQUM3QjtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUM3QyxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDaEIsT0FBTyxFQUFFO2dCQUNQLE1BQU07Z0JBQ04scUJBQXFCO2dCQUNyQix3QkFBd0I7Z0JBQ3hCLE9BQU87Z0JBQ1AsV0FBVztnQkFDWCxPQUFPO2dCQUNQLG9CQUFvQjtnQkFDcEIsZUFBZTtnQkFDZixlQUFlO2dCQUNmLE9BQU87Z0JBQ1AsVUFBVTtnQkFDVixjQUFjO2FBQ2Y7U0FDRixDQUFDLENBQUM7UUFFSCxtREFBbUQ7UUFDbkQsc0RBQXNEO1FBQ3RELHlCQUF5QjtRQUN6QixJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQy9DLElBQUksRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUM7WUFDdkQsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxVQUFVLEVBQUUsSUFBSTtZQUNoQixhQUFhLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxjQUFjLENBQUM7U0FDdEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbERELDBDQWtEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiQGF3cy1jZGsvYXdzLWlhbVwiO1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcIkBhd3MtY2RrL2NvcmVcIjtcbmltcG9ydCAqIGFzIExhbWJkYSBmcm9tIFwiQGF3cy1jZGsvYXdzLWxhbWJkYVwiO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tIFwiQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXlcIjtcblxuZXhwb3J0IGNsYXNzIENES0xhbWJkYURvY2tlciBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBDb25maWd1cmUgcGF0aCB0byBEb2NrZXJmaWxlXG4gICAgY29uc3QgZG9ja2VyZmlsZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vZG9ja2VyXCIpO1xuXG4gICAgY29uc3QgY2xvdWRmb3JtYXRpb25Qb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICByZXNvdXJjZXM6IFtcIipcIl0sXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIFwiY2xvdWRmb3JtYXRpb246RGVzY3JpYmVTdGFja3NcIixcbiAgICAgICAgXCJjbG91ZGZvcm1hdGlvbjpDcmVhdGVDaGFuZ2VTZXRcIixcbiAgICAgICAgXCJjbG91ZGZvcm1hdGlvbjpEZXNjcmliZUNoYW5nZVNldFwiLFxuICAgICAgICBcImNsb3VkZm9ybWF0aW9uOkdldFRlbXBsYXRlXCIsXG4gICAgICAgIFwiY2xvdWRmb3JtYXRpb246R2V0VGVtcGxhdGVTdW1tYXJ5XCIsXG4gICAgICAgIFwiY2xvdWRmb3JtYXRpb246RGVzY3JpYmVTdGFja0V2ZW50c1wiLFxuICAgICAgICBcImNsb3VkZm9ybWF0aW9uOkV4ZWN1dGVDaGFuZ2VTZXRcIixcbiAgICAgICAgXCJjbG91ZGZvcm1hdGlvbjpEZWxldGVDaGFuZ2VTZXRcIixcbiAgICAgICAgXCJjbG91ZGZvcm1hdGlvbjpEZWxldGVTdGFja1wiLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlc291cmNlUG9saWN5ID0gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgcmVzb3VyY2VzOiBbXCIqXCJdLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBcInMzOipcIixcbiAgICAgICAgXCJlbGFzdGljZmlsZXN5c3RlbToqXCIsXG4gICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6KlwiLFxuICAgICAgICBcImFjbToqXCIsXG4gICAgICAgIFwicm91dGU1MzoqXCIsXG4gICAgICAgIFwiZWMyOipcIixcbiAgICAgICAgXCJjb2duaXRvLWlkZW50aXR5OipcIixcbiAgICAgICAgXCJjb2duaXRvLWlkcDoqXCIsXG4gICAgICAgIFwiYXV0b3NjYWxpbmc6KlwiLFxuICAgICAgICBcImlhbToqXCIsXG4gICAgICAgIFwibGFtYmRhOipcIixcbiAgICAgICAgXCJjbG91ZGZyb250OipcIixcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQVdTIExhbWJkYSBmdW5jdGlvbiBhbmQgcHVzaCBpbWFnZSB0byBFQ1JcbiAgICAvLyBjb3VsZG4ndCBmaWd1cmUgb3V0IGhvdyB0byBhZGQgYXBpIGdhdGV3YXkgZW5kcG9pbnRcbiAgICAvLyBuZWVkIHRvIGFkZCBpbiBjb25zb2xlXG4gICAgbmV3IExhbWJkYS5Eb2NrZXJJbWFnZUZ1bmN0aW9uKHRoaXMsIFwiZnVuY3Rpb25cIiwge1xuICAgICAgY29kZTogTGFtYmRhLkRvY2tlckltYWdlQ29kZS5mcm9tSW1hZ2VBc3NldChkb2NrZXJmaWxlKSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDE1KSxcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICBpbml0aWFsUG9saWN5OiBbY2xvdWRmb3JtYXRpb25Qb2xpY3ksIHJlc291cmNlUG9saWN5XSxcbiAgICB9KTtcbiAgfVxufVxuIl19