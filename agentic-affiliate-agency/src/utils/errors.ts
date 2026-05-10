export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(resource: string): AppError {
  return new AppError(404, `${resource} not found`, 'NOT_FOUND');
}

export function badRequest(message: string): AppError {
  return new AppError(400, message, 'BAD_REQUEST');
}

export function conflict(message: string): AppError {
  return new AppError(409, message, 'CONFLICT');
}
