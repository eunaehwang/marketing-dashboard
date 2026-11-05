/** 클라이언트 → /api/store 래퍼 */

export async function serverGet<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`/api/store?key=${encodeURIComponent(key)}&op=get`);
    if (!res.ok) return null;
    const { data } = await res.json();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function serverList<T>(key: string, limit = 50): Promise<T[]> {
  try {
    const res = await fetch(`/api/store?key=${encodeURIComponent(key)}&op=list&limit=${limit}`);
    if (!res.ok) return [];
    const { data } = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function serverSet(key: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "set", key, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function serverPrepend(key: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "prepend", key, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
