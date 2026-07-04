import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Users,
  Eye,
  ThumbsUp,
  Zap,
  AlertCircle,
  TrendingUp,
  Key,
  Trash2,
} from 'lucide-react';

// ===== Facebook Graph API =====
const FB_GRAPH = 'https://graph.facebook.com/v23.0';

// Facebook ตัด/เปลี่ยนชื่อ metric บ่อยมาก (deprecation พ.ย.2025 + มิ.ย.2026)
// จึงเก็บ "ชื่อผู้สมัคร" หลายตัวต่อ 1 ค่า แล้วลองทีละตัว ใช้ตัวแรกที่ API ยอมรับ
const METRIC_CANDIDATES = {
  reach: ['page_impressions_unique', 'page_reach', 'page_daily_reach'],
  views: ['page_views', 'page_media_view', 'page_impressions', 'page_views_total'],
  engagement: ['page_post_engagements', 'page_total_actions', 'page_engaged_users'],
} as const;

type MetricKey = keyof typeof METRIC_CANDIDATES;

interface PageEntry {
  id: string;
  name: string;
  token: string;
  followers?: number;
}

interface DailyPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

interface SeriesResult {
  total: number;
  daily: DailyPoint[];
  error?: string;
  metricUsed?: string; // ชื่อ metric ที่ API ยอมรับจริง
}

type SeriesMap = Record<MetricKey, SeriesResult>;

const PRESETS = [
  { label: '7 วัน', days: 7 },
  { label: '28 วัน', days: 28 },
  { label: '90 วัน', days: 90 },
];

const emptySeries = (): SeriesResult => ({ total: 0, daily: [] });

// แปลง Date -> YYYY-MM-DD (โซนเวลาเครื่อง)
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export default function EngagementDashboardPortal() {
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [days, setDays] = useState<number>(28);

  const [loading, setLoading] = useState(false);
  const [loadingPages, setLoadingPages] = useState(true);
  const [globalError, setGlobalError] = useState<string>('');
  const [series, setSeries] = useState<SeriesMap | null>(null);
  const [chartMetric, setChartMetric] = useState<MetricKey>('reach');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // ===== วาง Access Token เอง =====
  const [manualToken, setManualToken] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMsg, setManualMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [rememberToken, setRememberToken] = useState(true);

  // ===== โหลดรายชื่อเพจจาก token ที่บันทึกไว้ใน Settings =====
  useEffect(() => {
    const load = async () => {
      setLoadingPages(true);
      let tokenMap: Record<string, string> = {};
      try {
        tokenMap = JSON.parse(localStorage.getItem('fb_page_tokens_map') || '{}');
      } catch {
        tokenMap = {};
      }
      const ids = Object.keys(tokenMap);
      if (ids.length === 0) {
        setPages([]);
        setLoadingPages(false);
        return;
      }

      // ดึงชื่อเพจ + ผู้ติดตามจาก Graph API (token ของแต่ละเพจใช้กับเพจตัวเองได้)
      const resolved = await Promise.all(
        ids.map(async (id): Promise<PageEntry> => {
          const token = tokenMap[id];
          try {
            const res = await fetch(
              `${FB_GRAPH}/${id}?fields=name,followers_count&access_token=${encodeURIComponent(token)}`
            );
            const data = await res.json();
            if (data.error) {
              return { id, name: `เพจ ${id} (token มีปัญหา)`, token };
            }
            return { id, name: data.name || `เพจ ${id}`, token, followers: data.followers_count };
          } catch {
            return { id, name: `เพจ ${id}`, token };
          }
        })
      );

      setPages(resolved);
      setSelectedId((prev) => prev || resolved[0]?.id || '');
      setLoadingPages(false);
    };
    load();
  }, []);

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedId),
    [pages, selectedId]
  );

  // รวมเพจใหม่เข้ารายการเดิม (กันซ้ำตาม id, ของใหม่ทับของเก่า)
  const mergePages = useCallback((incoming: PageEntry[]) => {
    setPages((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      incoming.forEach((p) => map.set(p.id, p));
      return Array.from(map.values());
    });
  }, []);

  // ลบเพจออกจากรายการ + ลบ token ที่บันทึกไว้ในเครื่อง
  const deletePage = useCallback(
    (id: string) => {
      const target = pages.find((p) => p.id === id);
      if (!window.confirm(`ลบเพจ "${target?.name || id}" ออกจากรายการ?\n(token ที่บันทึกในเครื่องจะถูกลบด้วย)`))
        return;

      const remaining = pages.filter((p) => p.id !== id);
      setPages(remaining);
      if (selectedId === id) {
        setSelectedId(remaining[0]?.id || '');
        setSeries(null);
      }

      // ลบออกจาก localStorage (ทั้ง 2 map ที่หน้าตั้งค่าใช้)
      try {
        const map = JSON.parse(localStorage.getItem('fb_page_tokens_map') || '{}');
        delete map[id];
        localStorage.setItem('fb_page_tokens_map', JSON.stringify(map));
        const life = JSON.parse(localStorage.getItem('fb_lifetime_page_ids') || '{}');
        delete life[id];
        localStorage.setItem('fb_lifetime_page_ids', JSON.stringify(life));
      } catch {
        /* ไม่เป็นไร */
      }
    },
    [pages, selectedId]
  );

  // ===== วาง Access Token เอง แล้วดึงเพจ =====
  const loadFromManualToken = useCallback(async () => {
    const token = manualToken.trim();
    if (!token) return;
    setManualLoading(true);
    setManualMsg(null);

    try {
      // 1) ลองเป็น User Token ก่อน → ได้รายชื่อเพจทั้งหมด พร้อม Page Token ของแต่ละเพจ
      const accRes = await fetch(
        `${FB_GRAPH}/me/accounts?fields=name,access_token,followers_count&limit=100&access_token=${encodeURIComponent(token)}`
      );
      const accData = await accRes.json();

      let found: PageEntry[] = [];
      if (!accData.error && Array.isArray(accData.data) && accData.data.length > 0) {
        found = accData.data.map((p: any) => ({
          id: p.id,
          name: p.name || `เพจ ${p.id}`,
          token: p.access_token || token,
          followers: p.followers_count,
        }));
      } else {
        // 2) ไม่ใช่ User Token (หรือไม่มีเพจ) → ลองเป็น Page Token ดึงเพจตัวเอง
        const meRes = await fetch(
          `${FB_GRAPH}/me?fields=name,followers_count&access_token=${encodeURIComponent(token)}`
        );
        const me = await meRes.json();
        if (me.error || !me.id) {
          throw new Error(
            accData.error?.message || me.error?.message || 'Token ใช้ไม่ได้ หรือไม่มีสิทธิ์เข้าถึงเพจ'
          );
        }
        found = [{ id: me.id, name: me.name || `เพจ ${me.id}`, token, followers: me.followers_count }];
      }

      mergePages(found);
      setSelectedId(found[0].id);

      // บันทึกลง localStorage ให้ใช้ครั้งหน้า (รูปแบบเดียวกับหน้าตั้งค่า)
      if (rememberToken) {
        let savedMap: Record<string, string> = {};
        try {
          savedMap = JSON.parse(localStorage.getItem('fb_page_tokens_map') || '{}');
        } catch {
          savedMap = {};
        }
        found.forEach((p) => {
          savedMap[p.id] = p.token;
        });
        localStorage.setItem('fb_page_tokens_map', JSON.stringify(savedMap));
      }

      setManualMsg({
        type: 'ok',
        text: `พบ ${found.length} เพจ${rememberToken ? ' · บันทึกไว้แล้ว' : ''} — เลือกจาก dropdown ด้านบนได้เลย`,
      });
      setManualToken('');
    } catch (e: any) {
      setManualMsg({ type: 'err', text: e?.message || 'ดึงเพจไม่สำเร็จ' });
    } finally {
      setManualLoading(false);
    }
  }, [manualToken, rememberToken, mergePages]);

  // ===== ดึง Insights หนึ่งค่า โดยลองชื่อ metric หลายตัว ใช้ตัวแรกที่ผ่าน =====
  const fetchMetric = useCallback(
    async (
      pageId: string,
      token: string,
      candidates: readonly string[],
      since: string,
      until: string
    ): Promise<SeriesResult> => {
      let lastError = 'metric ไม่รองรับ';
      for (const metricId of candidates) {
        try {
          const url =
            `${FB_GRAPH}/${pageId}/insights?metric=${metricId}` +
            `&period=day&since=${since}&until=${until}` +
            `&access_token=${encodeURIComponent(token)}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.error) {
            lastError = data.error.message || 'metric ไม่รองรับ';
            continue; // ลองชื่อถัดไป
          }
          const values = data.data?.[0]?.values || [];
          const daily: DailyPoint[] = values.map((v: any) => ({
            date: (v.end_time || '').slice(0, 10),
            value: typeof v.value === 'number' ? v.value : 0,
          }));
          const total = daily.reduce((s, d) => s + d.value, 0);
          return { total, daily, metricUsed: metricId };
        } catch (e: any) {
          lastError = e?.message || 'เรียก API ไม่สำเร็จ';
        }
      }
      return { ...emptySeries(), error: lastError };
    },
    []
  );

  const loadInsights = useCallback(async () => {
    if (!selectedPage) return;
    setLoading(true);
    setGlobalError('');
    setSeries(null);

    // FB ดึงย้อนหลังได้ทีละช่วง — เผื่อ +1 วันให้ครอบคลุมวันนี้
    const until = new Date();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sinceStr = ymd(since);
    const untilStr = ymd(until);

    try {
      const [reach, views, engagement] = await Promise.all([
        fetchMetric(selectedPage.id, selectedPage.token, METRIC_CANDIDATES.reach, sinceStr, untilStr),
        fetchMetric(selectedPage.id, selectedPage.token, METRIC_CANDIDATES.views, sinceStr, untilStr),
        fetchMetric(selectedPage.id, selectedPage.token, METRIC_CANDIDATES.engagement, sinceStr, untilStr),
      ]);

      const result: SeriesMap = { reach, views, engagement };
      setSeries(result);
      setLastUpdated(new Date().toLocaleString('th-TH'));

      // ถ้าทุก metric error พร้อมกัน แสดงว่า token/สิทธิ์มีปัญหา
      if ([reach, views, engagement].every((r) => r.error)) {
        setGlobalError(
          (reach.error || '') +
            ' — ตรวจสอบว่า Token มีสิทธิ์ read_insights และเป็น Page Token ที่ถูกต้อง (Facebook อาจเปลี่ยนชื่อ metric ใหม่อีก)'
        );
      }
    } catch (e: any) {
      setGlobalError(e?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [selectedPage, days, fetchMetric]);

  // ดึงอัตโนมัติเมื่อเลือกเพจ/เปลี่ยนช่วงเวลา
  useEffect(() => {
    if (selectedPage) loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, days]);

  // Engagement Rate = Engagement / Reach * 100
  const engagementRate = useMemo(() => {
    if (!series) return 0;
    const reach = series.reach.total;
    const eng = series.engagement.total;
    if (!reach) return 0;
    return (eng / reach) * 100;
  }, [series]);

  const cards = useMemo(() => {
    if (!series) return [];
    return [
      {
        key: 'reach' as MetricKey,
        label: 'Reach (คนที่เข้าถึง)',
        value: formatNumber(series.reach.total),
        icon: Users,
        color: 'text-sky-400',
        ring: 'border-sky-500/30',
        error: series.reach.error,
        metricUsed: series.reach.metricUsed,
      },
      {
        key: 'views' as MetricKey,
        label: 'Page Views',
        value: formatNumber(series.views.total),
        icon: Eye,
        color: 'text-violet-400',
        ring: 'border-violet-500/30',
        error: series.views.error,
        metricUsed: series.views.metricUsed,
      },
      {
        key: 'engagement' as MetricKey,
        label: 'Engagement',
        value: formatNumber(series.engagement.total),
        icon: ThumbsUp,
        color: 'text-rose-400',
        ring: 'border-rose-500/30',
        error: series.engagement.error,
        metricUsed: series.engagement.metricUsed,
      },
      {
        key: 'rate' as 'rate',
        label: 'Engagement Rate',
        value: `${engagementRate.toFixed(2)}%`,
        icon: Zap,
        color: 'text-emerald-400',
        ring: 'border-emerald-500/30',
        error: series.reach.error || series.engagement.error,
      },
    ];
  }, [series, engagementRate]);

  // ===== กล่องวาง Access Token เอง (ใช้ซ้ำทั้ง 2 หน้าจอ) =====
  const manualTokenBox = (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
      <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
        <Key className="w-3.5 h-3.5" /> วาง Access Token เอง (User Token หรือ Page Token)
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') loadFromManualToken();
          }}
          placeholder="EAAB... วาง Access Token ที่นี่"
          className="flex-1 min-w-[260px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
        />
        <button
          onClick={loadFromManualToken}
          disabled={manualLoading || !manualToken.trim()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg px-4 py-2 text-sm text-white font-semibold transition-colors"
        >
          {manualLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          ดึงเพจจาก Token
        </button>
      </div>
      <label className="flex items-center gap-2 mt-2 text-xs text-slate-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={rememberToken}
          onChange={(e) => setRememberToken(e.target.checked)}
          className="accent-emerald-500"
        />
        จดจำ Token ไว้ในเครื่องนี้ (ใช้ครั้งหน้าไม่ต้องวางใหม่)
      </label>
      {manualMsg && (
        <div
          className={`mt-2 text-xs flex items-center gap-1.5 ${
            manualMsg.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {manualMsg.text}
        </div>
      )}
    </div>
  );

  // ===== ไม่มีเพจที่บันทึกไว้ =====
  if (!loadingPages && pages.length === 0) {
    return (
      <div className="glass-panel p-6 animate-fade-in space-y-4">
        <div className="text-center py-4">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">ยังไม่มี Token เพจที่บันทึกไว้</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            วาง Access Token ด้านล่างเพื่อเริ่มดูสถิติได้เลย หรือไปเชื่อมต่อถาวรที่แท็บ{' '}
            <span className="text-emerald-400 font-semibold">⚙️ ตั้งค่าระบบ → Facebook</span>
          </p>
        </div>
        {manualTokenBox}
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 animate-fade-in space-y-6">
      {/* ===== Toolbar ===== */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-semibold">เลือกเพจ</label>
          <div className="flex items-center gap-2">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingPages}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white min-w-[220px] focus:border-emerald-500 outline-none"
            >
              {loadingPages && <option>กำลังโหลดเพจ...</option>}
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedId && deletePage(selectedId)}
              disabled={!selectedId}
              title="ลบเพจนี้ออกจากรายการ"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 hover:bg-rose-600/80 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-semibold">ช่วงเวลา</label>
          <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                onClick={() => setDays(preset.days)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  days === preset.days
                    ? 'bg-emerald-500 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={loadInsights}
          disabled={loading || !selectedPage}
          className="ml-auto flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {/* meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {selectedPage?.followers != null && (
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> ผู้ติดตาม {formatNumber(selectedPage.followers)}
          </span>
        )}
        {lastUpdated && <span>อัปเดตล่าสุด: {lastUpdated}</span>}
      </div>

      {globalError && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-sm text-rose-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* วาง Token เพิ่ม (พับเก็บได้) */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 select-none">
          <Key className="w-3.5 h-3.5" /> เพิ่มเพจ / วาง Access Token เอง
        </summary>
        <div className="mt-2">{manualTokenBox}</div>
      </details>

      {/* ===== Summary Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(loading && !series ? Array.from({ length: 4 }) : cards).map((card: any, i) => (
          <div
            key={card?.label || i}
            className={`bg-slate-900/60 border rounded-xl p-4 ${
              card?.ring || 'border-slate-700'
            }`}
          >
            {card ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">{card.label}</span>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                {card.error && (
                  <div className="text-[10px] text-amber-400/80 mt-1 truncate" title={card.error}>
                    ⚠ {card.error}
                  </div>
                )}
                {!card.error && card.metricUsed && (
                  <div className="text-[10px] text-slate-600 mt-1 truncate" title={card.metricUsed}>
                    {card.metricUsed}
                  </div>
                )}
              </>
            ) : (
              <div className="h-16 animate-pulse bg-slate-800/50 rounded" />
            )}
          </div>
        ))}
      </div>

      {/* ===== Chart ===== */}
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            กราฟแนวโน้มรายวัน
          </h3>
          <div className="flex gap-1">
            {(['reach', 'engagement', 'views'] as MetricKey[]).map((m) => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  chartMetric === m
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {m === 'reach' ? 'Reach' : m === 'engagement' ? 'Engagement' : 'Views'}
              </button>
            ))}
          </div>
        </div>
        <LineChart points={series?.[chartMetric].daily || []} loading={loading} />
      </div>

      <p className="text-[11px] text-slate-600">
        * ตัวเลขเป็นผลรวมรายวันในช่วงที่เลือก · Engagement Rate = Engagement ÷ Reach ·
        ข้อมูลมาจาก Facebook Graph API (v20.0) โดยตรง บาง metric อาจถูก Facebook ปิดการใช้งานตามรุ่น API
      </p>
    </div>
  );
}

// ===== กราฟเส้น SVG (ไม่พึ่งไลบรารีนอก) =====
function LineChart({ points, loading }: { points: DailyPoint[]; loading: boolean }) {
  const W = 800;
  const H = 220;
  const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

  if (loading) {
    return <div className="h-[220px] animate-pulse bg-slate-800/40 rounded-lg" />;
  }
  if (!points.length) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
        ไม่มีข้อมูลในช่วงเวลานี้
      </div>
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...points.map((p) => p.value), 1);

  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const areaPath =
    `${linePath} L ${x(points.length - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`;

  // เส้นกริดแนวนอน 4 ระดับ
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    yPos: PAD.top + innerH - f * innerH,
    val: Math.round(maxVal * f),
  }));

  // ติดป้าย x แค่ไม่กี่จุดกันรก
  const labelEvery = Math.ceil(points.length / 7);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={g.yPos}
            x2={W - PAD.right}
            y2={g.yPos}
            stroke="rgb(51 65 85)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x={PAD.left - 8} y={g.yPos + 4} textAnchor="end" fontSize="10" fill="rgb(100 116 139)">
            {g.val.toLocaleString('en-US')}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#areaFill)" />
      <path d={linePath} fill="none" stroke="rgb(16 185 129)" strokeWidth="2" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="2.5" fill="rgb(16 185 129)" />
          {i % labelEvery === 0 && (
            <text
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(100 116 139)"
            >
              {p.date.slice(5)}
            </text>
          )}
          <title>{`${p.date}: ${p.value.toLocaleString('en-US')}`}</title>
        </g>
      ))}
    </svg>
  );
}
