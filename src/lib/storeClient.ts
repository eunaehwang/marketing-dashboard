/** 클라이언트 → /api/store 래퍼 */

/** 읽기 결과: ok=true면 data가 있음(null = 키 없음), ok=false면 서버/네트워크 오류 */
export type StoreReadResult<T> = { ok: true; data: T | null } | { ok: false };
export type StoreListResult<T> = { ok: true; data: T[] } | { ok: false };

export async function serverGet<T>(key: string): Promise<StoreReadResult<T>> {
  try {
    const res = await fetch(`/api/store?key=${encodeURIComponent(key)}&op=get`);
    if (!res.ok) return { ok: false };
    const { data } = await res.json();
    return { ok: true, data: data ?? null };
  } catch {
    return { ok: false };
  }
}

export async function serverList<T>(key: string, limit = 50): Promise<StoreListResult<T>> {
  try {
    const res = await fetch(`/api/store?key=${encodeURIComponent(key)}&op=list&limit=${limit}`);
    if (!res.ok) return { ok: false };
    const { data } = await res.json();
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch {
    return { ok: false };
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
