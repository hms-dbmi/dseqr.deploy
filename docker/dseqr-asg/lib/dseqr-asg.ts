import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as efs from "@aws-cdk/aws-efs";
import * as cognito from "@aws-cdk/aws-cognito";
import * as route53_targets from "@aws-cdk/aws-route53-targets";
import * as lambda from "@aws-cdk/aws-lambda";
import * as targets from "@aws-cdk/aws-elasticloadbalancingv2-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as cw from "@aws-cdk/aws-cloudwatch";
import * as fs from "fs";
import * as path from "path";
import { RemovalPolicy } from "@aws-cdk/core";

interface DseqrASGProps extends cdk.StackProps {
  certificate: acm.ICertificate;
  authCertificate: acm.ICertificate;
  zone: route53.IHostedZone;
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
  userPoolClientSecret: string;
  vpc: ec2.IVpc;
  fileSystem: efs.IFileSystem;
}

export class DseqrAsgStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: DseqrASGProps) {
    super(scope, id, props);

    const {
      certificate,
      userPool,
      userPoolClient,
      userPoolClientSecret,
      vpc,
      fileSystem,
      authCertificate,
      zone
    } = props;

    // user configurable parameters (e.g. cdk deploy -c instance_type="r5.large")
    const instanceType =
      this.node.tryGetContext("instance_type") || "r6i.2xlarge";
    const volumeSize = this.node.tryGetContext("volume_size") || 18;
    const keyName = this.node.tryGetContext("ssh_key_name");
    const zoneName = this.node.tryGetContext("domain_name");
    const exampleData = this.node.tryGetContext("example_data") || true;

    // check for ssh key
    if (typeof keyName == "undefined") {
      throw "ssh_key_name not provided";
    }

    // create a load balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
    });

    // add A record for domain to direct to load balencer
    const DseqrARecord = new route53.ARecord(this, "ARecord", {
      zone: zone,
      ttl: cdk.Duration.seconds(0),
      target: route53.RecordTarget.fromAlias(new alias.LoadBalancerTarget(lb)),
    });


    // user supplied domain for signin page
    // this depends on A record for root domain
    const userPoolDomain = new cognito.UserPoolDomain(this, "UserPoolDomain", {
      userPool,
      // cognitoDomain: {
      //   domainPrefix: "dseqr",
      // },
      customDomain: {
        domainName: `auth.${zoneName}`,
        certificate: authCertificate,
      },
    });


    userPoolDomain.node.addDependency(DseqrARecord);

    // A record for signin page
    new route53.ARecord(this, "UserPoolCloudFrontAliasRecord", {
      zone,
      recordName: `auth.${zoneName}`,
      target: route53.RecordTarget.fromAlias(
        new route53_targets.UserPoolDomainTarget(userPoolDomain)
      ),
    });

    const userData = ec2.UserData.forLinux();

    // add EFS mount to userData
    userData.addCommands(
      "apt-get -y update",
      "apt-get -y upgrade",
      "apt-get -y install amazon-efs-utils",
      "apt-get -y install nfs-common",
      "file_system_id_1=" + fileSystem.fileSystemId,
      "efs_mount_point_1=/srv/dseqr",
      'mkdir -p "${efs_mount_point_1}"',
      'test -f "/sbin/mount.efs" && echo "${file_system_id_1}:/ ${efs_mount_point_1} efs defaults,_netdev" >> /etc/fstab || ' +
        'echo "${file_system_id_1}.efs.' +
        cdk.Stack.of(this).region +
        '.amazonaws.com:/ ${efs_mount_point_1} nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport,_netdev 0 0" >> /etc/fstab',
      "mount -a -t efs,nfs4 defaults"
    );

    // init cloud-watch agent for memory-based scaling
    const configPath =
      "/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json";
    userData.addCommands(
      "wget https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb",
      "dpkg -i -E ./amazon-cloudwatch-agent.deb",
      `curl -o ${configPath} https://raw.githubusercontent.com/hms-dbmi/dseqr.deploy/master/docker/dseqr-asg/lib/amazon-cloudwatch-agent.json`,
      `sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:${configPath}`
    );

    // variables to setup application.yml for cognito
    userData.addCommands(
      `USE_COGNITO=true`,
      `EXAMPLE_DATA=${exampleData}`,
      `REGION=us-east-2`,
      `USER_POOL_ID=${userPool.userPoolId}`,
      `AUTH_DOMAIN=auth.${zoneName}`,
      `CLIENT_ID=${userPoolClient.userPoolClientId}`,
      `HOST_URL=${zoneName}`,
      `CLIENT_SECRET=${userPoolClientSecret}`
    );

    // also replace dseqr.com in configuration script
    const startupScript = fs.readFileSync("lib/configure.sh", "utf8");
    userData.addCommands(startupScript);

    // allow SSH onto instances
    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow inbound SSH"
    );

    //  create autoscaling group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, "ASG", {
      vpc,
      instanceType: new ec2.InstanceType(instanceType),
      machineImage: new ec2.GenericLinuxImage({
        "us-east-2": "ami-0dd9f0e7df0f0a138",
      }),
      minCapacity: 1,
      maxCapacity: 4,
      userData,
      associatePublicIpAddress: true,
      securityGroup,
      keyName,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      spotPrice: "0.192", // m5.xlarge on demand price
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: autoscaling.BlockDeviceVolume.ebs(volumeSize),
        },
      ],
    });

    autoScalingGroup.scaleOnMetric("ScaleToMemoryUsage", {
      metric: new cw.Metric({
        metricName: "mem_used_percent",
        namespace: "CWAgent",
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      scalingSteps: [
        { upper: 10, change: -1 },
        { lower: 60, change: +1 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      estimatedInstanceWarmup: cdk.Duration.seconds(600),
    });

    //  policy for cloudwatch agent
    autoScalingGroup.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "logs:*",
          "cloudwatch:*",
          "ec2:DescribeTags",
          "autoscaling:SetInstanceProtection",
        ],
      })
    );

    autoScalingGroup.scaleOnCpuUtilization("ScaleToCPU", {
      cooldown: cdk.Duration.seconds(900),
      estimatedInstanceWarmup: cdk.Duration.seconds(600),
      targetUtilizationPercent: 60,
    });

    // redirect to 443
    lb.addRedirect();

    // check if live on port 8080
    const lambdaFunction = new lambda.Function(this, "LambdaHealth", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      handler: "health.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
    });

    // listen on 443
    const listener = lb.addListener("Listener", {
      port: 443,
      certificates: [certificate],
    });

    // for checking that server is live
    listener.addTargets("LambdaHealthTarget", {
      priority: 1,
      conditions: [elbv2.ListenerCondition.httpRequestMethods(["OPTIONS"])],
      targets: [new targets.LambdaTarget(lambdaFunction)],
    });

    // send to port 80 on instances (shinyproxy)
    listener.addTargets("Targets", {
      port: 80,
      targets: [autoScalingGroup],
      stickinessCookieDuration: cdk.Duration.days(3), // requests from same session to same instance
    });

    listener.connections.allowDefaultPortFromAnyIpv4("Open to the world");
  }
}
