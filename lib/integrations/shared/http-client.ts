export type HttpRequest = {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
};

export async function httpRequest(
  request: HttpRequest,
): Promise<Response> {
  return fetch(request.url, {
    method: request.method ?? "GET",
    headers: request.headers,
    body: request.body,
  });
}