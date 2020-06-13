import * as AWS from 'aws-sdk';
import * as sharp from 'sharp';
import { ClientError, NotFoundError } from './error';

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const allowOrigins = (process.env.ALLOW_ORIGINS || '').split(',');
const storageClass = process.env.STORAGE_CLASS || 'STANDARD_IA';
const maxAgeSeconds = process.env.MAX_AGE_SECONDS || '604800'; // 7 days

interface Dimensions {
  width?: number;
  height?: number;
}

/**
 * Returns header object with CORS headers set
 */
function getHeaders(event: AWSLambda.APIGatewayProxyEvent) {
  const headers: { [key: string]: string | boolean } = {};
  const originHeader = event.headers.origin || event.headers.Origin;
  const origin = allowOrigins.find((origin) => origin === originHeader);
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = true;
  }
  return headers;
}

/**
 * Extracts dimensions from a string e.g '300', '300x400' or 'x400'
 */
function dimensionsFromPathString(str: string): Dimensions {
  if (!str) throw new Error('Invalid dimensions');
  const regex = /(\d*)x?(\d*)/;
  const matches = str.match(regex)!;
  const width = matches[1] ? Number(matches[1]) : undefined;
  const height = matches[2] ? Number(matches[2]) : undefined;
  if ((!width && !height) || width === 0 || height === 0)
    throw new Error('Invalid dimensions');
  return {
    width,
    height,
  };
}

/**
 * Converts object implementing Dimensions to string
 */
function dimensionsToPathString(dimensions: Dimensions) {
  if (dimensions.width && dimensions.height === undefined)
    return `${dimensions.width}`;
  if (dimensions.width === undefined && dimensions.height)
    return `x${dimensions.height}`;
  if (dimensions.width === undefined && dimensions.height === undefined)
    return '';
  return `${dimensions.width}x${dimensions.height}`;
}

/**
 * Lambda error handler
 */
function handleError(err: any, event: AWSLambda.APIGatewayProxyEvent) {
  console.log(err);
  return {
    statusCode: err.statusCode || 500,
    headers: getHeaders(event),
    body: JSON.stringify({
      message: err.message || 'An unhandled error occurred',
    }),
  };
}

export const handler = async (event: AWSLambda.APIGatewayProxyEvent) => {
  console.log('Path: ', event.path);

  // Split path on '/' and make sure it has at least 2 segments
  const splitPath = event.path.split('/').filter((segment) => segment);
  if (splitPath.length < 2) return handleError(new NotFoundError(), event);

  // Extract dimensions from path segment
  let dimensions;
  try {
    dimensions = dimensionsFromPathString(splitPath[0]);
  } catch (err) {
    return handleError(new ClientError(err.message), event);
  }

  // The last segment of the path will be the s3 key we're resizing. For example
  // if the path is '/300x300/foo/bar.png' we extract 'foo/bar.png'
  const sourceKey = splitPath.slice(1).join('/');

  // Construct the destination key
  const destinationKey = `${dimensionsToPathString(dimensions)}/${sourceKey}`;

  try {
    const obj = await s3
      .getObject({
        Bucket: process.env.BUCKET_NAME!,
        Key: sourceKey,
      })
      .promise();

    const imageBuffer = await sharp(obj.Body as Buffer)
      .resize(dimensions)
      .toBuffer();

    await s3
      .putObject({
        Bucket: process.env.BUCKET_NAME!,
        Key: destinationKey,
        Body: imageBuffer,
        ContentType: obj.ContentType,
        CacheControl: `max-age=${maxAgeSeconds}`,
        StorageClass: storageClass,
      })
      .promise();
  } catch (err) {
    return handleError(err, event);
  }

  // Redirect to our cloudfront endpoint
  const headers = getHeaders(event);
  headers['location'] = `https://${process.env
    .CLOUDFRONT_DOMAIN_NAME!}/${destinationKey}`;
  headers['cache-control'] = 'max-age=0';

  return {
    statusCode: 302,
    headers,
  };
};
