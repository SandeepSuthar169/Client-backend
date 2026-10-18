import { type ErrorCode, ErrorCodes } from "../types/error/errorCode";

export class AppError extends Error {
  public readonly status: number;

  constructor(public readonly code: ErrorCode, message?: string) {
    super(message ?? ErrorCodes[code].message); // allow optional override
    this.status = ErrorCodes[code].status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}