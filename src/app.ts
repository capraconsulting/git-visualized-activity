import * as cdk from "@aws-cdk/core"
import { tagResources } from "@liflig/cdk"
import { getEcrAsset } from "./asset"
import { WebStack } from "./web-stack"
import { WebDeployStack } from "./web-deploy-stack"
import { WorkerStack } from "./worker-stack"

const projectName = "git-visualized-activity"

const incubatorEnv = {
  accountId: "001112238813",
  // Resources in us-east-1.
  cloudfront: {
    webBucketName: "liflig-incubator-gva-web",
    region: "us-east-1",
    certificateArn:
      "arn:aws:acm:us-east-1:923402097046:certificate/8c02e2fe-9399-4c51-8801-3c1af58eba1b",
  },
  // TODO: Must be resolved deploy-time due to cross-region.
  distributionId: "todo-not-resolved-yet",
  domainName: "gva.incubator.capra.tv",
  hostedZoneId: "TODO",
  region: "eu-west-1",
  resourcePrefix: "liflig-incubator-gva",
  // TODO: Update to use incubator subnets.
  subnetIdList: ["subnet-29616151", "subnet-95bd9ddf", "subnet-b6c425df"],
  vpcId: "vpc-0f0d43198daee2247",
}

// See https://github.com/capraconsulting/webapp-deploy-lambda
const deployCodeS3Bucket = "capra-webapp-deploy-lambda-releases"
const deployCodeS3Key = "release-0.1.0.zip"

const jenkinsRoleArn =
  "arn:aws:iam::923402097046:role/buildtools-jenkins-RoleJenkinsSlave-JQGYHR5WE6C5"
const buildBucketName = "incub-common-build-artifacts-001112238813-eu-west-1"

const app = new cdk.App()
tagResources(app, (stack) => ({
  StackName: stack.stackName,
  Project: projectName,
  SourceRepo: "github/capraconsulting/git-visualized-activity-infra",
}))

new WebDeployStack(app, `${incubatorEnv.resourcePrefix}-web-deploy`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.region,
  },
  callerRoleArn: jenkinsRoleArn,
  roleName: "liflig-incubator-gva-jenkins",
  deployCodeS3Bucket,
  deployCodeS3Key,
  // TODO: Dynamically resolve.
  distributionId: incubatorEnv.distributionId,
  buildsBucketName: buildBucketName,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
  resourcePrefix: incubatorEnv.resourcePrefix,
})

new WorkerStack(app, `${incubatorEnv.resourcePrefix}-worker`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.region,
  },
  resourcePrefix: incubatorEnv.region,
  vpcId: incubatorEnv.vpcId,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
  workerAsset: getEcrAsset("worker"),
})

new WebStack(app, `${incubatorEnv.resourcePrefix}-web`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.cloudfront.region,
  },
  acmCertificateArn: incubatorEnv.cloudfront.certificateArn,
  domainName: incubatorEnv.domainName,
  hostedZoneId: incubatorEnv.hostedZoneId,
  resourcePrefix: incubatorEnv.resourcePrefix,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
})
