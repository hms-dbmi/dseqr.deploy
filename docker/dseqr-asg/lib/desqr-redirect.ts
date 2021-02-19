import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as cf from "@aws-cdk/aws-cloudfront";

interface DseqrRedirectProps extends cdk.StackProps {
  zone: route53.IHostedZone;
}

// TODO automate setup of CF distribution  and S3 redirect bucket
// see https://engineering.resolvergroup.com/2020/06/how-to-redirect-an-apex-domain-to-www-using-cloudfront-and-s3/

export class DseqrRedirectStack extends cdk.Stack {
  //   public readonly redirectCertificate: acm.ICertificate;

  constructor(scope: cdk.App, id: string, props: DseqrRedirectProps) {
    super(scope, id, props);

    const { zone } = props;

    const distributionId = this.node.tryGetContext("cf_id");
    const domainName = this.node.tryGetContext("cf_domain");

    const aliasTarget = new alias.CloudFrontTarget(
      cf.Distribution.fromDistributionAttributes(this, "DseqrDistribution", {
        distributionId,
        domainName,
      })
    );

    // add A record for domain to direct to load balencer
    new route53.ARecord(this, "DseqrRedirect", {
      zone,
      target: route53.RecordTarget.fromAlias(aliasTarget),
      ttl: cdk.Duration.seconds(0),
    });
  }
}
