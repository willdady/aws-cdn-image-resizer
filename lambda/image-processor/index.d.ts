export declare const handler: (event: import("aws-lambda").APIGatewayProxyEvent) => Promise<{
    statusCode: any;
    headers: {
        [key: string]: string | boolean;
    };
    body: string;
} | {
    statusCode: number;
    headers: {
        [key: string]: string | boolean;
    };
}>;
