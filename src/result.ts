export type ResultType<TSuccess, TError> = {
  success: true,
  content: TSuccess
} | {
  success: false,
  error: TError
}

export const Result = {
  ok<TSuccess, TError = any>(value: TSuccess): ResultType<TSuccess, TError> {
    return {
      success: true,
      content: value
    }
  },
  
  fail<TSuccess, TError = any>(value: TError): ResultType<TSuccess, TError> {
    return {
      success: false,
      error: value
    }
  },
}