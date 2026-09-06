export function httpError(status, message, extra = {}) {
  const err = new Error(message);
  err.status = status;
  err.payload = extra;
  return err;
}
