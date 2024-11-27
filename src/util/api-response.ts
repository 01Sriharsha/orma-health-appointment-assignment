import { NextResponse } from "next/server";

export type ApiResponse<T = any> = {
  message?: string;
  data?: T;
};

export async function apiResponse(status: number, body: ApiResponse) {
  return NextResponse.json(body, { status });
}

export class ApiError extends Error {
  status: number;

  constructor(status?: number, message?: string) {
    super(message);
    this.status = status || 500;
  }
}
