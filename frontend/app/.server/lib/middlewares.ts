export const loggingMiddleware = async (
  {
    request,
  }: {
    request: Request;
  },
  next: () => Promise<Response>,
) => {
  const requestId = crypto.randomUUID();

  console.log(`[${requestId}] ${request.method} ${request.url}`);

  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;

  console.log(`[${requestId}] Response ${response.status} (${duration}ms)`);

  return response;
};
