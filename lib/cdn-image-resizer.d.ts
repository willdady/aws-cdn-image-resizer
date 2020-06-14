import { Construct } from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
export interface CDNImageResizerProps {
    restApiName: string;
    defaultCorsPreflightOptions?: apigateway.CorsOptions;
    functionMemory?: number;
    storageClass?: 'STANDARD' | 'REDUCED_REDUNDANCY' | 'STANDARD_IA' | 'ONEZONE_IA' | 'INTELLIGENT_TIERING' | 'GLACIER' | 'DEEP_ARCHIVE';
    maxAgeSeconds?: number;
}
export default class CDNImageResizer extends Construct {
    cloudFrontWebDistribution: cloudfront.CloudFrontWebDistribution;
    bucket: s3.Bucket;
    restApi: apigateway.LambdaRestApi;
    resizerFunction: lambda.Function;
    constructor(scope: Construct, id: string, props: CDNImageResizerProps);
}
