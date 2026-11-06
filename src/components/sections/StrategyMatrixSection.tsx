"use client";

import { useState, useEffect } from "react";
import { getProduct } from "@/config/products";
import BasisBadge from "@/components/ui/BasisBadge";
import InsightSaveButton from "@/components/ui/InsightSaveButton";
import { serverGet, serverSet, serverPrepend, serverList } from "@/lib/storeClient";

interface MatrixRow {
  id: string;
  appeal: string;
  target: string;
  hook: string;
  rationale: string;
  type: "근거" | "가설";
  verdict: "O" | "X" | null;
  reason?: string;
  sources?: string[];
}

interface ContextSummary {
  used: { sourceId: string; label: string }[];
  missing: { label: string }[];
}

interface VerdictRecord {
  rowId: string;
  appeal: string;
  target: string;
  verdict: "O" | "X";
  reason: string;
  recordedAt: string;
}

interface MatrixSnapshot {
  rows: MatrixRow[];
  archivedAt: string;
}

interface Props { productId: string; }

const matrixKey    = (id: string) => `product:${id}:matrix`;
const verdictsKey  = (id: string) => `product:${id}:verdicts`;
const historyKey   = (id: string) => `product:${id}:matrix_history`;
const LS_KEY       = (id: string) => `strategy_matrix_${id}`;

function lsLoad(productId: string): MatrixRow[] {
  try { const r = localStorage.getItem(LS_KEY(productId)); return r ? JSON.parse(r) : []; } catch { return []; }
}
function lsSave(productId: string, rows: MatrixRow[]) {
  try { localStorage.setItem(LS_KEY(productId), JSON.stringify(rows)); } catch {}
}

export default function StrategyMatrixSection({ productId }: Props) {
  const product = getProduct(productId);
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [source, setSource] = useState<"server" | "local" | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingVerdict, setEditingVerdict] = useState<{ id: string; verdict: "O" | "X" } | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [migrating, setMigrating] = useState(false);
  const [history, setHistory] = useState<MatrixSnapshot[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [verdictCount, setVerdictCount] = useState(0);
  const [contextSummary, setContextSummary] = useState<ContextSummary | null>(null);

  // 초기 로드
  useEffect(() => {
    (async () => {
      const serverResult = await serverGet<MatrixRow[]>(matrixKey(productId));
      if (!serverResult.ok) {
        setLoadError(true);
        return;
      }
      if (serverResult.data && serverResult.data.length > 0) {
        setRows(serverResult.data);
        setSource("server");
        lsSave(productId, serverResult.data);
      } else {
        const local = lsLoad(productId);
        setRows(local);
        if (local.length > 0) setSource("local");
      }
    })();
  }, [productId]);

  useEffect(() => {
    serverList<MatrixSnapshot>(historyKey(productId), 10).then((r) => {
      if (r.ok) setHistory(r.data);
    });
  }, [productId]);

  useEffect(() => {
    serverList<VerdictRecord>(verdictsKey(productId), 200).then((r) => {
      if (r.ok) setVerdictCount(r.data.length);
    });
  }, [productId]);

  const persistRows = async (next: MatrixRow[]) => {
    lsSave(productId, next);
    if (loadError) return;
    const ok = await serverSet(matrixKey(productId), next);
    setSaveStatus(ok ? "ok" : "fail");
    if (ok) setSource("server");
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  const generate = async () => {
    if (loadError) return;
    setLoading(true);
    setError("");
    try {
      // 기존 매트릭스 아카이브
      if (rows.length > 0) {
        const snapshot: MatrixSnapshot = { rows, archivedAt: new Date().toISOString() };
        await serverPrepend(historyKey(productId), snapshot);
        setHistory((prev) => [snapshot, ...prev.slice(0, 9)]);
      }

      const res = await fetch("/api/generate-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      if (data.contextSummary) setContextSummary(data.contextSummary);
      const newRows: MatrixRow[] = (data.matrix?.rows ?? []).map((r: MatrixRow) => ({ ...r, verdict: null }));
      setRows(newRows);
      await persistRows(newRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const startVerdict = (id: string, verdict: "O" | "X") => {
    setEditingVerdict({ id, verdict });
    setReasonInput("");
  };

  const confirmVerdict = async (reason: string) => {
    if (!editingVerdict || !reason.trim()) return;
    const { id, verdict } = editingVerdict;
    const row = rows.find((r) => r.id === id);
    setRows((prev) => {
      const next = prev.map((r) => r.id === id ? { ...r, verdict, reason } : r);
      persistRows(next);
      return next;
    });
    setEditingVerdict(null);

    if (row && !loadError) {
      const record: VerdictRecord = {
        rowId: id, appeal: row.appeal, target: row.target,
        verdict, reason,
        recordedAt: new Date().toISOString(),
      };
      const ok = await serverPrepend(verdictsKey(productId), record);
      if (ok) setVerdictCount((n) => n + 1);
    }
  };

  const migrate = async () => {
    if (rows.length === 0 || loadError) return;
    setMigrating(true);
    const ok = await serverSet(matrixKey(productId), rows);

    if (ok) {
      // 중복 방지: 이미 서버에 있는 rowId는 건너뜀
      const existingResult = await serverList<VerdictRecord>(verdictsKey(productId), 200);
      const existingRowIds = existingResult.ok
        ? new Set(existingResult.data.map((v) => v.rowId))
        : new Set<string>();

      const verdicted = rows.filter((r) => r.verdict !== null && !existingRowIds.has(r.id));
      for (const r of verdicted) {
        await serverPrepend(verdictsKey(productId), {
          rowId: r.id, appeal: r.appeal, target: r.target,
          verdict: r.verdict as "O" | "X", reason: r.reason ?? "",
          recordedAt: new Date().toISOString(),
        } satisfies VerdictRecord);
      }
      setSource("server");
      setVerdictCount((n) => n + verdicted.length);
    }

    setSaveStatus(ok ? "ok" : "fail");
    setMigrating(false);
  };

  const oCount = rows.filter((r) => r.verdict === "O").length;
  const xCount = rows.filter((r) => r.verdict === "X").length;

  return (
    <div>
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)", fontSize: "11px" }}>4단계</div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>전략 매트릭스</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>{product?.name ?? productId} · 소구 × 타겟 조합에 O/X를 판정하세요.</p>
      </div>

      {/* 서버 읽기 실패 경고 */}
      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-start gap-2" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" }}>
          <span className="flex-shrink-0">⚠️</span>
          <div>
            <strong>서버 연결 실패</strong> — 데이터를 불러오지 못했어요.
            저장·생성 기능이 비활성화됩니다. 연결을 확인한 뒤 새로 고침해주세요.
          </div>
        </div>
      )}

      {/* 판정 현황 */}
      {rows.length > 0 && (
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>O 판정 <strong>{oCount}</strong></div>
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>X 판정 <strong>{xCount}</strong></div>
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>미판정 <strong>{rows.length - oCount - xCount}</strong></div>
          {verdictCount > 0 && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>누적 판정 이력 <strong>{verdictCount}건</strong></div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={generate}
          disabled={loading || loadError}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
          style={{ background: "var(--accent)", color: "#fff", opacity: (loading || loadError) ? 0.4 : 1 }}
        >
          {loading ? "생성 중…" : rows.length > 0 ? "매트릭스 다시 생성" : "매트릭스 생성"}
        </button>

        {history.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="px-4 py-2.5 rounded-xl text-sm transition-colors"
            style={{ background: "var(--surface-2)", color: "var(--fg-2)" }}
          >
            {showHistory ? "이전 버전 닫기" : `이전 버전 (${history.length}개)`}
          </button>
        )}
      </div>

      {/* 저장 상태 */}
      {saveStatus !== "idle" && (
        <p className="mb-3 text-xs" style={{ color: saveStatus === "fail" ? "#b91c1c" : "var(--fg-3)" }}>
          {saveStatus === "ok" ? "✓ 서버 저장 완료" : "⚠️ 이 브라우저에만 저장됐어요 (서버 저장 실패)"}
        </p>
      )}

      {/* 마이그레이션 버튼 */}
      {source === "local" && rows.length > 0 && saveStatus === "idle" && !loadError && (
        <div className="mb-4 px-4 py-3 rounded-lg flex items-center justify-between gap-3" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs" style={{ color: "var(--fg-3)" }}>이 매트릭스는 이 브라우저에만 저장돼 있어요.</p>
          <button
            onClick={migrate}
            disabled={migrating}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "var(--accent)", color: "#fff", opacity: migrating ? 0.6 : 1 }}
          >
            {migrating ? "저장 중…" : "서버로 옮기기"}
          </button>
        </div>
      )}

      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#fee", color: "#c00" }}>{error}</div>}

      {/* 데이터 사용 현황 배너 */}
      {contextSummary && (
        <div className="mb-5 p-3 rounded-xl border text-xs" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--fg-3)", fontSize: "10px" }}>이번 매트릭스 생성에 쓴 데이터</div>
          {contextSummary.used.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {contextSummary.used.map((u) => (
                <span key={u.sourceId} className="px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                  ✓ {u.label}
                </span>
              ))}
            </div>
          )}
          {contextSummary.missing.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {contextSummary.missing.map((m, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>
                  ✗ {m.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 이전 버전 목록 */}
      {showHistory && history.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-3)", fontSize: "10px" }}>이전 버전</div>
          {history.map((snap, i) => (
            <details key={i} className="rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <summary className="text-xs cursor-pointer select-none" style={{ color: "var(--fg-2)" }}>
                {new Date(snap.archivedAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                {" · "}{snap.rows.length}개 조합
                {" · "}O {snap.rows.filter((r) => r.verdict === "O").length} / X {snap.rows.filter((r) => r.verdict === "X").length}
              </summary>
              <div className="mt-2 space-y-1.5 pl-1">
                {snap.rows.map((r) => (
                  <div key={r.id} className="flex items-baseline gap-2 text-xs" style={{ color: "var(--fg-3)", opacity: r.verdict === "X" ? 0.5 : 1 }}>
                    <span style={{ fontWeight: 700, color: r.verdict === "O" ? "var(--accent)" : r.verdict === "X" ? "#6b7280" : "var(--fg-3)" }}>
                      {r.verdict ?? "미"}
                    </span>
                    <span>{r.appeal} → {r.target}</span>
                    {r.reason && <span>"{r.reason}"</span>}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* 매트릭스 */}
      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="p-4 rounded-xl border transition-colors"
              style={{
                background: "var(--surface)",
                borderColor: row.verdict === "O" ? "var(--accent)" : "var(--border)",
                opacity: row.verdict === "X" ? 0.55 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                  <button
                    onClick={() => startVerdict(row.id, "O")}
                    className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors"
                    style={{ background: row.verdict === "O" ? "var(--accent)" : "var(--surface-2)", color: row.verdict === "O" ? "#fff" : "var(--fg-3)" }}
                  >O</button>
                  <button
                    onClick={() => startVerdict(row.id, "X")}
                    className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors"
                    style={{ background: row.verdict === "X" ? "#6b7280" : "var(--surface-2)", color: row.verdict === "X" ? "#fff" : "var(--fg-3)" }}
                  >X</button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>{row.appeal}</span>
                    <span className="text-xs" style={{ color: "var(--fg-3)" }}>→</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--fg-2)" }}>{row.target}</span>
                    <BasisBadge basis={row.type} />
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>"{row.hook}"</div>
                  <div className="text-xs" style={{ color: "var(--fg-3)" }}>{row.rationale}</div>
                  {row.reason && (
                    <div
                      className="mt-2 text-xs px-2 py-1 rounded"
                      style={{
                        background: row.verdict === "O" ? "var(--accent-light)" : "var(--surface-2)",
                        color: row.verdict === "O" ? "var(--accent)" : "var(--fg-3)",
                      }}
                    >
                      판정 이유: {row.reason}
                    </div>
                  )}
                  {row.verdict === "O" && row.reason && (
                    <div className="mt-1.5">
                      <InsightSaveButton
                        productId={productId}
                        defaultText={`[O판정] ${row.appeal} → ${row.target}: ${row.reason}`}
                        defaultBasis="근거"
                        sourceType="verdict"
                        sourceRef={row.id}
                        triggerLabel="인사이트로 저장"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* O·X 모두 이유 입력 */}
              {editingVerdict?.id === row.id && (
                <div className="mt-3 pl-11">
                  <input
                    autoFocus
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && reasonInput.trim()) confirmVerdict(reasonInput.trim()); }}
                    placeholder={editingVerdict.verdict === "O" ? "O 판정 이유 (필수, Enter 확인)" : "X 판정 이유 (필수, Enter 확인)"}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: editingVerdict.verdict === "O" ? "var(--accent)" : "#6b7280",
                      color: "var(--fg)",
                    }}
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={() => reasonInput.trim() && confirmVerdict(reasonInput.trim())}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: editingVerdict.verdict === "O" ? "var(--accent)" : "#6b7280", color: "#fff" }}
                    >확인</button>
                    <button
                      onClick={() => setEditingVerdict(null)}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}
                    >취소</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
