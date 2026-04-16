type JsonRouteHandler = (request: Request, context?: unknown) => Promise<Response>;

export async function invokeJsonRoute<T>(
  handler: JsonRouteHandler,
  url: string,
  method: string,
  payload?: unknown,
  context?: unknown
): Promise<T> {
  const request = new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });

  const response = await handler(request, context);
  const json = await response.json();

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || json?.error || `Route request failed with status ${response.status}`);
  }

  return json as T;
}
