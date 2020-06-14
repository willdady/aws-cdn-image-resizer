# AWS CDN Image Resizer

TypeScript AWS CDK contruct which creates an basic image resizing CDN using CloudFront, S3, API Gateway and Lambda.

Once deployed images in the deployed S3 bucket are accessible via the deployed CloudFront endpoint e.g.

```
https://d3i3pfoeixxxxx.cloudfront.net/foo.png
```

To request a resized version of an image prefix the S3 key with dimensions.

```
https://d3i3pfoeixxxxx.cloudfront.net/200x200/foo.png
```

Dimensions can be specified as `<width>x<height>`, `<width>` or `x<height>` (note the preceding x when specifying height only). Images are resized using [sharp][8] which is deployed as a lambda layer.


### Note

* AWS publishes and maintains [Serverless Image Handler][7], which *may* be a better choice depending on your use case (does not use AWS CDK).

## Construct Props

| Name                         | Type             | Description                                                                         |
| ---------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| restApiName                  | `string`         | Name for the REST API                                                               |
| defaultCorsPreflightOptions? | [CorsOptions][1] | CORS options used by the REST API and Lambda function                               |
| functionMemory?              | `number`         | Amount of memory to assign to lambda function. Default 256.                         |
| storageClass?                | `string`         | [Storage class][6] used for derived images. Default 'STANDARD_IA'.                  |
| maxAgeSeconds?               | `number`         | CacheControl to set on derived images written to S3 bucket. Default 604800 (7 days) |

## Props

The following properties are available on this construct's instance.

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
[6]: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
[7]: https://aws.amazon.com/solutions/implementations/serverless-image-handler/
[8]: https://github.com/lovell/sharp