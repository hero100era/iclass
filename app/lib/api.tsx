import { getSession } from "./sessions.server";

async function ApiGET(request: Request, url = "") {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  let headers = request.headers;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(url, {
    method: "GET",
    headers: headers,
  });
  return response;
}

async function ApiPOST(request: Request, url = "", data = {}) {
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
  return response;
}

async function ApiPATCH(request: Request, url = "", data = {}) {
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
  return response;
}

async function ApiDELETE(request: Request, url = "") {
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
  return response;
}

export { ApiGET, ApiPOST, ApiPATCH, ApiDELETE };
