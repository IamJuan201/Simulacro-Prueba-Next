"use client";

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const requestOptions: RequestInit = {
    ...options,
    credentials: "same-origin",
  };
  const response = await fetch(url, requestOptions);

  if (response.status !== 401 || url === "/api/auth/refresh") {
    return response;
  }

  const refresh = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  });

  if (!refresh.ok) {
    return response;
  }

  return fetch(url, requestOptions);
}
