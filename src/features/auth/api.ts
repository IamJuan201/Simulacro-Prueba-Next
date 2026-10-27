"use client";

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    }).then((response) => response.ok).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

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

  if (!await refreshSession()) {
    return response;
  }

  return fetch(url, requestOptions);
}
