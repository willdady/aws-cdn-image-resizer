"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const core_1 = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const cloudfront = require("@aws-cdk/aws-cloudfront");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
class CDNImageResizer extends core_1.Construct {
    constructor(scope, id, props) {
        var _a, _b, _c;
        super(scope, id);
        const sharpLayer = new lambda.LayerVersion(this, 'SharpLayer', {
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-layers', 'sharp', 'layer.zip')),
        });
        this.resizerFunction = new lambda.Function(this, 'ResizerFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'image-processor'), {
                exclude: ['*.ts'],
            }),
            memorySize: props.functionMemory || 256,
            layers: [sharpLayer],
            environment: {
                ALLOW_ORIGINS: (((_a = props.defaultCorsPreflightOptions) === null || _a === void 0 ? void 0 : _a.allowOrigins) || []).join(','),
                STORAGE_CLASS: props.storageClass || 'STANDARD_IA',
                MAX_AGE_SECONDS: `${(_b = props.maxAgeSeconds) !== null && _b !== void 0 ? _b : '604800'}`,
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
        (_c = grant.resourceStatement) === null || _c === void 0 ? void 0 : _c.addCondition('StringEquals', {
            'aws:UserAgent': 'Amazon CloudFront',
        });
        // Expose bucket name to our lambda as an environment variable
        this.resizerFunction.addEnvironment('BUCKET_NAME', this.bucket.bucketName);
        // Grant the lambda function's role read/write access to the bucket
        this.bucket.grantReadWrite(this.resizerFunction);
        this.cloudFrontWebDistribution = new cloudfront.CloudFrontWebDistribution(this, 'CloudFront', {
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: this.bucket.bucketWebsiteDomainName,
                        originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    },
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                            defaultTtl: core_1.Duration.minutes(0),
                        },
                    ],
                },
            ],
        });
        // Expose the cloudfront domain to our lambda so it's able to redirect there
        // after successfully writing the resized image to the bucket
        this.resizerFunction.addEnvironment('CLOUDFRONT_DOMAIN_NAME', this.cloudFrontWebDistribution.domainName);
    }
}
exports.default = CDNImageResizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RuLWltYWdlLXJlc2l6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZG4taW1hZ2UtcmVzaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZCQUE2QjtBQUM3Qix3Q0FBb0Q7QUFDcEQsc0NBQXNDO0FBQ3RDLHNEQUFzRDtBQUN0RCxzREFBc0Q7QUFDdEQsOENBQThDO0FBaUI5QyxNQUFxQixlQUFnQixTQUFRLGdCQUFTO0lBTXBELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7O1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxVQUFVLEdBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDN0QsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FDbEU7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDbEUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsRUFDdkQ7Z0JBQ0UsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDO2FBQ2xCLENBQ0Y7WUFDRCxVQUFVLEVBQUUsS0FBSyxDQUFDLGNBQWMsSUFBSSxHQUFHO1lBQ3ZDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQztZQUNwQixXQUFXLEVBQUU7Z0JBQ1gsYUFBYSxFQUFFLENBQ2IsT0FBQSxLQUFLLENBQUMsMkJBQTJCLDBDQUFFLFlBQVksS0FBSSxFQUFFLENBQ3RELENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDWCxhQUFhLEVBQUUsS0FBSyxDQUFDLFlBQVksSUFBSSxhQUFhO2dCQUNsRCxlQUFlLEVBQUUsR0FBRyxNQUFBLEtBQUssQ0FBQyxhQUFhLG1DQUFJLFFBQVEsRUFBRTthQUN0RDtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDM0QsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQzdCLDJCQUEyQixFQUFFLEtBQUssQ0FBQywyQkFBMkI7WUFDOUQsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDMUMsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxtQkFBbUIsRUFBRTtnQkFDbkI7b0JBQ0UsU0FBUyxFQUFFO3dCQUNULDJCQUEyQixFQUFFLEtBQUs7cUJBQ25DO29CQUNELFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxnQkFBZ0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsZ0JBQWdCO29CQUNqRyxVQUFVLEVBQUU7d0JBQ1YsYUFBYSxFQUFFLE9BQU87cUJBQ3ZCO29CQUNELFFBQVEsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsS0FBSztvQkFDbkMsZ0JBQWdCLEVBQUUsS0FBSztpQkFDeEI7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILDBFQUEwRTtRQUMxRSx1Q0FBdUM7UUFDdkMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzlDLE1BQUEsS0FBSyxDQUFDLGlCQUFpQiwwQ0FBRSxZQUFZLENBQUMsY0FBYyxFQUFFO1lBQ3BELGVBQWUsRUFBRSxtQkFBbUI7U0FDckMsRUFBRTtRQUVILDhEQUE4RDtRQUM5RCxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUzRSxtRUFBbUU7UUFDbkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRWpELElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLFVBQVUsQ0FBQyx5QkFBeUIsQ0FDdkUsSUFBSSxFQUNKLFlBQVksRUFDWjtZQUNFLGFBQWEsRUFBRTtnQkFDYjtvQkFDRSxrQkFBa0IsRUFBRTt3QkFDbEIsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsdUJBQXVCO3dCQUMvQyxvQkFBb0IsRUFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsU0FBUztxQkFDaEU7b0JBQ0QsU0FBUyxFQUFFO3dCQUNUOzRCQUNFLGlCQUFpQixFQUFFLElBQUk7NEJBQ3ZCLFVBQVUsRUFBRSxlQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzt5QkFDaEM7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGLENBQ0YsQ0FBQztRQUVGLDRFQUE0RTtRQUM1RSw2REFBNkQ7UUFDN0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQ2pDLHdCQUF3QixFQUN4QixJQUFJLENBQUMseUJBQXlCLENBQUMsVUFBVSxDQUMxQyxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBbkdELGtDQW1HQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QsIER1cmF0aW9uIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdAYXdzLWNkay9hd3MtczMnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcblxuZXhwb3J0IGludGVyZmFjZSBDRE5JbWFnZVJlc2l6ZXJQcm9wcyB7XG4gIHJlc3RBcGlOYW1lOiBzdHJpbmc7XG4gIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9ucz86IGFwaWdhdGV3YXkuQ29yc09wdGlvbnM7XG4gIGZ1bmN0aW9uTWVtb3J5PzogbnVtYmVyO1xuICBzdG9yYWdlQ2xhc3M/OlxuICAgIHwgJ1NUQU5EQVJEJ1xuICAgIHwgJ1JFRFVDRURfUkVEVU5EQU5DWSdcbiAgICB8ICdTVEFOREFSRF9JQSdcbiAgICB8ICdPTkVaT05FX0lBJ1xuICAgIHwgJ0lOVEVMTElHRU5UX1RJRVJJTkcnXG4gICAgfCAnR0xBQ0lFUidcbiAgICB8ICdERUVQX0FSQ0hJVkUnO1xuICBtYXhBZ2VTZWNvbmRzPzogbnVtYmVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDRE5JbWFnZVJlc2l6ZXIgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uOiBjbG91ZGZyb250LkNsb3VkRnJvbnRXZWJEaXN0cmlidXRpb247XG4gIGJ1Y2tldDogczMuQnVja2V0O1xuICByZXN0QXBpOiBhcGlnYXRld2F5LkxhbWJkYVJlc3RBcGk7XG4gIHJlc2l6ZXJGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDRE5JbWFnZVJlc2l6ZXJQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCBzaGFycExheWVyID0gbmV3IGxhbWJkYS5MYXllclZlcnNpb24odGhpcywgJ1NoYXJwTGF5ZXInLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXG4gICAgICAgIHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdsYW1iZGEtbGF5ZXJzJywgJ3NoYXJwJywgJ2xheWVyLnppcCcpXG4gICAgICApLFxuICAgIH0pO1xuXG4gICAgdGhpcy5yZXNpemVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdSZXNpemVyRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTJfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChcbiAgICAgICAgcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2xhbWJkYScsICdpbWFnZS1wcm9jZXNzb3InKSxcbiAgICAgICAge1xuICAgICAgICAgIGV4Y2x1ZGU6IFsnKi50cyddLFxuICAgICAgICB9XG4gICAgICApLFxuICAgICAgbWVtb3J5U2l6ZTogcHJvcHMuZnVuY3Rpb25NZW1vcnkgfHwgMjU2LFxuICAgICAgbGF5ZXJzOiBbc2hhcnBMYXllcl0sXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBBTExPV19PUklHSU5TOiAoXG4gICAgICAgICAgcHJvcHMuZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zPy5hbGxvd09yaWdpbnMgfHwgW11cbiAgICAgICAgKS5qb2luKCcsJyksXG4gICAgICAgIFNUT1JBR0VfQ0xBU1M6IHByb3BzLnN0b3JhZ2VDbGFzcyB8fCAnU1RBTkRBUkRfSUEnLFxuICAgICAgICBNQVhfQUdFX1NFQ09ORFM6IGAke3Byb3BzLm1heEFnZVNlY29uZHMgPz8gJzYwNDgwMCd9YCwgLy8gNyBkYXlzXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5yZXN0QXBpID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhUmVzdEFwaSh0aGlzLCAnUkVTVEFwaScsIHtcbiAgICAgIGhhbmRsZXI6IHRoaXMucmVzaXplckZ1bmN0aW9uLFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiBwcm9wcy5kZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnMsXG4gICAgICByZXN0QXBpTmFtZTogcHJvcHMucmVzdEFwaU5hbWUsXG4gICAgfSk7XG5cbiAgICB0aGlzLmJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0J1Y2tldCcsIHtcbiAgICAgIHdlYnNpdGVJbmRleERvY3VtZW50OiAnaW5kZXguaHRtbCcsXG4gICAgICB3ZWJzaXRlUm91dGluZ1J1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjb25kaXRpb246IHtcbiAgICAgICAgICAgIGh0dHBFcnJvckNvZGVSZXR1cm5lZEVxdWFsczogJzQwNCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBob3N0TmFtZTogYCR7dGhpcy5yZXN0QXBpLnJlc3RBcGlJZH0uZXhlY3V0ZS1hcGkuJHtwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT059LmFtYXpvbmF3cy5jb21gLFxuICAgICAgICAgIHJlcGxhY2VLZXk6IHtcbiAgICAgICAgICAgIHByZWZpeFdpdGhLZXk6ICdwcm9kLycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcm90b2NvbDogczMuUmVkaXJlY3RQcm90b2NvbC5IVFRQUyxcbiAgICAgICAgICBodHRwUmVkaXJlY3RDb2RlOiAnMzAyJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBNYWtlIHRoZSBidWNrZXQgcHVibGljbHkgYWNjZXNzaWJsZSBidXQgbGltaXQgYWNjZXNzIGJ5IHVzZXIgYWdlbnQuIFNlZVxuICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS81OTI0MDQxNlxuICAgIGNvbnN0IGdyYW50ID0gdGhpcy5idWNrZXQuZ3JhbnRQdWJsaWNBY2Nlc3MoKTtcbiAgICBncmFudC5yZXNvdXJjZVN0YXRlbWVudD8uYWRkQ29uZGl0aW9uKCdTdHJpbmdFcXVhbHMnLCB7XG4gICAgICAnYXdzOlVzZXJBZ2VudCc6ICdBbWF6b24gQ2xvdWRGcm9udCcsXG4gICAgfSk7XG5cbiAgICAvLyBFeHBvc2UgYnVja2V0IG5hbWUgdG8gb3VyIGxhbWJkYSBhcyBhbiBlbnZpcm9ubWVudCB2YXJpYWJsZVxuICAgIHRoaXMucmVzaXplckZ1bmN0aW9uLmFkZEVudmlyb25tZW50KCdCVUNLRVRfTkFNRScsIHRoaXMuYnVja2V0LmJ1Y2tldE5hbWUpO1xuXG4gICAgLy8gR3JhbnQgdGhlIGxhbWJkYSBmdW5jdGlvbidzIHJvbGUgcmVhZC93cml0ZSBhY2Nlc3MgdG8gdGhlIGJ1Y2tldFxuICAgIHRoaXMuYnVja2V0LmdyYW50UmVhZFdyaXRlKHRoaXMucmVzaXplckZ1bmN0aW9uKTtcblxuICAgIHRoaXMuY2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkNsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ0Nsb3VkRnJvbnQnLFxuICAgICAge1xuICAgICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgY3VzdG9tT3JpZ2luU291cmNlOiB7XG4gICAgICAgICAgICAgIGRvbWFpbk5hbWU6IHRoaXMuYnVja2V0LmJ1Y2tldFdlYnNpdGVEb21haW5OYW1lLFxuICAgICAgICAgICAgICBvcmlnaW5Qcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQX09OTFksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmVoYXZpb3JzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpc0RlZmF1bHRCZWhhdmlvcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0VHRsOiBEdXJhdGlvbi5taW51dGVzKDApLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBFeHBvc2UgdGhlIGNsb3VkZnJvbnQgZG9tYWluIHRvIG91ciBsYW1iZGEgc28gaXQncyBhYmxlIHRvIHJlZGlyZWN0IHRoZXJlXG4gICAgLy8gYWZ0ZXIgc3VjY2Vzc2Z1bGx5IHdyaXRpbmcgdGhlIHJlc2l6ZWQgaW1hZ2UgdG8gdGhlIGJ1Y2tldFxuICAgIHRoaXMucmVzaXplckZ1bmN0aW9uLmFkZEVudmlyb25tZW50KFxuICAgICAgJ0NMT1VERlJPTlRfRE9NQUlOX05BTUUnLFxuICAgICAgdGhpcy5jbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uLmRvbWFpbk5hbWVcbiAgICApO1xuICB9XG59XG4iXX0=