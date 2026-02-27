import { getSession } from "./sessions";

async function ApiGET<T = any>(request: Request, url = "", customHeaders: Record<string, string> = {}): Promise<T> {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  const headers = new Headers(request.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  for (const [key, value] of Object.entries(customHeaders)) {
    headers.set(key, value);
  }
  const response = await fetch(url, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API GET failed: ${response.status} ${response.statusText} - Body: ${errorBody}`);
    throw new Error(`API GET failed: ${response.statusText}`);
  }

  // Returning the raw response as any to maintain backward compatibility,
  // but typed generic hints for newer code.
  return response as any;
}

async function ApiPOST<T = any>(request: Request, url = "", data = {}): Promise<T> {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  let headers = {
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (token) {
    headers = Object.assign(headers, {
      Authorization: `Bearer ${token}`,
    });
  }
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API POST failed: ${response.statusText}`);
  }

  return response as any;
}

async function ApiPATCH<T = any>(request: Request, url = "", data = {}): Promise<T> {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  let headers = {
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (token) {
    headers = Object.assign(headers, {
      Authorization: `Bearer ${token}`,
    });
  }
  const response = await fetch(url, {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API PATCH failed: ${response.statusText}`);
  }

  return response as any;
}

async function ApiDELETE<T = any>(request: Request, url = ""): Promise<T> {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  let headers = {
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (token) {
    headers = Object.assign(headers, {
      Authorization: `Bearer ${token}`,
    });
  }
  const response = await fetch(url, {
    method: "DELETE",
    headers: headers,
  });

  if (!response.ok) {
    throw new Error(`API DELETE failed: ${response.statusText}`);
  }

  return response as any;
}

export { ApiGET, ApiPOST, ApiPATCH, ApiDELETE };
