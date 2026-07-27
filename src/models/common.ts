export interface IMessageResponse {
  message: string;
}

export interface IValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface IHTTPValidationError {
  detail?: IValidationError[];
}
