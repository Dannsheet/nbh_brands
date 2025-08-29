// src/lib/fetchSafe.js

export async function fetchSafe(url, options = {}) {
    let response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (networkError) {
    return { data: null, meta: null, error: 'Network error', status: 0 };
  }

  let parsed;
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) parsed = await response.json();
    else parsed = await response.text();
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const errorMessage = parsed?.error || parsed || `HTTP ${response.status}`;
    return { data: null, meta: parsed?.meta ?? null, error: errorMessage, status: response.status };
  }

  // Normalizar: si body == { data, meta } => separar
  if (parsed && typeof parsed === 'object' && ('data' in parsed || 'meta' in parsed)) {
    return { data: parsed.data ?? parsed, meta: parsed.meta ?? null, error: null, status: response.status };
  }

  return { data: parsed, meta: null, error: null, status: response.status };
}