# AWS CDN Image Resizer

TypeScript AWS CDK contruct which creates an _basic_ image resizing CDN using CloudFront, S3, API Gateway and Lambda.

## Construct Props

| Name                         | Type             |
| ---------------------------- | ---------------- |
| restApiName                  | `string`         |
| defaultCorsPreflightOptions? | [CorsOptions][1] |
| functionMemory?              | `number`         |
| storageClass?                | `string`         |
| maxAgeSeconds?               | `number`         |

## Props

| Name                      | Type                           |
| ------------------------- | ------------------------------ |
| cloudFrontWebDistribution | [CloudFrontWebDistribution][2] |
| bucket                    | [Bucket][3]                    |
| restApi                   | [LambdaRestApi][4]             |
| resizerFunction           | [Function][5]                  |

## Usage

```typescript
import { Construct, Stack, StackProps } from '@aws-cdk/core';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cdnImageResizer = new CDNImageResizer(this, 'CDNImageResizer', {
      restApiName: 'my-image-resizer-api',
      defaultCorsPreflightOptions: {
        allowOrigins: ['example.com'],
      },
    });
  }
}
```

[1]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-apigateway.CorsOptions.html
[2]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-cloudfront.CloudFrontWebDistribution.html
[3]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-s3.Bucket.html
[4]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-apigateway.LambdaRestApi.html
[5]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda.Function.html
