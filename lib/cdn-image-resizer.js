"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var path = require("path");
var core_1 = require("@aws-cdk/core");
var s3 = require("@aws-cdk/aws-s3");
var cloudfront = require("@aws-cdk/aws-cloudfront");
var apigateway = require("@aws-cdk/aws-apigateway");
var lambda = require("@aws-cdk/aws-lambda");
var CDNImageResizer = /** @class */ (function (_super) {
    __extends(CDNImageResizer, _super);
    function CDNImageResizer(scope, id, props) {
        var _a, _b, _c;
        var _this = _super.call(this, scope, id) || this;
        var sharpLayer = new lambda.LayerVersion(_this, 'SharpLayer', {
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-layers', 'sharp', 'layer.zip'))
        });
        _this.resizerFunction = new lambda.Function(_this, 'ResizerFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'image-processor'), {
                exclude: ['*.ts']
            }),
            memorySize: props.functionMemory || 256,
            layers: [sharpLayer],
            environment: {
                ALLOW_ORIGINS: (((_a = props.defaultCorsPreflightOptions) === null || _a === void 0 ? void 0 : _a.allowOrigins) || []).join(','),
                STORAGE_CLASS: props.storageClass || 'STANDARD_IA',
                MAX_AGE_SECONDS: "" + ((_b = props.maxAgeSeconds) !== null && _b !== void 0 ? _b : '604800')
            }
        });
        _this.restApi = new apigateway.LambdaRestApi(_this, 'RESTApi', {
            handler: _this.resizerFunction,
            defaultCorsPreflightOptions: props.defaultCorsPreflightOptions,
            restApiName: props.restApiName
        });
        _this.bucket = new s3.Bucket(_this, 'Bucket', {
            websiteIndexDocument: 'index.html',
            websiteRoutingRules: [
                {
                    condition: {
                        httpErrorCodeReturnedEquals: '404'
                    },
                    hostName: _this.restApi.restApiId + ".execute-api." + process.env.CDK_DEFAULT_REGION + ".amazonaws.com",
                    replaceKey: {
                        prefixWithKey: 'prod/'
                    },
                    protocol: s3.RedirectProtocol.HTTPS,
                    httpRedirectCode: '302'
                },
            ]
        });
        // Make the bucket publicly accessible but limit access by user agent. See
        // https://stackoverflow.com/a/59240416
        var grant = _this.bucket.grantPublicAccess();
        (_c = grant.resourceStatement) === null || _c === void 0 ? void 0 : _c.addCondition('StringEquals', {
            'aws:UserAgent': 'Amazon CloudFront'
        });
        // Expose bucket name to our lambda as an environment variable
        _this.resizerFunction.addEnvironment('BUCKET_NAME', _this.bucket.bucketName);
        // Grant the lambda function's role read/write access to the bucket
        _this.bucket.grantReadWrite(_this.resizerFunction);
        _this.cloudFrontWebDistribution = new cloudfront.CloudFrontWebDistribution(_this, 'CloudFront', {
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: _this.bucket.bucketWebsiteDomainName,
                        originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
                    },
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                            defaultTtl: core_1.Duration.minutes(0)
                        },
                    ]
                },
            ]
        });
        // Expose the cloudfront domain to our lambda so it's able to redirect there
        // after successfully writing the resized image to the bucket
        _this.resizerFunction.addEnvironment('CLOUDFRONT_DOMAIN_NAME', _this.cloudFrontWebDistribution.domainName);
        return _this;
    }
    return CDNImageResizer;
}(core_1.Construct));
exports["default"] = CDNImageResizer;
