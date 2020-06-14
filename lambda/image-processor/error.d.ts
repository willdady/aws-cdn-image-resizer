declare class HTTPError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare class NotFoundError extends HTTPError {
    constructor(message?: string);
}
export declare class ClientError extends HTTPError {
    constructor(message?: string);
}
export {};
