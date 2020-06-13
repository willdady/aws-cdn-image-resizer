class HTTPError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends HTTPError {
  constructor(message?: string) {
    super(message || 'Not Found', 404);
  }
}

export class ClientError extends HTTPError {
  constructor(message?: string) {
    super(message || 'Client Error', 400);
  }
}
