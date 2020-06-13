import * as path from 'path';
import { Construct, Duration } from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';

export interface CDNImageResizerProps {
  restApiName: string;
  defaultCorsPreflightOptions?: apigateway.CorsOptions;
  functionMemory?: number;
  storageClass?:
    | 'STANDARD'
    | 'REDUCED_REDUNDANCY'
    | 'STANDARD_IA'
    | 'ONEZONE_IA'
    | 'INTELLIGENT_TIERING'
    | 'GLACIER'
    | 'DEEP_ARCHIVE';
  maxAgeSeconds?: number;
}

export default class CDNImageResizer extends Construct {
  cloudFrontWebDistribution: cloudfront.CloudFrontWebDistribution;
  bucket: s3.Bucket;
  restApi: apigateway.LambdaRestApi;
  resizerFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: CDNImageResizerProps) {
    super(scope, id);

    const sharpLayer = new lambda.LayerVersion(this, 'SharpLayer', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', 'lambda-layers', 'sharp', 'layer.zip')
      ),
    });

    this.resizerFunction = new lambda.Function(this, 'ResizerFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', 'lambda', 'image-processor'),
        {
          exclude: ['*.ts'],
        }
      ),
      memorySize: props.functionMemory || 256,
      layers: [sharpLayer],
      environment: {
        ALLOW_ORIGINS: (
          props.defaultCorsPreflightOptions?.allowOrigins || []
        ).join(','),
        STORAGE_CLASS: props.storageClass || 'STANDARD_IA',
        MAX_AGE_SECONDS: `${props.maxAgeSeconds ?? '604800'}`, // 7 days
      },
    });

    this.restApi = new apigateway.LambdaRestApi(this, 'RESTApi', {
      handler: this.resizerFunction,
      defaultCorsPreflightOptions: props.defaultCorsPreflightOptions,
      restApiName: props.restApiName,
    });

    this.bucket = new s3.Bucket(this, 'Bucket', {
      websiteIndexDocument: 'index.html',
      websiteRoutingRules: [
        {
          condition: {
            httpErrorCodeReturnedEquals: '404',
          },
          hostName: `${this.restApi.restApiId}.execute-api.${process.env.CDK_DEFAULT_REGION}.amazonaws.com`,
          replaceKey: {
            prefixWithKey: 'prod/',
          },
          protocol: s3.RedirectProtocol.HTTPS,
          httpRedirectCode: '302',
        },
      ],
    });

    // Make the bucket publicly accessible but limit access by user agent. See
    // https://stackoverflow.com/a/59240416
    const grant = this.bucket.grantPublicAccess();
    grant.resourceStatement?.addCondition('StringEquals', {
      'aws:UserAgent': 'Amazon CloudFront',
    });

    // Expose bucket name to our lambda as an environment variable
    this.resizerFunction.addEnvironment('BUCKET_NAME', this.bucket.bucketName);

    // Grant the lambda function's role read/write access to the bucket
    this.bucket.grantReadWrite(this.resizerFunction);

    this.cloudFrontWebDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      'CloudFront',
      {
        originConfigs: [
          {
            customOriginSource: {
              domainName: this.bucket.bucketWebsiteDomainName,
              originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                defaultTtl: Duration.minutes(0),
              },
            ],
          },
        ],
      }
    );

    // Expose the cloudfront domain to our lambda so it's able to redirect there
    // after successfully writing the resized image to the bucket
    this.resizerFunction.addEnvironment(
      'CLOUDFRONT_DOMAIN_NAME',
      this.cloudFrontWebDistribution.domainName
    );
  }
}
