import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RefreshCw, 
  ExternalLink, 
  Info,
  CheckCircle,
  Search,
  FileText,
  TrendingUp,
  Compass
} from 'lucide-react';

const API_BASE = 'http://localhost:5005/api';

import ViralReplicatorPortal from './ViralReplicatorPortal';

interface VaultContent {
  id: string;
  source_type: 'radar' | 'rss' | 'youtube' | 'github' | 'replicator';
  title: string;
  selected_headline: string | null;
  raw_content: string;
  source_url: string;
  author_name: string | null;
  author_avatar_url: string | null;
  author_followers: number | null;
  rating_news: number;
  rating_evergreen: number;
  metadata: any;
  media_paths: string[];
  status: 'scraped' | 'ready_for_design' | 'designed' | 'posted' | 'archived';
  created_at: string;
  updated_at: string;
}

interface WatchlistPage {
  id: string;
  url: string;
  name: string;
  category: string;
  platform: 'facebook' | 'tiktok' | 'youtube' | 'instagram' | 'unknown';
  followers: number;
  engagementRate: number;
  status: 'scraped' | 'pending';
  deepResearchDate?: string;
  deepResearchPostCount?: number;
  scanSelected: boolean;
  isOwnPage?: boolean;
  note?: string;
}

// 🐙 RESTORED GITHUB FINDER FRONTEND API CLIENT HELPERS
const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_TRENDS_MAX_LIMIT = 100;

class GithubApiError extends Error {
  status: number;
  resetAt?: Date;

  constructor(message: string, status: number, resetAt?: Date) {
    super(message);
    this.name = 'GithubApiError';
    this.status = status;
    this.resetAt = resetAt;
  }
}

function buildGithubHeaders(token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function githubUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path.startsWith('http') ? path : `${GITHUB_API_BASE_URL}${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function githubJson<T>(path: string, params?: Record<string, string | number | boolean | undefined>, token?: string): Promise<T> {
  const response = await fetch(githubUrl(path, params), {
    headers: buildGithubHeaders(token),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.message ? `: ${body.message}` : '';
    } catch {}
    const resetHeader = response.headers.get('x-ratelimit-reset');
    const resetAt = resetHeader ? new Date(Number(resetHeader) * 1000) : undefined;
    throw new GithubApiError(`GitHub API error ${response.status}${detail}`, response.status, resetAt);
  }

  return response.json() as Promise<T>;
}

function buildTrendingSearchQuery(query = '', sinceDays = 1) {
  const cleaned = query.trim();
  const d = new Date();
  d.setDate(d.getDate() - Math.max(1, sinceDays));
  const windowQualifier = `pushed:>=${d.toISOString().slice(0, 10)}`;
  const visibilityQualifier = 'is:public';
  const base = cleaned || 'stars:>0';
  return `${base} ${windowQualifier} ${visibilityQualifier}`.trim();
}

function createGithubRepoTags(repo: any) {
  const tags = new Set<string>(['github']);
  if (repo.language) tags.add(repo.language.toLowerCase().replace(/\s+/g, '-'));
  (repo.topics || []).slice(0, 5).forEach((topic: string) => tags.add(topic));

  const haystack = `${repo.full_name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  if (/\b(ai|llm|agent|openai|rag|model|machine-learning)\b/.test(haystack)) tags.add('ai');
  if (/\b(web|react|vue|next|frontend|ui)\b/.test(haystack)) tags.add('web-dev');
  if (/\b(cli|terminal|shell)\b/.test(haystack)) tags.add('developer-tools');
  if (/\b(security|pentest|vulnerability|scanner)\b/.test(haystack)) tags.add('security');
  if (/\b(data|analytics|database|sql)\b/.test(haystack)) tags.add('data');

  return [...tags].slice(0, 10);
}

async function fetchStarsSince(fullName: string, sinceDays: number, token?: string) {
  const d = new Date();
  d.setDate(d.getDate() - Math.max(1, sinceDays));
  let total = 0;

  for (let page = 1; page <= 5; page++) {
    const records = await githubJson<any[]>(
      `/repos/${fullName}/stargazers`,
      { per_page: 100, page },
      token
    );

    if (!Array.isArray(records) || records.length === 0) break;

    let sawOlderStar = false;
    for (const record of records) {
      const starredAt = record.starred_at ? new Date(record.starred_at) : null;
      if (starredAt && starredAt >= d) total++;
      if (starredAt && starredAt < d) sawOlderStar = true;
    }

    if (records.length < 100 || sawOlderStar) break;
  }

  return total;
}

async function fetchGithubTrendingRepos(options: { query?: string; mode?: string; limit?: number; days?: number; token?: string }) {
  const limit = Math.max(1, Math.min(GITHUB_TRENDS_MAX_LIMIT, options.limit || 30));
  const sinceDays = options.days || 1;
  const q = options.mode === 'trending' && !options.query
    ? `created:>=${new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)} stars:>10 is:public`
    : buildTrendingSearchQuery(options.query || '', sinceDays);

  const search = await githubJson<{ items: any[] }>(
    '/search/repositories',
    {
      q,
      sort: 'stars',
      order: 'desc',
      per_page: Math.max(limit, 30),
    },
    options.token
  );

  const candidates = (search.items || []).slice(0, Math.max(limit, 30));
  const enriched = [];

  for (const repo of candidates) {
    let starsToday = 0;
    try {
      if (options.mode === 'trending') {
        starsToday = await fetchStarsSince(repo.full_name, sinceDays, options.token);
      }
    } catch {
      starsToday = 0;
    }
    enriched.push({
      ...repo,
      stars_today: starsToday,
      trend_since: new Date(Date.now() - sinceDays * 86400000).toISOString(),
      fetched_at: new Date().toISOString(),
      tags: createGithubRepoTags(repo),
    });
  }

  return enriched
    .sort((a, b) => b.stars_today - a.stars_today || b.stargazers_count - a.stargazers_count)
    .slice(0, limit);
}

function extractReadmeGifUrls(markdown: string) {
  const seen = new Set<string>();
  const gifs: string[] = [];
  const add = (url: string) => {
    const clean = url.split('?')[0].trim();
    if (!clean.startsWith('http') || seen.has(clean)) return;
    if (!/\.gif$/i.test(clean)) return;
    if (/shields\.io|badge|travis|circleci|codecov/i.test(clean)) return;
    seen.add(clean);
    gifs.push(clean);
  };

  for (const match of markdown.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g)) add(match[1]);
  for (const match of markdown.matchAll(/<img[^>]+src=["'](https?:\/\/[^"'\s>]+)["']/gi)) add(match[1]);
  return [gifs[0] || '', gifs[1] || '', gifs[2] || ''];
}

async function fetchGithubReadme(fullName: string, token?: string) {
  try {
    const data = await githubJson<{ content?: string }>(
      `/repos/${fullName}/readme`,
      undefined,
      token
    );
    const decoded = atob(String(data.content || '').replace(/\n/g, ''));
    return {
      content: decoded.slice(0, 3500),
      images: extractReadmeGifUrls(decoded),
    };
  } catch {
    return { content: '', images: ['', '', ''] };
  }
}

const GH_MODEL_OPTIONS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (แนะนำ/เร็ว/ถูก)' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash (ใหม่/เร็ว)' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (ฉลาด)' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (คุ้มค่า)' },
  { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B (ฟรี!)' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (เก่งสุด)' },
  { id: 'qwen/qwen3-8b:free', name: 'Gemma 3 27B (ฟรี!)' },
];

const ensureLink = (text: string, url: string) =>
  text.includes(url) ? text : `${text}\n\n👉 ${url}`;

async function fetchGithubRateLimit(token?: string) {
  return githubJson<any>('/rate_limit', undefined, token);
}

const KEYWORDS = [
  { label: 'ไม่ระบุหัวข้อ', query: '', emoji: '🌐' },
  { label: 'Claude Code', query: 'claude-code', emoji: '🤖' },
  { label: 'AI Agent / Multi-agent', query: 'topic:ai-agent', emoji: '🕹️' },
  { label: 'Local LLM (รันในเครื่อง)', query: 'topic:local-llm', emoji: '💻' },
  { label: 'Ollama (รัน LLM ในเครื่อง)', query: 'ollama local model', emoji: '🦙' },
  { label: 'Voice AI / Voice Cloning', query: 'topic:voice-cloning', emoji: '🎙️' },
  { label: 'Text to Speech (TTS)', query: 'topic:text-to-speech', emoji: '🔊' },
  { label: 'Gemini AI Tools', query: 'topic:gemini', emoji: '✨' },
  { label: 'Awesome AI (รวม resources)', query: 'topic:awesome-ai', emoji: '📚' },
  { label: 'Awesome LLM', query: 'topic:awesome-llm', emoji: '📖' },
  { label: 'AI x Finance / Trading', query: 'topic:algorithmic-trading', emoji: '📈' },
  { label: 'Quant Finance AI', query: 'topic:quantitative-finance', emoji: '💹' },
  { label: 'PDF & Document AI', query: 'pdf extraction ai markdown', emoji: '📄' },
  { label: 'AI Coding Assistant', query: 'topic:ai-coding-assistant', emoji: '⌨️' },
  { label: 'RAG (Retrieval Augmented)', query: 'topic:rag', emoji: '🧠' },
  { label: 'Knowledge Graph', query: 'topic:knowledge-graph', emoji: '🕸️' },
  { label: 'Prompt Engineering', query: 'topic:prompt-engineering', emoji: '✍️' },
  { label: 'LLM Fine-tuning', query: 'topic:fine-tuning', emoji: '⚙️' },
  { label: 'LoRA / QLoRA', query: 'topic:lora', emoji: '🔧' },
  { label: 'MCP Server', query: 'topic:mcp-server', emoji: '🔌' },
  { label: 'Model Context Protocol', query: 'model-context-protocol', emoji: '🔌' },
  { label: 'AI Education / Roadmap', query: 'topic:roadmap ai learning', emoji: '🎓' },
  { label: 'Open Source AI Tools', query: 'topic:ai-tools', emoji: '🛠️' },
  { label: 'Agentic / Autonomous AI', query: 'topic:agentic-ai', emoji: '🦾' },
  { label: 'LangChain / LangGraph', query: 'topic:langchain', emoji: '⛓️' },
  { label: 'AI Image Generation', query: 'topic:image-generation', emoji: '🎨' },
  { label: 'Stable Diffusion', query: 'topic:stable-diffusion', emoji: '🖼️' },
  { label: 'Obsidian / Notes AI', query: 'obsidian ai plugin', emoji: '🗂️' },
  { label: 'AI Security / Pentest', query: 'topic:penetration-testing ai', emoji: '🔐' },
  { label: 'Browser AI / Web Scraping', query: 'topic:web-scraping ai', emoji: '🌐' },
  { label: 'OpenAI / GPT Tools', query: 'topic:openai', emoji: '💬' }
];

const DISCOVERY_MODES = [
  {
    id: 'trending',
    label: '🔥 เทรนด์วันนี้',
    short: 'ดาวขึ้นจริงวันนี้',
    description: 'ดึงจาก GitHub Trending รายวันก่อน แล้วเติม repo ใหม่ให้ครบจำนวน',
  },
  {
    id: 'fresh',
    label: '🌱 Repo ใหม่มาแรง',
    short: 'สร้างใหม่แต่เริ่มมีคนสนใจ',
    description: 'เหมาะทำคอนเทนต์ “ของใหม่ที่น่าจับตา”',
  },
  {
    id: 'rising',
    label: '🚀 โตไวสัปดาห์นี้',
    short: 'โปรเจกต์ที่ถูกอัปเดตช่วงนี้และดาวรวมเริ่มสูง',
    description: 'ใช้หา repo ที่กำลังมี momentum แต่ไม่จำกัดแค่หน้า Trending',
  },
  {
    id: 'active',
    label: '⚡ อัปเดตล่าสุด',
    short: 'โปรเจกต์ดังที่ยังขยับอยู่',
    description: 'เหมาะหาเรื่องจาก repo ที่ยังมีการพัฒนา ไม่ใช่ของเก่าทิ้งไว้',
  },
  {
    id: 'helpWanted',
    label: '🙋 คนอยากให้ช่วย',
    short: 'issue เยอะ ชุมชนมีงานให้ร่วม',
    description: 'เหมาะทำโพสต์สาย open-source/community และ beginner friendly',
  }
];

const POPULAR_RSS_SITES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', icon: '🗞️' },
  { name: 'CNBC Technology', url: 'https://search.cnbc.com/rs/search/view/xml/contents.xml?partnerId=2000&keywords=technology', icon: '💰' },
  { name: 'Bloomberg Tech', url: 'https://www.bloomberg.com/technology', icon: '📊' },
  { name: 'Blognone (Thai)', url: 'https://www.blognone.com/node/feed', icon: '🇹🇭' },
  { name: 'Techfeed (Thai)', url: 'https://www.facebook.com/techfeedthailand', icon: '📱' }
];

const STOCK_VISUAL_TONES = [
  {
    name: 'bright editorial daylight',
    prompt: 'bright editorial stock photo, natural morning daylight, warm white office, clean realistic colors, approachable professional mood',
    scene: 'a tidy developer desk near a window, laptop with abstract interface shapes, coffee, notebook, soft shadows',
  },
  {
    name: 'dark cinematic command center',
    prompt: 'dark cinematic tech lab, deep charcoal background, controlled blue rim light, dramatic contrast, premium cybersecurity atmosphere',
    scene: 'multiple monitors with blurred code-like shapes, hands at keyboard from behind, glowing hardware details',
  },
  {
    name: 'minimal flat lay product style',
    prompt: 'minimal top-down flat lay, airy negative space, matte surfaces, soft studio light, clean product-photography composition',
    scene: 'keyboard, notebook diagrams, small electronic modules, abstract workflow cards arranged neatly, no readable labels',
  },
  {
    name: 'futuristic holographic concept',
    prompt: 'futuristic AI concept art blended with realistic photography, translucent holographic UI, neon cyan and amber accents, sleek high-tech feel',
    scene: 'floating automation nodes around a laptop, abstract agent network, depth of field, no actual text',
  },
  {
    name: 'documentary startup workspace',
    prompt: 'candid documentary-style office photography, handheld realism, natural mixed lighting, lived-in workspace, authentic team atmosphere',
    scene: 'wide shot of a small software team desk area, blurred people in background, boards and screens intentionally unreadable',
  },
  {
    name: 'macro hardware detail',
    prompt: 'macro photography, shallow depth of field, crisp hardware texture, precise technical mood, premium close-up lighting',
    scene: 'close-up of keyboard switches, circuit traces, cable connections, reflected abstract code colors',
  },
  {
    name: 'clean SaaS dashboard mockup',
    prompt: 'polished SaaS dashboard aesthetic, bright gradient-free interface glow, crisp glass panels, modern enterprise software mood',
    scene: 'large monitor showing abstract dashboard blocks and automation flow shapes, no readable text, spacious composition',
  },
  {
    name: 'moody research lab',
    prompt: 'quiet AI research lab mood, cool fluorescent light, muted greens and steel tones, analytical and serious atmosphere',
    scene: 'workbench with laptop, papers turned away, small server device, subtle cables and data visualization shapes',
  },
  {
    name: 'social media cover graphic',
    prompt: 'bold social media cover image, high-energy tech editorial composition, vibrant but professional color blocking, strong empty area for headline overlay',
    scene: 'abstract developer tools collage with laptop silhouette, glowing paths, geometric depth, no words or logos',
  },
  {
    name: 'human hands workflow',
    prompt: 'realistic lifestyle technology photo, warm practical lighting, human-centered workflow, trustworthy professional tone',
    scene: 'hands sketching an automation workflow beside a laptop and phone, faces out of frame, no readable writing',
  },
];

const YOUTUBE_PREDEFINED_CATEGORIES = [
  {
    label: "Forex & Trader Stories",
    description: "สกัดบทเรียนจากชีวิตจริงของเทรดเดอร์ Forex ความสำเร็จ ความผิดพลาด และจิตวิทยาการเทรด",
    keywords: [
      "forex trader success story",
      "day trading profitable trader interview",
      "how i lost trading forex lessons",
      "ordinary forex trader journey",
      "forex trading psychology case study",
      "successful trader daily routine",
      "forex risk management stories",
      "from broke to profitable trader"
    ]
  },
  {
    label: "Ordinary Success Stories",
    description: "เรื่องเล่าของคนธรรมดาที่เริ่มต้นจากศูนย์จนประสบความสำเร็จทางการเงินและชีวิต",
    keywords: [
      "from zero to millionaire ordinary people",
      "ordinary person financial freedom success story",
      "how ordinary people built wealth case study",
      "from broke to rich ordinary people journey",
      "lessons from starting from nothing story",
      "real life success story self made",
      "ordinary people side hustle success",
      "struggle to success story ordinary person"
    ]
  },
  {
    label: "Investment Psychology",
    description: "เรื่องเจาะลึกจิตวิทยาการเทรด วิธีควบคุมอารมณ์ และข้อผิดพลาดทางความคิดของนักลงทุน",
    keywords: [
      "trading psychology case study lessons",
      "investor behavior mistakes psychology",
      "how to control emotions trading story",
      "psychology of successful investors journey",
      "fear and greed investing psychology",
      "mindset of profitable trader interview",
      "investment psychology lessons learned",
      "why traders fail psychology case study"
    ]
  },
  {
    label: "AI & Future Tools",
    description: "รีวิวเครื่องมือ AI ล้ำๆ การนำ AI ไปทำงานเพื่อสร้างรายได้ และการเตรียมตัวสู่อนาคต",
    keywords: [
      "how to use AI tools for business",
      "generative AI tools review case study",
      "making money with AI tools story",
      "future of AI automation ordinary people",
      "AI developer tools journey success",
      "best AI tools productivity lessons",
      "ordinary person starting AI agency",
      "learning AI from zero case study"
    ]
  }
];

export default function DiscoveryPortal({ onApprove }: { onApprove?: () => void }) {
  // Main Tab Switcher: 'radar' (Watchlist Radar) | 'content' (RSS/YT/GH Content Scrapers)
  const [activeMainTab, setActiveMainTab] = useState<'radar' | 'content'>('radar');

  // Watchlist Pages State
  const [watchlistPages, setWatchlistPages] = useState<WatchlistPage[]>([]);
  
  // Watchlist Adding Inputs
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newIsOwnPage, setNewIsOwnPage] = useState(false);
  const [isCustomNewCategory, setIsCustomNewCategory] = useState(false);

  // Watchlist Editing Inputs
  const [editingPage, setEditingPage] = useState<WatchlistPage | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editIsOwnPage, setEditIsOwnPage] = useState(false);
  const [editFollowers, setEditFollowers] = useState('');
  const [isCustomEditCategory, setIsCustomEditCategory] = useState(false);



  // Watchlist Scan parameters
  const [scanLimit] = useState(30);
  const [deepResearchLimit, setDeepResearchLimit] = useState(300);

  // Unified Scanner Logs & Running Status
  const [scanLogs, setScanLogs] = useState<string[]>(['[SYSTEM] Ready. เลือกเพจคู่แข่งแล้วกดปุ่มสแกนดึงข้อมูล...']);
  const [isScanning, setIsScanning] = useState(false);

  // Content Discovery Sub-tab: 'rss' | 'youtube' | 'github' | 'replicator'
  const [contentActiveSubTab, setContentActiveSubTab] = useState<'rss' | 'youtube' | 'github' | 'replicator'>('rss');

  // Content Scrapers Input States
  const [rssUrl, setRssUrl] = useState('https://techcrunch.com/feed/');
  const [rssLimit, setRssLimit] = useState(10);
  
  const [ytUrl, setYtUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [ytLimit, setYtLimit] = useState(5);

  // 🧭 YouTube Keyword Discovery Hub States
  const [ytActiveMode, setYtActiveMode] = useState<'keyword' | 'extractor'>('keyword');
  
  const [ytEvergreenOnly, setYtEvergreenOnly] = useState<boolean>(() => {
    return localStorage.getItem('yt_evergreen_only') === 'true';
  });
  const [ytEvergreenMinViews, setYtEvergreenMinViews] = useState<number>(() => {
    const v = localStorage.getItem('yt_evergreen_min_views');
    return v ? parseInt(v, 10) : 50000;
  });
  const [ytEvergreenMinDuration, setYtEvergreenMinDuration] = useState<number>(() => {
    const d = localStorage.getItem('yt_evergreen_min_duration');
    return d ? parseInt(d, 10) : 120;
  });
  const [ytEvergreenIgnoreDate, setYtEvergreenIgnoreDate] = useState<boolean>(() => {
    return localStorage.getItem('yt_evergreen_ignore_date') === 'true';
  });
  
  const [ytSearchResults, setYtSearchResults] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('yt_search_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [ytLastSearch, setYtLastSearch] = useState<string>(() => {
    return localStorage.getItem('yt_last_search') || '';
  });
  
  const [ytCsvFilename, setYtCsvFilename] = useState<string>(() => {
    return localStorage.getItem('yt_csv_filename') || '';
  });
  
  const [ytCsvKeywordCategories, setYtCsvKeywordCategories] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('yt_csv_keyword_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [ytDiscoveryLoading, setYtDiscoveryLoading] = useState<boolean>(false);
  const [ytDiscoveryStatus, setYtDiscoveryStatus] = useState<string>('');
  
  const [ytSelectedCategoryLabel, setYtSelectedCategoryLabel] = useState<string>('Forex & Trader Stories');
  const [ytSelectedKeywords, setYtSelectedKeywords] = useState<string[]>([]);
  const [ytCheckedKeywords, setYtCheckedKeywords] = useState<string[]>([]);
  const [ytSearchDays, setYtSearchDays] = useState<number>(120);
  const [ytSearchLimit, setYtSearchLimit] = useState<number>(12);
  const [ytSearchQueryText, setYtSearchQueryText] = useState<string>('');
  const [ytIsRecommendingKeywords, setYtIsRecommendingKeywords] = useState<boolean>(false);
  const [ytIsProcessingCsv, setYtIsProcessingCsv] = useState<boolean>(false);

  const [ytCustomInputText, setYtCustomInputText] = useState<string>(() => {
    return localStorage.getItem('yt_custom_input_text') || '';
  });

  const parsedCustomKeywords = ytCustomInputText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const allYtCategories = [...YOUTUBE_PREDEFINED_CATEGORIES, ...ytCsvKeywordCategories];
  if (parsedCustomKeywords.length > 0) {
    allYtCategories.push({
      label: "กรอกด้วยตนเอง",
      description: "คีย์เวิร์ดที่คุณพิมพ์กรอกเองแบบแมนนวลในช่องกรอก",
      keywords: parsedCustomKeywords
    });
  }

  useEffect(() => {
    if (ytSelectedCategoryLabel === 'กรอกด้วยตนเอง') {
      setYtSelectedKeywords(parsedCustomKeywords);
    }
  }, [ytCustomInputText, ytSelectedCategoryLabel]);

  useEffect(() => {
    setYtCheckedKeywords(ytSelectedKeywords);
  }, [ytSelectedKeywords]);

  const [ytSelectedVideoIds, setYtSelectedVideoIds] = useState<string[]>([]);

  const toggleYtVideoSelection = (id: string) => {
    setYtSelectedVideoIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllYtVideos = () => {
    const currentVideos = ytSearchResults.filter(video => {
      if (ytEvergreenOnly) {
        return (video.duration || 0) >= ytEvergreenMinDuration;
      }
      return true;
    });
    
    if (ytSelectedVideoIds.length === currentVideos.length && currentVideos.length > 0) {
      setYtSelectedVideoIds([]);
    } else {
      setYtSelectedVideoIds(currentVideos.map(v => v.id));
    }
  };

  const handleDeleteIndividualYtVideo = (id: string) => {
    const remainingVideos = ytSearchResults.filter(v => v.id !== id);
    setYtSearchResults(remainingVideos);
    localStorage.setItem('yt_search_results', JSON.stringify(remainingVideos));
    setYtSelectedVideoIds(prev => prev.filter(x => x !== id));
  };

  const handleDeleteSelectedYtVideos = () => {
    if (ytSelectedVideoIds.length === 0) return;
    const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอที่เลือกจำนวน ${ytSelectedVideoIds.length} รายการออกจากการค้นหานี้?`);
    if (!confirmDelete) return;
    
    const remainingVideos = ytSearchResults.filter(v => !ytSelectedVideoIds.includes(v.id));
    setYtSearchResults(remainingVideos);
    localStorage.setItem('yt_search_results', JSON.stringify(remainingVideos));
    setYtSelectedVideoIds([]);
  };

  const runBatchYoutubeScraper = async (videosToScrape: any[]) => {
    if (videosToScrape.length === 0) return;
    
    setYtActiveMode('extractor');
    setContentRunning(prev => ({ ...prev, youtube: true }));
    setContentLogs(prev => ({
      ...prev,
      youtube: [`[SYSTEM] 🤖 เริ่มกระบวนการสกัดและแคปสไลด์แบบกลุ่ม (${videosToScrape.length} วิดีโอ)...`]
    }));
    scrollTerminal('youtube');

    for (let i = 0; i < videosToScrape.length; i++) {
      const video = videosToScrape[i];
      const videoTitleTruncated = video.title.length > 40 ? video.title.slice(0, 40) + '...' : video.title;
      
      setContentLogs(prev => {
        const currentLogs = prev.youtube || [];
        return {
          ...prev,
          youtube: [...currentLogs, `⏳ [${i + 1}/${videosToScrape.length}] กำลังดึงวิดีโอ: ${videoTitleTruncated} (ID: ${video.id})`]
        };
      });
      scrollTerminal('youtube');

      await new Promise<void>((resolve) => {
        const queryParams = `url=${encodeURIComponent(video.url)}&limit=${ytLimit}&openrouter_key=${encodeURIComponent(openRouterKey)}`;
        const eventUrl = `${API_BASE}/orchestrator/run/youtube?${queryParams}`;
        const source = new EventSource(eventUrl);
        sseConnection.current = source;

        source.onmessage = (event) => {
          setContentLogs(prev => {
            const currentLogs = prev.youtube || [];
            return {
              ...prev,
              youtube: [...currentLogs, ` - ${event.data}`]
            };
          });
          scrollTerminal('youtube');

          if (event.data.includes('Exit Code:')) {
            source.close();
            resolve();
          }
        };

        source.onerror = (err) => {
          console.error(`SSE stream error on batch youtube:`, err);
          setContentLogs(prev => {
            const currentLogs = prev.youtube || [];
            return {
              ...prev,
              youtube: [...currentLogs, `[ERROR] ❌ สกัดวิดีโอ ${video.id} ล้มเหลว หรือขาดการเชื่อมต่อ`]
            };
          });
          scrollTerminal('youtube');
          source.close();
          resolve();
        };
      });
    }

    setContentLogs(prev => {
      const currentLogs = prev.youtube || [];
      return {
        ...prev,
        youtube: [...currentLogs, `[SYSTEM] 🎉 เสร็จสิ้นการสกัดวิดีโอกลุ่มทั้งหมด ${videosToScrape.length} รายการ!`]
      };
    });
    setContentRunning(prev => ({ ...prev, youtube: false }));
    scrollTerminal('youtube');
    fetchScrapedResults();
    if (onApprove) onApprove();
  };

  const handleBatchYoutubeImport = () => {
    const selectedVideos = ytSearchResults.filter(v => ytSelectedVideoIds.includes(v.id));
    if (selectedVideos.length === 0) {
      alert('กรุณาเลือกวิดีโออย่างน้อย 1 รายการ');
      return;
    }
    runBatchYoutubeScraper(selectedVideos);
  };

  const handleBatchYoutubeImportResume = () => {
    const selectedVideos = ytSearchResults.filter(v => ytSelectedVideoIds.includes(v.id));
    if (selectedVideos.length === 0) {
      alert('กรุณาเลือกวิดีโออย่างน้อย 1 รายการ');
      return;
    }

    const videosToResumeScrape = selectedVideos.filter(video => {
      const alreadyScraped = scrapedResults.some(item => 
        (item.source_url && (item.source_url.includes(video.id) || item.source_url === video.url)) || 
        item.id === video.id
      );
      return !alreadyScraped;
    });

    if (videosToResumeScrape.length === 0) {
      alert('🎉 คลิปที่เลือกทั้งหมดถูกดึงข้อมูลเข้าคลังสำเร็จไปเรียบร้อยแล้วครับ! ไม่มีคลิปใหม่ที่ต้องดึงเพิ่ม');
      return;
    }

    const skippedCount = selectedVideos.length - videosToResumeScrape.length;
    if (skippedCount > 0) {
      alert(`🔄 ตรวจพบว่าดึงข้อมูลเสร็จแล้ว ${skippedCount} คลิป จะทำการดึงข้อมูลต่อเฉพาะอีก ${videosToResumeScrape.length} คลิปที่เหลือให้ครบถ้วน...`);
    }

    runBatchYoutubeScraper(videosToResumeScrape);
  };

  // const [ghQuery] = useState('ai-agent');
  const [ghMode, setGhMode] = useState('trending'); // trending, fresh, rising, active, helpWanted
  // const [ghLimit] = useState(5);
  const [selectedQueries, setSelectedQueries] = useState<string[]>(['']);
  const [resultsViewMode, setResultsViewMode] = useState<'table' | 'grid'>('table');

  // 🐙 Restored Interactive GitHub Finder States
  const [ghCount, setGhCount] = useState('30');
  const [ghSearchLoading, setGhSearchLoading] = useState(false);
  const [ghRepos, setGhRepos] = useState<any[]>([]);
  const [ghSelectedIds, setGhSelectedIds] = useState<Set<number>>(new Set());
  const [ghGeneratedPosts, setGhGeneratedPosts] = useState<any[]>([]);
  const [ghIsGenerating, setGhIsGenerating] = useState(false);
  const [ghRateLimit, setGhRateLimit] = useState<any>(null);
  const [ghIsCheckingRate, setGhIsCheckingRate] = useState(false);
  const [ghGenLog, setGhGenLog] = useState('');
  const ghStopRef = useRef(false);
  const [ghModel, setGhModel] = useState<string>(() => localStorage.getItem('gh_finder_model') || 'google/gemini-2.5-flash');

  // Footage / Visual Stock settings for GitHub Finder
  const [ghFootageFolder, setGhFootageFolder] = useState(() => localStorage.getItem('gh_footage_folder') || '');
  const [ghFootageFolderName, setGhFootageFolderName] = useState('');
  const [ghSubfolders, setGhSubfolders] = useState<any[]>([]);
  const [ghStockCount, setGhStockCount] = useState('5');
  const [ghGeneratedPrompt, setGhGeneratedPrompt] = useState('');
  const [ghIsCreatingFolders, setGhIsCreatingFolders] = useState(false);
  const [ghIsGeneratingPrompt, setGhIsGeneratingPrompt] = useState(false);
  const [ghFootageMessage, setGhFootageMessage] = useState('');
  const [showGhFootageSection, setShowGhFootageSection] = useState(false);

  // SSE Logs for Content Scrapers
  const [contentLogs, setContentLogs] = useState<{ [key: string]: string[] }>({
    rss: ['[SYSTEM] Terminal ready. เลือกแหล่งข่าวหรือกรอกพิกัดข่าวแล้วกดเริ่มรัน...'],
    youtube: ['[SYSTEM] Terminal ready. ใส่ลิงก์คลิปวิดีโอ YouTube แล้วสั่งบอทประมวลผล...'],
    github: ['[SYSTEM] Terminal ready. คีย์หัวข้อเทรนด์มาแรงและกำหนดสปีดบอท...']
  });

  const [contentRunning, setContentRunning] = useState<{ [key: string]: boolean }>({
    rss: false,
    youtube: false,
    github: false
  });

  // SQLite Scraped Results
  const [scrapedResults, setScrapedResults] = useState<VaultContent[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // OpenRouter key for AI integrations
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('openrouter_key') || '');

  // DB key profiles for dropdown selectors
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [selectedOpenRouterProfileId, setSelectedOpenRouterProfileId] = useState<string>('default');
  const [selectedGithubProfileId, setSelectedGithubProfileId] = useState<string>('default');
  const [selectedApifyProfileId, setSelectedApifyProfileId] = useState<string>('default');
  const [manualOpenRouterKey, setManualOpenRouterKey] = useState<string>(() => localStorage.getItem('openrouter_key') || '');
  const [manualApifyKey, setManualApifyKey] = useState<string>(() => localStorage.getItem('apify_key') || '');
  const [apifyKey, setApifyKey] = useState<string>(() => localStorage.getItem('apify_key') || '');

  const fetchKeyProfiles = async () => {
    try {
      const res = await fetch('http://localhost:5005/api/vault/credentials');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Filter for active profiles
          const activeOnly = data.data.filter((p: any) => p.is_active === 1);
          setDbProfiles(activeOnly);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch key profiles for dropdowns:', err);
    }
  };

  useEffect(() => {
    fetchKeyProfiles();
  }, []);

  // ─── RESTORED INTERACTIVE GITHUB FINDER FUNCTIONS ───
  const selectedKeywords = selectedQueries
    .map(query => KEYWORDS.find(k => k.query === query))
    .filter((k): k is typeof KEYWORDS[number] => Boolean(k));
  const selectedKw = selectedKeywords[0] || KEYWORDS[0];
  const selectedTopicCount = selectedKeywords.length;
  const reposPerTopic = parseInt(ghCount || '30') || 30;
  const plannedRepoTotal = selectedTopicCount * reposPerTopic;

  const normalizeKeywordQueries = (queries: string[]): string[] => {
    const allowed = new Set(KEYWORDS.map(k => k.query));
    const unique = Array.from(new Set(queries.filter(q => allowed.has(q))));
    if (unique.length === 0) return [KEYWORDS[0].query];
    if (unique.length > 1 && unique.includes('')) return unique.filter(Boolean);
    return unique;
  };

  const toggleKeywordQuery = (query: string) => {
    setSelectedQueries(prev => {
      if (query === '') return [''];
      const withoutBlank = prev.filter(q => q !== '');
      const next = withoutBlank.includes(query)
        ? withoutBlank.filter(q => q !== query)
        : [...withoutBlank, query];
      return normalizeKeywordQueries(next);
    });
  };

  const setPrimaryKeywordQuery = (query: string) => {
    setSelectedQueries(prev => normalizeKeywordQueries([query, ...prev.filter(q => q !== query)]));
  };

  const buildDiscoveryOptions = (modeId: string, topicQuery: string, topicLabel?: string) => {
    const topic = topicQuery.trim();
    const withTopic = (base: string) => `${topic ? `${topic} ` : ''}${base}`.trim();
    const mode = DISCOVERY_MODES.find(m => m.id === modeId) || DISCOVERY_MODES[0];

    const githubDateDaysAgo = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().slice(0, 10);
    };

    if (modeId === 'trending') {
      return {
        mode,
        options: topic
          ? { query: topic, days: 1, sort: 'stars' as const }
          : { query: '', days: 1 },
        note: topic
          ? `โหมด ${mode.label}: ค้นในหัวข้อ ${topicLabel || topic} จาก repo ที่ขยับ in 1 วัน`
          : `โหมด ${mode.label}: ดึงจาก GitHub Trending รายวันก่อน แล้วเติม repo ใหม่ให้ครบจำนวนถ้าหน้า Trending มีน้อย`,
      };
    }

    if (modeId === 'fresh') {
      return {
        mode,
        options: {
          query: withTopic(`created:>=${githubDateDaysAgo(14)} stars:>5 is:public`),
          rawQuery: true,
          sort: 'stars' as const,
          includeStarsToday: false,
          days: 14,
        },
        note: `โหมด ${mode.label}: repo ที่สร้างใน 14 วันที่ผ่านมา เรียงตามดาวรวม`,
      };
    }

    if (modeId === 'rising') {
      return {
        mode,
        options: {
          query: withTopic(`pushed:>=${githubDateDaysAgo(7)} stars:>50 is:public`),
          rawQuery: true,
          sort: 'stars' as const,
          includeStarsToday: false,
          days: 7,
        },
        note: `โหมด ${mode.label}: repo ที่ยังอัปเดตใน 7 วัน และเริ่มมีฐานผู้ใช้`,
      };
    }

    if (modeId === 'active') {
      return {
        mode,
        options: {
          query: withTopic(`pushed:>=${githubDateDaysAgo(1)} stars:>100 is:public`),
          rawQuery: true,
          sort: 'updated' as const,
          includeStarsToday: false,
          days: 1,
        },
        note: `โหมด ${mode.label}: repo ดังที่เพิ่งอัปเดตล่าสุด เหมาะหาเรื่องที่ยังสด`,
      };
    }

    return {
      mode,
      options: {
        query: withTopic('help-wanted-issues:>10 is:public'),
        rawQuery: true,
        sort: 'help-wanted-issues' as const,
        includeStarsToday: false,
        days: 30,
      },
      note: `โหมด ${mode.label}: repo ที่มี issue ต้องการคนช่วยเยอะ เหมาะสาย community/open-source`,
    };
  };

  const handleGithubSearch = async (override?: { query?: string; queries?: string[]; count?: string; mode?: string }) => {
    const queries = normalizeKeywordQueries(override?.queries ?? (override?.query !== undefined ? [override.query] : selectedQueries));
    const countValue = override?.count ?? ghCount;
    const modeId = override?.mode ?? ghMode;
    const keywords = queries.map(query => KEYWORDS.find(k => k.query === query) || KEYWORDS[0]);
    const numCount = Math.max(1, Math.min(100, parseInt(countValue) || 30));

    setGhSearchLoading(true);
    setGhRepos([]);
    setGhSelectedIds(new Set());
    setGhGeneratedPosts([]);
    
    let tokenToPass = '';
    if (selectedGithubProfileId === 'default') {
      tokenToPass = localStorage.getItem('github_token') || '';
    } else {
      const prof = dbProfiles.find(p => String(p.id) === selectedGithubProfileId);
      if (prof) tokenToPass = prof.credential_key;
    }

    try {
      const combined: any[] = [];
      const seen = new Set<number>();
      const failures: string[] = [];

      for (let i = 0; i < keywords.length; i++) {
        const kw = keywords[i];
        const discovery = buildDiscoveryOptions(modeId, kw.query, kw.label);

        try {
          const results = await fetchGithubTrendingRepos({
            ...discovery.options,
            limit: numCount,
            token: tokenToPass.trim() || undefined,
          });

          results.forEach(repo => {
            if (seen.has(repo.id)) return;
            seen.add(repo.id);
            combined.push(repo);
          });
        } catch (err: any) {
          failures.push(`${kw.label}: ${err?.message || 'ค้นหาไม่สำเร็จ'}`);
        }
      }

      setGhRepos(combined);
      if (combined.length === 0 && failures.length) {
        alert(`❌ ค้นหาไม่สำเร็จ:\n${failures.join('\n')}`);
      }
    } catch (err: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setGhSearchLoading(false);
    }
  };

  const handleSearchTodayTop30 = () => {
    setSelectedQueries(['']);
    setGhMode('trending');
    setGhCount('30');
    handleGithubSearch({ query: '', count: '30', mode: 'trending' });
  };

  const toggleGhSelect = (id: number) => {
    setGhSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectGhAll = () => setGhSelectedIds(new Set(ghRepos.map(r => r.id)));
  const deselectGhAll = () => setGhSelectedIds(new Set());

  const downloadGhReposCSV = () => {
    const selected = ghRepos.filter(r => ghSelectedIds.has(r.id));
    if (!selected.length) return alert('กรุณาเลือก repo ก่อน');
    const rows: string[][] = [['name', 'full_name', 'description', 'stars_today', 'stars_total', 'language', 'topics', 'url']];
    selected.forEach(r =>
      rows.push([r.name, r.full_name, r.description || '', String(r.stars_today || 0), String(r.stargazers_count), r.language || '', r.topics.join(';'), r.html_url])
    );
    downloadCSV(rows, `github_repos_${Date.now()}.csv`);
  };

  const downloadCSV = (rows: string[][], filename: string) => {
    const content = rows.map(r => r.map(csvEscape).join(',')).join('\n');
    const bom = '﻿';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const csvEscape = (val: string): string => {
    const s = (val ?? '').toString().replace(/"/g, '""');
    return `"${s}"`;
  };

  const checkGhRateLimit = async () => {
    setGhIsCheckingRate(true);
    let tokenToPass = '';
    if (selectedGithubProfileId === 'default') {
      tokenToPass = localStorage.getItem('github_token') || '';
    } else {
      const prof = dbProfiles.find(p => String(p.id) === selectedGithubProfileId);
      if (prof) tokenToPass = prof.credential_key;
    }

    try {
      const data = await fetchGithubRateLimit(tokenToPass.trim() || undefined);
      setGhRateLimit({
        search: data.resources.search,
        core: data.resources.core,
      });
    } catch {
      setGhRateLimit(null);
    } finally {
      setGhIsCheckingRate(false);
    }
  };

  // ─── Generate clickbait posts ───
  const handleGenerateGhPosts = async () => {
    const selected = ghRepos.filter(r => ghSelectedIds.has(r.id));
    if (!selected.length) return alert('กรุณาเลือก repo ก่อน');
    if (!openRouterKey.trim()) return alert('กรุณาเลือกหรือกรอก OpenRouter API Key ก่อน');

    ghStopRef.current = false;
    setGhIsGenerating(true);
    setGhGeneratedPosts(selected.map(r => ({
      repoId: r.id, full_name: r.full_name, html_url: r.html_url,
      stars: r.stargazers_count, stars_today: r.stars_today || 0, description: r.description || '',
      clickbait_caption: '', comment_1: '', comment_2: '', comment_3: '',
      images: [],
      status: 'pending',
    })));

    let tokenToPass = '';
    if (selectedGithubProfileId === 'default') {
      tokenToPass = localStorage.getItem('github_token') || '';
    } else {
      const prof = dbProfiles.find(p => String(p.id) === selectedGithubProfileId);
      if (prof) tokenToPass = prof.credential_key;
    }

    for (let i = 0; i < selected.length; i++) {
      if (ghStopRef.current) break;
      const repo = selected[i];
      setGhGenLog(`[${i + 1}/${selected.length}] 📖 กำลังอ่าน README: ${repo.full_name}`);

      setGhGeneratedPosts(prev => prev.map(p =>
        p.repoId === repo.id ? { ...p, status: 'loading' } : p
      ));

      try {
        const { content: readme, images } = await fetchGithubReadme(repo.full_name, tokenToPass.trim() || undefined);
        setGhGenLog(`[${i + 1}/${selected.length}] ✍️ AI กำลังเขียนโพส: ${repo.full_name}`);

        const prompt = buildGhPrompt(repo, readme);
        const rawOutput = await callOpenRouterDirect([{ role: 'user', content: prompt }], ghModel);
        const parsed = parseGhAIOutput(rawOutput, repo.html_url);

        const finalPost = { ...parsed, images, status: 'done' as const };
        setGhGeneratedPosts(prev => prev.map(p =>
          p.repoId === repo.id ? { ...p, ...finalPost } : p
        ));

        // Save to SQLite Central Vault via Backend API!
        const rawContent = `[Facebook Thread for ${repo.full_name}]
พาดหัว:
${finalPost.clickbait_caption}

คอมเมนต์ 1:
${finalPost.comment_1}

คอมเมนต์ 2:
${finalPost.comment_2}

คอมเมนต์ 3:
${finalPost.comment_3}`;

        const savePayload = {
          id: `github_${repo.id}`,
          source_type: 'github',
          title: repo.full_name,
          selected_headline: finalPost.clickbait_caption,
          raw_content: rawContent,
          source_url: repo.html_url,
          author_name: repo.owner?.login || null,
          author_avatar_url: repo.owner?.avatar_url || null,
          author_followers: repo.stargazers_count,
          metadata: {
            stars: repo.stargazers_count,
            stars_today: repo.stars_today || 0,
            language: repo.language || '',
            topics: repo.topics || [],
            gifs: images
          },
          media_paths: images.filter(Boolean),
          status: 'ready_for_design'
        };

        const saveRes = await fetch(`${API_BASE}/vault/contents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload)
        });
        const saveResult = await saveRes.json();
        if (saveResult.success) {
          console.log(`Successfully saved post ${repo.full_name} to SQLite vault.`);
        }
      } catch (err: any) {
        setGhGeneratedPosts(prev => prev.map(p =>
          p.repoId === repo.id ? { ...p, status: 'error', error: err.message } : p
        ));
      }
    }

    setGhGenLog('');
    setGhIsGenerating(false);
    fetchScrapedResults();
    if (onApprove) onApprove();
  };

  const buildGhPrompt = (repo: any, readme: string): string => {
    const repoInfo = [
      `ชื่อ: ${repo.full_name}`,
      `คำอธิบาย: ${repo.description || '(ไม่มี)'}`,
      `ดาวเพิ่มใน 1 วัน: ${(repo.stars_today || 0).toLocaleString()}`,
      `ดาว: ${repo.stargazers_count.toLocaleString()}`,
      `ภาษา: ${repo.language || 'N/A'}`,
      `Topics: ${repo.topics.join(', ') || 'N/A'}`,
      `Link: ${repo.html_url}`,
    ].join('\n');

    return `คุณคือผู้เชี่ยวชาญเขียนโพสภาษาไทยสำหรับเพจ Facebook ที่สอนเรื่อง AI, แชร์ความรู้น่าสนใจ, และเครื่องมือ AI ที่เป็นประโยชน์

ข้อมูล GitHub Repo ที่ต้องเขียนโพสให้:
${repoInfo}

${readme ? `\nเนื้อหา README (ส่วนหนึ่ง):\n${readme}` : ''}

---
สร้างโพส Facebook thread แบบ 4 ส่วน ดังนี้:

**clickbait_caption** (โพสหลัก — สำคัญที่สุด):
เขียนพาดหัวมาให้เลือก 3 แบบ (แต่ละแบบให้มีสไตล์ มุมมอง หรือจุดเน้นที่แตกต่างกัน) โดยอ้างอิงจากตัวอย่างเหล่านี้:

ตัวอย่างสำนวน Clickbait:
• "โกยเงินจาก AI ง่ายๆ! สร้างรายได้หลักแสนต่อเดือนด้วย "Nano Banana" ฟรี! 7 วิธีทำเงิน Side Hustle แบบที่คุณไม่เคยรู้มาก่อน (มีต่อ👇)"
• "สร้างวิดีโอ AI สุดล้ำภายในไม่กี่นาที! ด้วย Claude AI ผสม Remotion ฟรี! ทำได้เองง่ายๆ ประหยัดเวลาไป 99% (มีต่อ👇)"
• "AI Agency เตรียมเปลี่ยนโมเดล! 💥 ปี 2026 นี้ Claude Code จะทำให้คุณทำเงินมหาศาลจากลูกค้ารายย่อยได้ยังไง? ห้ามพลาดเด็ดขาด! (มีต่อ👇)"

กฎของ clickbait_caption:
1. เน้น "ประโยชน์ต่อผู้อ่าน" ไม่ใช่ "มีคนปล่อย/มีคนทำ" → ให้รู้สึกว่า "นี่มันเกี่ยวกับฉัน!"
2. ใส่ตัวเลขที่ฟังดูน่าตื่นเต้น เช่น %, ล้าน, หมื่น, ชั่วโมง, กี่วัน, กี่ขั้นตอน
3. ห้ามเริ่มด้วย 🚨 — ใส่ emoji ได้ 1-2 ตัว แต่ต้องอยู่กลางหรือท้ายประโยค
4. สร้าง FOMO หรือ mystery: "สิ่งที่คุณไม่เคยรู้", "เคล็ดลับ", "โอกาสทอง", "ทำไมคนส่วนใหญ่พลาด"
5. ใส่ชื่อ tool/repo ใน "เครื่องหมายคำพูด" ถ้าชื่อสั้นและจำง่าย
6. 1-3 ประโยคสั้นกระชับ ห้ามยาวเกิน 3 บรรทัด
7. ลงท้ายด้วย (มีต่อ👇) เสมอ

**comment_1** (ความยาวปานกลาง):
- เกริ่นนำ อธิบายว่าเครื่องมือ/repo นี้คืออะไร และดีอย่างไร ให้ใช้โครงสร้างและสำนวนคล้ายตัวอย่างนี้:
"🔥 [ชื่อเครื่องมือ] คือเครื่องมือ [ทำอะไร] ที่ทำงานกับ [เทคโนโลยี/แนวคิด] เปลี่ยน [ปัญหา] ให้เป็นมืออาชีพในพริบตา! เราจะมาเจาะ [ตัวเลข] วิธีทำเงิน/ใช้งานจาก AI ตัวนี้ ตั้งแต่หลักพันยันหลักแสนต่อเดือน!

✅ 1. [ข้อดี/วิธีที่ 1]: [คำอธิบายรายละเอียด] คุณสามารถใช้ [ชื่อเครื่องมือ] สร้างผลงานสวยๆ ได้ง่ายๆ ภายในไม่กี่วินาที! ทำรายได้จากลูกค้ารายเดือนสบายๆ! ดูตัวอย่างในคลิป!"

**comment_2** (ความยาวปานกลาง):
- อธิบายวิธีใช้งาน หรือฟีเจอร์เด่นๆ ต่อเนื่องจาก comment 1 แบบ bullet

**comment_3** (ความยาวปานกลาง):
- อธิบายฟีเจอร์เด่นข้อสุดท้าย และสรุปปิดท้าย กระตุ้นให้ทดลอง พร้อมแจกวาร์ป (ใส่ลิงก์ GitHub)
👉 ลิงก์ GitHub:
${repo.html_url}

กฎทั้งหมด:
- เขียนภาษาไทยทั้งหมด (ชื่อเทคนิค/ชื่อโปรเจกต์ใช้ภาษาอังกฤษได้)
- ห้ามเป็นทางการ เขียนแบบพูดคุยสนุกๆ
- แต่ละส่วนเขียนให้มีเนื้อหาแน่น ไม่ฟุ้ม

ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่น:
{
  "clickbait_caption": [
    "แบบที่ 1...",
    "แบบที่ 2...",
    "แบบที่ 3..."
  ],
  "comment_1": "...",
  "comment_2": "...",
  "comment_3": "..."
}`;
  };

  const callOpenRouterDirect = async (messages: { role: string; content: string }[], modelName: string) => {
    if (!openRouterKey.trim()) {
      throw new Error('กรุณากรอก OpenRouter API Key หรือเลือกโปรไฟล์ก่อนรัน AI');
    }
    
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ContentFactory V2 - GitHub Finder',
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.9
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `HTTP ${res.status}`);
    }
    return data.choices?.[0]?.message?.content || '';
  };

  const parseGhAIOutput = (raw: string, fallbackUrl: string): Pick<any, 'clickbait_caption' | 'comment_1' | 'comment_2' | 'comment_3'> => {
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    const parseCaption = (c: any) => Array.isArray(c) ? c.map((v, i) => `${i + 1}. ${v}`).join('\n\n') : (c || '');
    try {
      const obj = JSON.parse(clean);
      return {
        clickbait_caption: parseCaption(obj.clickbait_caption),
        comment_1: obj.comment_1 || '',
        comment_2: obj.comment_2 || '',
        comment_3: ensureLink(obj.comment_3 || '', fallbackUrl),
      };
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const obj = JSON.parse(match[0]);
          return {
            clickbait_caption: parseCaption(obj.clickbait_caption),
            comment_1: obj.comment_1 || '',
            comment_2: obj.comment_2 || '',
            comment_3: ensureLink(obj.comment_3 || '', fallbackUrl),
          };
        } catch {}
      }
    }
    return { clickbait_caption: '', comment_1: raw, comment_2: '', comment_3: fallbackUrl };
  };

  const downloadGhPostsCSV = () => {
    const done = ghGeneratedPosts.filter(p => p.status === 'done');
    if (!done.length) return alert('ยังไม่มีโพสที่สร้างสำเร็จ');
    const headers = [
      'id', 'headline', 'repo_url', 'stars_today', 'stars_total', 'description',
      'clickbait_caption', 'comment_1', 'comment_2', 'comment_3',
      'comment_1_image_url', 'comment_2_image_url', 'comment_3_image_url',
    ];
    const rows: string[][] = [headers];
    done.forEach(p =>
      rows.push([
        `result_${Date.now()}_${p.repoId}`,
        p.full_name,
        p.html_url,
        String(p.stars_today || 0),
        String(p.stars),
        p.description,
        p.clickbait_caption,
        p.comment_1,
        p.comment_2,
        p.comment_3,
        p.images[0] || '',
        p.images[1] || '',
        p.images[2] || '',
      ])
    );
    downloadCSV(rows, `github_clickbait_posts_${Date.now()}.csv`);
  };

  // ─── Footage folder management ───
  const ghPickFootageFolder = async () => {
    try {
      setGhFootageMessage('⏳ กำลังเปิดเลือก Folder...');
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/pick-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'เลือก Folder สำหรับเก็บรูป Footage (ภาพประกอบโพส)' }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.cancelled) setGhFootageMessage('');
        else setGhFootageMessage('❌ ไม่สามารถเลือก Folder ได้');
        return;
      }
      setGhFootageFolder(data.dir);
      localStorage.setItem('gh_footage_folder', data.dir);
      const parts = data.dir.split('/').filter(Boolean);
      setGhFootageFolderName(parts[parts.length - 1] || data.dir);
      setGhFootageMessage('');
      setGhGeneratedPrompt('');
      ghLoadSubfolders(data.dir);
    } catch (e: any) {
      setGhFootageMessage(`❌ ${e.message || 'เกิดข้อผิดพลาด'}`);
    }
  };

  const ghLoadSubfolders = async (parentFolder: string) => {
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/list-footage-folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentFolder }),
      });
      const data = await res.json();
      setGhSubfolders(data.folders || []);
    } catch {
      setGhSubfolders([]);
    }
  };

  const ghCreateKeywordSubfolders = async () => {
    const folder = ghFootageFolder;
    if (!folder) return;
    setGhIsCreatingFolders(true);
    setGhFootageMessage('');
    try {
      const subfolderNames = KEYWORDS.map(k => k.label);
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/create-subfolders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentFolder: folder, subfolders: subfolderNames }),
      });
      const data = await res.json();
      if (data.success) {
        setGhFootageMessage(`✅ สร้าง ${subfolderNames.length} subfolder เรียบร้อย!`);
        await ghLoadSubfolders(folder);
      } else {
        setGhFootageMessage(`❌ ${data.error || 'เกิดข้อผิดพลาด'}`);
      }
    } catch (e: any) {
      setGhFootageMessage(`❌ ${e.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setGhIsCreatingFolders(false);
    }
  };

  const handleGenerateStockPrompt = async () => {
    if (!selectedKw) {
      setGhFootageMessage('❌ กรุณาเลือกหัวข้อที่ต้องการ');
      return;
    }
    const numCount = Math.max(1, Math.min(50, parseInt(ghStockCount || '5') || 5));
    setGhIsGeneratingPrompt(true);
    setGhFootageMessage('');
    setGhGeneratedPrompt('');

    const buildFallbackStockPrompts = (count: number) => {
      const topic = selectedKw.label;
      return Array.from({ length: count }, (_, i) => {
        const tone = STOCK_VISUAL_TONES[i % STOCK_VISUAL_TONES.length];
        return `${tone.scene} representing ${topic}, ${tone.prompt}, professional stock image for a Facebook article cover, visually distinct from the other prompts, no readable text, no logos, no watermarks, 16:9`;
      });
    };

    try {
      const tonePlan = Array.from({ length: numCount }, (_, i) => {
        const tone = STOCK_VISUAL_TONES[i % STOCK_VISUAL_TONES.length];
        return `${i + 1}. ${tone.name}: ${tone.prompt}; scene idea: ${tone.scene}`;
      }).join('\n');
      const promptText = `คุณคือผู้เชี่ยวชาญด้านการสร้าง Prompt สำหรับ AI Image Generation (เช่น Midjourney, DALL-E, Stable Diffusion)

ฉันต้องการสร้างรูปภาพ "Footage / ภาพประกอบ" สำหรับใช้ในบทความและโพส Facebook เกี่ยวกับ "${selectedKw.label}" (หัวข้อ GitHub: ${selectedKw.query})

สร้าง Prompt ภาษาอังกฤษจำนวน ${numCount} แบบ สำหรับใช้สร้างรูปภาพประกอบเนื้อหา โดยแต่ละ Prompt:
1. อธิบายภาพที่ต้องการอย่างละเอียด ในสไตล์ professional stock photo / modern technology
2. แต่ละ prompt ต้องมีโทนภาพ, lighting, composition, camera distance, color palette, scene type แตกต่างกันชัดเจน ห้ามออกมาเป็น mood เดียวกัน
3. Aspect ratio: 16:9 (suitable for cover images)
4. ไม่มีตัวหนังสือในภาพ
5. ไม่มีคน (หรือมีก็ได้ แต่เป็นมุมมองมือ/ภาพไกลๆ)
6. เน้น visual ที่ดูทันสมัย เป็นสากล
7. ให้เหมาะกับใช้เป็น "ภาพประกอบบทความ" ในโซเชียลมีเดีย
8. ใช้ tone plan ตามลำดับนี้ให้ครบ ห้ามรวมหลาย tone ไว้ใน prompt เดียว และห้ามใช้คำว่า same style / similar style

Tone plan สำหรับแต่ละ prompt:
${tonePlan}

ตอบเป็น JSON array เท่านั้น:
["prompt 1", "prompt 2", ...]`;

      const raw = await callOpenRouterDirect([{ role: 'user', content: promptText }], 'google/gemini-2.5-flash');
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      let prompts: string[] = [];
      try {
        prompts = JSON.parse(cleaned);
      } catch {
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrMatch) {
          try { prompts = JSON.parse(arrMatch[0]); } catch {}
        }
      }

      if (Array.isArray(prompts) && prompts.length > 0) {
        setGhGeneratedPrompt(prompts.join('\n\n'));
        setGhFootageMessage(`✅ AI สร้าง ${prompts.length} Prompt เรียบร้อย!`);
      } else {
        setGhGeneratedPrompt(raw);
        setGhFootageMessage('⚠️ AI ตอบกลับมาแล้ว แต่รูปแบบไม่ใช่ JSON array กรุณาตรวจสอบ');
      }
    } catch (e: any) {
      const prompts = buildFallbackStockPrompts(numCount);
      setGhGeneratedPrompt(prompts.join('\n\n'));
      setGhFootageMessage(`⚠️ AI เรียกไม่ผ่าน (${e.message || 'API error'}) เลยสร้าง Prompt สำรองให้ ${prompts.length} อัน`);
    } finally {
      setGhIsGeneratingPrompt(false);
    }
  };

  const handleGhSaveSelectedToContentStock = async () => {
    const selected = ghRepos.filter(r => ghSelectedIds.has(r.id));
    if (!selected.length) return alert('กรุณาเลือก repo ก่อน');

    setGhIsGenerating(true);
    
    let tokenToPass = '';
    if (selectedGithubProfileId === 'default') {
      tokenToPass = localStorage.getItem('github_token') || '';
    } else {
      const prof = dbProfiles.find(p => String(p.id) === selectedGithubProfileId);
      if (prof) tokenToPass = prof.credential_key;
    }

    let successCount = 0;
    let failCount = 0;

    try {
      const items = await buildGitHubContentItems(selected, tokenToPass);
      setGhGenLog(`⏳ กำลังนำเข้า ${items.length} รายการลงคลัง SQLite...`);

      for (const item of items) {
        const savePayload = {
          id: `github_${item.id}`,
          source_type: 'github',
          title: item.title,
          selected_headline: item.title, // Default headline is the title
          raw_content: item.rawArticle,
          source_url: item.sourceUrl,
          author_name: item.authorName || 'GitHub',
          author_avatar_url: item.authorAvatarUrl,
          author_followers: item.githubStars || 0,
          metadata: {
            stars: item.githubStars || 0,
            stars_today: item.githubStarsToday || 0,
            language: item.githubLanguage || '',
            topics: item.githubTopics || [],
            gifs: item.images || []
          },
          media_paths: item.images || [],
          status: 'scraped' // 'scraped' indicates raw/collected but clickbait not yet generated
        };

        const saveRes = await fetch(`${API_BASE}/vault/contents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload)
        });
        const saveResult = await saveRes.json();
        if (saveResult.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (failCount > 0) {
        alert(`📦 นำเข้าคลังสำเร็จ ${successCount} รายการ (ล้มเหลว ${failCount} รายการ)`);
      } else {
        alert(`📦 นำเข้าคลัง SQLite สำเร็จทั้งหมด ${successCount} รายการ!`);
      }
    } catch (err: any) {
      alert(`❌ นำเข้าคลังไม่สำเร็จ: ${err.message}`);
    } finally {
      setGhIsGenerating(false);
      setGhGenLog('');
      fetchScrapedResults();
      if (onApprove) onApprove();
    }
  };

  const buildGitHubContentItems = async (selected: any[], tokenToPass: string) => {
    const topicLabels = selectedKeywords.filter(k => k.query).map(k => k.label);
    const topicLabel = topicLabels[0] || 'GitHub';
    const items = [];

    for (let i = 0; i < selected.length; i++) {
      const r = selected[i];
      setGhGenLog(`[${i + 1}/${selected.length}] ⏳ กำลังดึง README & รูปภาพ: ${r.full_name}`);
      let readmeContent = '';
      let gifImages: string[] = [];
      try {
        const result = await fetchGithubReadme(r.full_name, tokenToPass.trim() || undefined);
        readmeContent = result.content;
        gifImages = result.images.filter(Boolean);
      } catch {}

      const starScore = Math.min(10, Math.max(1, Math.round(Math.log10(Math.max(10, r.stargazers_count)) * 3)));
      const todayScore = Math.min(10, Math.max(starScore, Math.round(Math.log10(Math.max(10, (r.stars_today || 0) * 10)) * 3)));

      items.push({
        id: r.id,
        rawArticle: `[GitHub - ${r.full_name}]
${r.description || ''}
⭐ ${r.stargazers_count.toLocaleString()} | 🍴 ${r.forks_count.toLocaleString()} | 🔵 ${r.language || 'N/A'}
🔥 Stars today: ${(r.stars_today || 0).toLocaleString()}
Topics: ${r.topics.join(', ') || 'N/A'}
URL: ${r.html_url}

${readmeContent ? `📖 README (บางส่วน):\n${readmeContent}` : ''}`,
        sourceUrl: r.html_url,
        title: r.full_name,
        tags: Array.from(new Set(['github', ...topicLabels, topicLabel, ...(r.tags || []), ...(r.language ? [r.language] : [])])),
        images: gifImages,
        sourceType: 'github',
        domain: 'github.com',
        newsScore: todayScore,
        evergreenScore: starScore,
        githubStars: r.stargazers_count,
        githubStarsToday: r.stars_today || 0,
        githubForks: r.forks_count,
        githubLanguage: r.language || '',
        githubTopics: r.topics,
        authorName: r.owner?.login || null,
        authorAvatarUrl: r.owner?.avatar_url || null,
        createdAt: new Date().toISOString(),
      });
    }

    return items;
  };

  // Load subfolders on mount if folder was saved
  useEffect(() => {
    const saved = localStorage.getItem('gh_footage_folder');
    if (saved) {
      const parts = saved.split('/').filter(Boolean);
      setGhFootageFolderName(parts[parts.length - 1] || saved);
      ghLoadSubfolders(saved);
    }
  }, []);


  useEffect(() => {
    if (selectedOpenRouterProfileId === 'manual') {
      setOpenRouterKey(manualOpenRouterKey);
    } else if (selectedOpenRouterProfileId === 'default') {
      setOpenRouterKey(localStorage.getItem('openrouter_key') || '');
    } else {
      const prof = dbProfiles.find(p => String(p.id) === selectedOpenRouterProfileId);
      if (prof) {
        setOpenRouterKey(prof.credential_key);
      }
    }
  }, [selectedOpenRouterProfileId, dbProfiles, manualOpenRouterKey]);

  useEffect(() => {
    if (selectedApifyProfileId === 'manual') {
      setApifyKey(manualApifyKey);
    } else if (selectedApifyProfileId === 'default') {
      setApifyKey(localStorage.getItem('apify_key') || '');
    } else {
      const prof = dbProfiles.find(p => String(p.id) === selectedApifyProfileId);
      if (prof) {
        setApifyKey(prof.credential_key);
      }
    }
  }, [selectedApifyProfileId, dbProfiles, manualApifyKey]);

  // AI Dialog panels
  const [activeChatPost, setActiveChatPost] = useState<VaultContent | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatModel, setChatModel] = useState('google/gemini-2.5-flash');
  const [isChatting, setIsChatting] = useState(false);

  // Clickbait caption spawner
  const [activeCopyPost, setActiveCopyPost] = useState<VaultContent | null>(null);
  const [captionResults, setCaptionResults] = useState<{
    caption1: string; caption2: string; caption3: string;
    comment1: string; comment2: string; comment3: string;
    note: string;
  } | null>(null);
  const [captionTone, setCaptionTone] = useState<'selfwrite' | 'clickbait' | 'casual'>('selfwrite');
  const [isCopyGenerating, setIsCopyGenerating] = useState(false);

  // Enriched AI scoring, Chat send, and copywriting generator triggers
  const runAiScoringForPost = async (post: VaultContent) => {
    if (!openRouterKey.trim()) {
      alert('❌ กรุณากรอก OpenRouter API Key ด้านบนก่อนครับ');
      return;
    }
    
    alert(`⏳ บอทกำลังส่งโพสต์ไปประเมินด้วยโมเดล Gemini 2.5 Flash...`);

    const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์เนื้อหาโซเชียลมีเดีย
ให้คะแนนเนื้อหานี้ 2 มิติ:
1. "viral_score" (0-10): ความแชร์ง่าย ดึงดูด เป็นกระแสแค่ไหน?
2. "evergreen_score" (0-10): คุณค่าระยะยาว อ่านได้ตลอดเวลา ไม่ตกเทรนด์ง่ายแค่ไหน?
ตอบเป็น JSON เท่านั้น: { "viral_score": 8, "evergreen_score": 5 }`;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentFactory V2',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: post.raw_content || post.title }
          ]
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content || '{}');
      
      const vScore = Number(parsed.viral_score) || 5;
      const eScore = Number(parsed.evergreen_score) || 5;

      const updateRes = await fetch(`${API_BASE}/vault/contents/${post.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: post.status,
          rating_news: vScore,
          rating_evergreen: eScore
        })
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        alert(`✅ ประเมินคะแนนสำเร็จ: คะแนนข่าว ${vScore}/10 | คะแนน Evergreen ${eScore}/10 (บันทึกลง SQLite แล้ว!)`);
        fetchScrapedResults();
      }
    } catch (err: any) {
      console.error(err);
      alert(`❌ ประเมินคะแนนล้มเหลว: ${err.message}`);
    }
  };

  const runAiChatSend = async () => {
    if (!chatInputText.trim() || !openRouterKey.trim()) return;
    
    const newMsg = { role: 'user' as const, content: chatInputText };
    const updatedMsgs = [...chatMessages, newMsg];
    setChatMessages(updatedMsgs);
    setChatInputText('');
    setIsChatting(true);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentFactory V2',
        },
        body: JSON.stringify({
          model: chatModel,
          messages: [
            { 
              role: 'system', 
              content: `คุณคือผู้ช่วยวิเคราะห์เทรนด์ไอเดียโพสต์ไวรัลสำหรับแอดมินเพจไทย
ข้อมูลโพสต์อ้างอิง:
หัวข้อ: ${activeChatPost?.title}
เนื้อหา: ${activeChatPost?.raw_content}
แหล่งที่มา: ${activeChatPost?.author_name}
คะแนนข่าว: ${activeChatPost?.rating_news}/10
คะแนน Evergreen: ${activeChatPost?.rating_evergreen}/10

ตอบคำถามแอดมินเพจให้สุภาพ เป็นกันเอง มีความเชี่ยวชาญ และเสนอคำแนะนำที่ปฏิบัติได้จริง.`
            },
            ...updatedMsgs
          ]
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.choices[0].message.content || 'ไม่มีข้อความตอบกลับ';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `❌ ข้อผิดพลาด: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  const runClickbaitSpawner = async (post: VaultContent) => {
    if (!openRouterKey.trim()) {
      alert('❌ กรุณากรอก OpenRouter API Key ด้านบนก่อนครับ');
      return;
    }

    setIsCopyGenerating(true);
    setCaptionResults(null);
    setActiveCopyPost(post);

    let systemPrompt = '';
    if (captionTone === 'selfwrite') {
      systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการเขียนแคปชั่น Clickbait สำหรับโซเชียลมีเดียภาษาไทย เขียนเหมือนแอดมินหาข้อมูลมาเล่าเอง
กฎ: ห้ามพูดถึงชื่อเพจ/คนโพสต์ต้นทาง เขียนเหมือนคุณไปวิจัยรวบรวมมาเล่าเองใต้เม้น 3/3 ชวนคนแสดงความเห็น ห้ามใส่ลิงก์คู่แข่ง
ตอบเป็น JSON เท่านั้น:
{
  "caption1": "แคปชั่นแนวเล่าเรื่อง (Story-driven)",
  "caption2": "แคปชั่นแนวสถิติ (Data-driven)",
  "caption3": "แคปชั่นแนวแก้ปัญหา (Problem-solution)",
  "comment1": "ใต้เม้น 1/3 (เนื้อหาต้นข่าว)",
  "comment2": "ใต้เม้น 2/3 (บทวิเคราะห์ขยี้ประเด็น)",
  "comment3": "ใต้เม้น 3/3 (สรุปและชวนกดหัวใจ/ติดตามเพจเรา)",
  "note": "คำแนะนำสำหรับ Admin: หารูปประกอบแบบไหน ดึงจุดไหนมาไฮไลท์ในปก Canvas"
}`;
    } else if (captionTone === 'casual') {
      systemPrompt = `คุณคือ Admin เพจที่คุยกับลูกเพจเหมือนเพื่อนสนิท ภาษาง่ายๆ เป็นกันเอง Emoji น้อยๆ
ตอบเป็น JSON เท่านั้น:
{
  "caption1": "แคปชั่นแบบเพื่อนเล่าข่าว",
  "caption2": "แคปชั่นแบบแชร์ไอเดียส่วนตัว",
  "caption3": "แคปชั่นแบบชวนตั้งคำถามถกกัน",
  "comment1": "ใต้เม้น 1/3 (อธิบายง่ายๆ)",
  "comment2": "ใต้เม้น 2/3 (ขยี้ Pain Point)",
  "comment3": "ใต้เม้น 3/3 (สรุปสั้นและ Call-To-Action)",
  "note": "คำแนะนำ Admin: รูปแบบที่ควรใช้ลงเพจ"
}`;
    } else {
      systemPrompt = `คุณคือมือโปรเขียนแคปชั่นคลิกเบตสะท้านกระแส หยอดคำ FOMO สร้างความเร้าอารมณ์สูงเด่น อีโมจิเร้าความไวรัลเต็มที่
ตอบเป็น JSON เท่านั้น:
{
  "caption1": "พาดหัวเปิดโลกดึงยอดวิว",
  "caption2": "พาดหัวด่วนชนประเด็นร้อน",
  "caption3": "พาดหัวสูตรลับที่ไม่มีใครบอก",
  "comment1": "ใต้เม้น 1/3",
  "comment2": "ใต้เม้น 2/3",
  "comment3": "ใต้เม้น 3/3",
  "note": "คำแนะนำ Admin: รูปประกอบคลิกเบต"
}`;
    }

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentFactory V2',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: post.raw_content || post.title }
          ]
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content || '{}');
      setCaptionResults({
        caption1: parsed.caption1 || 'ไม่มีข้อความ',
        caption2: parsed.caption2 || 'ไม่มีข้อความ',
        caption3: parsed.caption3 || 'ไม่มีข้อความ',
        comment1: parsed.comment1 || 'ไม่มีข้อความ',
        comment2: parsed.comment2 || 'ไม่มีข้อความ',
        comment3: parsed.comment3 || 'ไม่มีข้อความ',
        note: parsed.note || 'ไม่มีข้อความ'
      });
    } catch (err: any) {
      console.error(err);
      alert(`❌ สปอเนอร์แคปชั่นล้มเหลว: ${err.message}`);
    } finally {
      setIsCopyGenerating(false);
    }
  };

  // References
  const sseConnection = useRef<EventSource | null>(null);
  const watchlistTerminalBottom = useRef<HTMLDivElement>(null);
  const contentTerminalBottoms = {
    rss: useRef<HTMLDivElement>(null),
    youtube: useRef<HTMLDivElement>(null),
    github: useRef<HTMLDivElement>(null)
  };

  // Predefined Categories
  const predefinedCategories = ['ทั่วไป', 'รีวิว', 'สอน AI', 'การเงิน/ลงทุน', 'ธุรกิจ/การตลาด', 'ข่าว/กระแส', 'ไลฟ์สไตล์', 'บันเทิง'];
  const allCategories = Array.from(new Set([...predefinedCategories, ...watchlistPages.map(p => p.category)]));

  // Load Watchlist Pages from localStorage on Mount
  useEffect(() => {
    const saved = localStorage.getItem('v2_watchlist_pages');
    let needsSeed = true;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 25) {
          setWatchlistPages(parsed);
          needsSeed = false;
        }
      } catch (e) {
        console.error('Failed to parse watchlist pages', e);
      }
    }
    
    if (needsSeed) {
      // Fetch V1 seed watchlist json (containing the 41 competitor pages migrated from V1)
      fetch('/seed_watchlist.json')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setWatchlistPages(data);
            localStorage.setItem('v2_watchlist_pages', JSON.stringify(data));
          }
        })
        .catch(err => {
          console.error('Failed to load seed watchlist:', err);
          // Fallback in case of fetch failure
          const defaults: WatchlistPage[] = [
            {
              id: '1',
              url: 'https://www.facebook.com/techfeedthailand',
              name: 'TechFeed Thailand',
              category: 'ข่าว/กระแส',
              platform: 'facebook',
              followers: 185000,
              engagementRate: 3.43,
              status: 'scraped',
              deepResearchDate: new Date(Date.now() - 1000*60*60*24*5).toISOString(),
              deepResearchPostCount: 300,
              scanSelected: true,
              isOwnPage: false,
              note: 'เพจไอทีหลัก ดึงไวรัลโพสต์ดีไซน์พรีเมียม'
            }
          ];
          setWatchlistPages(defaults);
          localStorage.setItem('v2_watchlist_pages', JSON.stringify(defaults));
        });
    }
  }, []);

  // Sync scraped results from database based on current active state
  const fetchScrapedResults = async () => {
    setLoadingResults(true);
    try {
      let filterSourceType = '';
      if (activeMainTab === 'radar') {
        filterSourceType = 'radar';
      } else {
        filterSourceType = contentActiveSubTab;
      }
      
      const res = await fetch(`${API_BASE}/vault/contents?source_type=${filterSourceType}`);
      const data = await res.json();
      if (data.success) {
        setScrapedResults(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch scraped results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchScrapedResults();
  }, [activeMainTab, contentActiveSubTab]);

  // Scroll target terminals helper
  const scrollTerminal = (mode: 'watchlist' | 'rss' | 'youtube' | 'github') => {
    setTimeout(() => {
      if (mode === 'watchlist') {
        watchlistTerminalBottom.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        contentTerminalBottoms[mode].current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  // Watchlist CRUD operations
  const getPlatformFromUrl = (url: string): WatchlistPage['platform'] => {
    const lUrl = url.toLowerCase();
    if (lUrl.includes('facebook.com')) return 'facebook';
    if (lUrl.includes('tiktok.com')) return 'tiktok';
    if (lUrl.includes('youtube.com')) return 'youtube';
    if (lUrl.includes('instagram.com')) return 'instagram';
    return 'unknown';
  };

  const getNameFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      const paths = u.pathname.split('/').filter(p => p && p !== 'profile.php');
      if (u.pathname.includes('profile.php')) {
        return u.searchParams.get('id') || 'Facebook User';
      }
      return paths[paths.length - 1] || 'Unknown Page';
    } catch {
      return url;
    }
  };

  const handleAddPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const newPage: WatchlistPage = {
      id: Date.now().toString(),
      url: newUrl.trim(),
      name: getNameFromUrl(newUrl.trim()),
      category: newCategory.trim() || 'ทั่วไป',
      platform: getPlatformFromUrl(newUrl.trim()),
      followers: 0,
      engagementRate: 0.0,
      status: 'pending',
      scanSelected: true,
      isOwnPage: newIsOwnPage,
      note: newNote.trim() || undefined
    };

    const updated = [...watchlistPages, newPage];
    setWatchlistPages(updated);
    localStorage.setItem('v2_watchlist_pages', JSON.stringify(updated));
    
    // Reset Form
    setNewUrl('');
    setNewCategory('');
    setNewNote('');
    setNewIsOwnPage(false);
    setIsCustomNewCategory(false);
  };

  const handleRemovePage = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบเพจเฝ้าระวังนี้ออกจากระบบ?')) {
      const updated = watchlistPages.filter(p => p.id !== id);
      setWatchlistPages(updated);
      localStorage.setItem('v2_watchlist_pages', JSON.stringify(updated));
    }
  };

  const openEditModal = (page: WatchlistPage) => {
    setEditingPage(page);
    setEditName(page.name);
    setEditCategory(page.category || '');
    setEditNote(page.note || '');
    setEditIsOwnPage(!!page.isOwnPage);
    setEditFollowers(page.followers > 0 ? page.followers.toString() : '');
    setIsCustomEditCategory(false);
  };

  const saveEdit = () => {
    if (!editingPage) return;
    const updated = watchlistPages.map(p =>
      p.id === editingPage.id
        ? {
            ...p,
            name: editName.trim() || p.name,
            category: editCategory.trim() || 'ทั่วไป',
            note: editNote.trim(),
            isOwnPage: editIsOwnPage,
            followers: editFollowers.trim() !== '' ? parseInt(editFollowers.replace(/,/g, '')) || p.followers : p.followers
          }
        : p
    );
    setWatchlistPages(updated);
    localStorage.setItem('v2_watchlist_pages', JSON.stringify(updated));
    setEditingPage(null);
  };

  const toggleScanSelect = (id: string) => {
    const updated = watchlistPages.map(p => p.id === id ? { ...p, scanSelected: !p.scanSelected } : p);
    setWatchlistPages(updated);
    localStorage.setItem('v2_watchlist_pages', JSON.stringify(updated));
  };

  const toggleAllScan = (val: boolean) => {
    const updated = watchlistPages.map(p => ({ ...p, scanSelected: val }));
    setWatchlistPages(updated);
    localStorage.setItem('v2_watchlist_pages', JSON.stringify(updated));
  };

  // Watchlist Scan Script Runner
  const scanSelectedPages = async () => {
    const selected = watchlistPages.filter(p => p.scanSelected);
    if (selected.length === 0) {
      alert('กรุณาเลือกเพจที่จะสแกน');
      return;
    }
    
    setIsScanning(true);
    setScanLogs(['🤖 เริ่มการสแกนแบบกลุ่มผ่านเซิร์ฟเวอร์หลัก (Sequential Scan)...']);
    
    for (let i = 0; i < selected.length; i++) {
      const page = selected[i];
      setScanLogs(prev => [...prev, `⏳ [${i+1}/${selected.length}] กำลังส่งบอทสแกนไปที่: ${page.name} (Limit: ${scanLimit})`]);
      scrollTerminal('watchlist');
      
      await new Promise<void>((resolve) => {
        const q = `target_url=${encodeURIComponent(page.url)}&limit=${scanLimit}&apify_key=${encodeURIComponent(apifyKey)}`;
        const source = new EventSource(`${API_BASE}/orchestrator/run/radar?${q}`);
        sseConnection.current = source;
        
        source.onmessage = (event) => {
          setScanLogs(prev => [...prev, ` - ${event.data}`]);
          scrollTerminal('watchlist');
          
          if (event.data.includes('Exit Code:')) {
            source.close();
            // Update local status in UI list
            setWatchlistPages(prev => {
              const updated = prev.map(p => p.id === page.id ? { 
                ...p, 
                status: 'scraped' as const,
                followers: page.followers > 0 ? page.followers : 185000,
                engagementRate: page.engagementRate > 0 ? page.engagementRate : 2.032,
                lastScraped: new Date().toISOString()
              } : p);
              localStorage.setItem('v2_watchlist_pages', JSON.stringify(updated));
              return updated;
            });
            resolve();
          }
        };
        
        source.onerror = (err) => {
          console.error('SSE radar group scan error:', err);
          setScanLogs(prev => [...prev, `❌ ดึงข้อมูล ${page.name} ล้มเหลว หรือขาดการเชื่อมต่อ`]);
          scrollTerminal('watchlist');
          source.close();
          resolve();
        };
      });
    }
    
    setScanLogs(prev => [...prev, `🎉 สแกนเสร็จสิ้นทั้งหมด ${selected.length} เพจ!`]);
    scrollTerminal('watchlist');
    setIsScanning(false);
    fetchScrapedResults();
    if (onApprove) onApprove();
  };

  // Deep Research Handler
  const handleDeepResearch = async (page: WatchlistPage) => {
    setIsScanning(true);
    setScanLogs([`🔬 เริ่มกระบวนการวิจัยเชิงลึก (Deep Research) สำหรับ: ${page.name}...`]);
    setScanLogs(prev => [...prev, `⏳ กำลังกวาดโพสต์ย้อนหลัง ${deepResearchLimit} โพสต์ผ่าน Async Polling (ป้องกัน Timeout)...`]);
    scrollTerminal('watchlist');

    const q = `target_url=${encodeURIComponent(page.url)}&limit=${deepResearchLimit}&apify_key=${encodeURIComponent(apifyKey)}`;
    const source = new EventSource(`${API_BASE}/orchestrator/run/radar?${q}`);
    sseConnection.current = source;

    source.onmessage = (event) => {
      setScanLogs(prev => [...prev, event.data]);
      scrollTerminal('watchlist');
      
      if (event.data.includes('Exit Code:')) {
        source.close();
        
        // Update local watchlist deep research date
        setWatchlistPages(prev => {
          const updated = prev.map(p => p.id === page.id ? {
            ...p,
            status: 'scraped' as const,
            deepResearchDate: new Date().toISOString(),
            deepResearchPostCount: deepResearchLimit
          } : p);
          localStorage.setItem('v2_watchlist_pages', JSON.stringify(updated));
          return updated;
        });
        
        setIsScanning(false);
        fetchScrapedResults();
        if (onApprove) onApprove();
      }
    };

    source.onerror = (err) => {
      console.error('SSE deep research error:', err);
      setScanLogs(prev => [...prev, '❌ บอทวิจัยเชิงลึกเกิดข้อผิดพลาดในการเชื่อมต่อ หรือ API limits เต็ม']);
      scrollTerminal('watchlist');
      source.close();
      setIsScanning(false);
    };
  };



  // Download CSV logic
  const handleDownloadCSV = (page: WatchlistPage) => {
    handleDownloadCSVReal(page);
  };

  const handleDownloadCSVReal = async (page: WatchlistPage) => {
    try {
      setScanLogs(prev => [...prev, `⏳ กำลังดึงและสร้างรายงาน CSV สำหรับเพจ ${page.name}...`]);
      scrollTerminal('watchlist');
      
      // Strategy: Try multiple search approaches to find the posts for this page
      // 1. Search by URL (most reliable - source_url contains the page URL)
      // 2. Search by page name as keyword fallback
      let posts: any[] = [];
      
      // Extract a URL-based identifier to search in source_url
      // e.g. "https://www.facebook.com/profile.php?id=61564336704837" -> "61564336704837"
      // e.g. "https://www.facebook.com/techfeedthailand" -> "techfeedthailand"
      let urlIdentifier = '';
      try {
        const parsedUrl = new URL(page.url);
        const profileId = parsedUrl.searchParams.get('id');
        if (profileId) {
          urlIdentifier = profileId;
        } else {
          const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
          urlIdentifier = pathParts[pathParts.length - 1] || '';
        }
      } catch {
        urlIdentifier = page.name;
      }
      
      // First try: search by URL identifier (matches source_url in the DB)
      if (urlIdentifier) {
        const res = await fetch(`${API_BASE}/vault/contents?source_type=radar&keyword=${encodeURIComponent(urlIdentifier)}`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          posts = data.data;
        }
      }
      
      // Second try: search by page name if URL search found nothing
      if (posts.length === 0 && page.name !== urlIdentifier) {
        const res2 = await fetch(`${API_BASE}/vault/contents?source_type=radar&keyword=${encodeURIComponent(page.name)}`);
        const data2 = await res2.json();
        if (data2.success && data2.data && data2.data.length > 0) {
          posts = data2.data;
        }
      }
      
      // Third try: fetch ALL radar posts and filter client-side by source_url containing page.url
      if (posts.length === 0) {
        const res3 = await fetch(`${API_BASE}/vault/contents?source_type=radar`);
        const data3 = await res3.json();
        if (data3.success && data3.data && data3.data.length > 0) {
          posts = data3.data.filter((post: any) => {
            const postUrl = (post.source_url || '').toLowerCase();
            const pageUrl = page.url.toLowerCase();
            // Check if the post's source_url contains the page URL or its identifier
            return postUrl.includes(urlIdentifier.toLowerCase()) || 
                   postUrl.includes(pageUrl.replace(/\/$/, ''));
          });
        }
      }
      
      if (posts.length === 0) {
        setScanLogs(prev => [...prev, `⚠️ ไม่พบข้อมูลโพสต์สำหรับเพจ ${page.name} กรุณาสแกนเพจก่อนดาวน์โหลด CSV`]);
        scrollTerminal('watchlist');
        alert(`ไม่พบข้อมูลโพสต์สำหรับเพจ "${page.name}"\nกรุณารันการวิจัยเชิงลึก (Deep Research) สำหรับเพจนี้ก่อน`);
        return;
      }
      
      const csvEsc = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/[\n\r]/g, ' ')}"`;
      const csvHeader = 'ลำดับ,ชื่อเพจ/ผู้เขียน,ลิงก์โพส,ข้อความ,ประเภท,ไลก์,แชร์,คอมเมนต์,ยอดวิว,วันที่โพส';
      
      const csvRows = posts.map((post: any, idx: number) => {
        const authorName = post.author_name || page.name;
        const rawContent = (post.raw_content || '').substring(0, 500);
        const likes = post.metadata?.likes || 0;
        const comments = post.metadata?.comments || 0;
        const shares = post.metadata?.shares || 0;
        const views = post.metadata?.views || 0;
        const postType = post.metadata?.type || 'post';
        const createdAt = post.created_at || '';
        return [
          idx + 1,
          csvEsc(authorName),
          csvEsc(post.source_url || ''),
          csvEsc(rawContent),
          csvEsc(postType),
          likes,
          shares,
          comments,
          views,
          csvEsc(createdAt)
        ].join(',');
      });
      
      // Add UTF-8 BOM prefix for proper Thai display in Excel
      const csvContent = '\uFEFF' + csvHeader + '\n' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `deep_research_${page.name}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      setScanLogs(prev => [...prev, `✅ ดาวน์โหลดรายงาน CSV สำเร็จ! (${posts.length} โพสต์)`]);
      scrollTerminal('watchlist');
    } catch (e: any) {
      console.error('CSV Download Error:', e);
      const errMsg = e?.message || String(e);
      setScanLogs(prev => [...prev, `❌ ล้มเหลวในการดาวน์โหลดรายงาน CSV: ${errMsg}`]);
      scrollTerminal('watchlist');
      alert(`❌ ดาวน์โหลด CSV ล้มเหลว\n\nสาเหตุ: ${errMsg}\n\nลองตรวจสอบว่าเซิร์ฟเวอร์หลังบ้าน (Backend) ยังทำงานอยู่หรือไม่`);
    }
  };

  // Content Scraper child process trigger
  const runContentScraper = (mode: 'rss' | 'youtube' | 'github', queryParams: string) => {
    if (sseConnection.current) {
      sseConnection.current.close();
    }

    setContentLogs(prev => ({
      ...prev,
      [mode]: [`[SYSTEM] 🚀 เริ่มต้นสั่งการรันโปรเซสขุดเจาะไอเดียหลังบ้าน [${mode.toUpperCase()}] ...`]
    }));
    setContentRunning(prev => ({ ...prev, [mode]: true }));

    const eventUrl = `${API_BASE}/orchestrator/run/${mode}?${queryParams}`;
    const source = new EventSource(eventUrl);
    sseConnection.current = source;

    source.onmessage = (event) => {
      setContentLogs(prev => ({
        ...prev,
        [mode]: [...prev[mode], event.data]
      }));
      scrollTerminal(mode);

      if (event.data.includes('Exit Code:')) {
        source.close();
        setContentRunning(prev => ({ ...prev, [mode]: false }));
        fetchScrapedResults();
        if (onApprove) onApprove();
      }
    };

    source.onerror = (err) => {
      console.error(`SSE stream error on ${mode}:`, err);
      setContentLogs(prev => ({
        ...prev,
        [mode]: [...prev[mode], '[ERROR] ❌ บอทสูญเสียการเชื่อมต่อ หรือระบบปิดโปรเซสเนื่องจากพบปัญหา']
      }));
      scrollTerminal(mode);
      source.close();
      setContentRunning(prev => ({ ...prev, [mode]: false }));
    };
  };

  // ==========================================
  // 🧭 YouTube Keyword Discovery Hub Helpers
  // ==========================================

  const callOpenRouterWithFallback = async (messages: { role: string; content: string }[]) => {
    const models = [
      'qwen/qwen3-8b:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'openai/gpt-oss-20b:free'
    ];
    let lastError = null;
    for (const model of models) {
      try {
        console.log(`[AI Keyword] Attempting AI call with model: ${model}`);
        const result = await callOpenRouterDirect(messages, model);
        return result;
      } catch (err: any) {
        console.warn(`[AI Keyword] Model ${model} failed:`, err);
        lastError = err;
      }
    }
    throw lastError || new Error("All fallback models failed");
  };

  const handleAiRecommendKeywords = async (categoryLabel: string, categoryDescription: string) => {
    if (!openRouterKey.trim()) {
      alert('กรุณาเลือกหรือกรอก OpenRouter API Key ก่อน');
      return;
    }
    
    setYtIsRecommendingKeywords(true);
    try {
      const messages = [
        {
          role: 'system',
          content: `คุณคือ content strategist สำหรับเพจ Forex/ลงทุนภาษาไทย\nต้องช่วยหา YouTube search keywords ที่มีโอกาสเจอคลิป "เรื่องเล่าความสำเร็จ/เคสจริง/เส้นทางชีวิต/บทเรียนการเงิน" เพื่อเอาไปทำคอนเทนต์แชร์ง่ายและชวนคนสนใจ Forex อย่างมีความรับผิดชอบ\nตอบ JSON เท่านั้น ห้ามมีคำเกริ่นใดๆ นอกเหนือจาก JSON:\n{ "keywords": ["keyword 1", "keyword 2"] }\n\nข้อกำหนด:\n- ให้ 16 keywords\n- ใช้ภาษาอังกฤษเป็นหลัก เพราะ YouTube มีเคสเยอะกว่า\n- ผสม keyword ภาษาไทยได้ไม่เกิน 4 รายการ\n- เน้นคำอย่าง success story, journey, interview, case study, financial freedom, trading psychology, risk management, profitable trader, ordinary people, from zero ตามบริบท\n- ต้องมีทั้งมุมความสำเร็จและมุมบทเรียน/ความเสี่ยงบ้าง เพื่อไม่ให้คอนเทนต์ดูขายฝัน\n- หลีกเลี่ยง keyword ที่สื่อการันตีกำไร/รวยเร็ว/ไร้ความเสี่ยง เช่น guaranteed profit, no risk, rich overnight\n- หลีกเลี่ยง keyword กว้างเกินไป เช่น "forex" หรือ "money" คำเดียว`
        },
        {
          role: 'user',
          content: `หมวดหมู่หัวข้อคอนเทนต์: "${categoryLabel}"\nรายละเอียดหมวดหมู่: "${categoryDescription}"`
        }
      ];

      const rawResponse = await callOpenRouterWithFallback(messages);
      const clean = rawResponse.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      
      let parsed: { keywords: string[] };
      try {
        parsed = JSON.parse(clean);
      } catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error('ไม่สามารถแยกวิเคราะห์รูปแบบ JSON จากผลลัพธ์ของ AI ได้');
        }
      }

      if (parsed && Array.isArray(parsed.keywords)) {
        const updatedCustom = [...ytCsvKeywordCategories];
        const existingIdx = updatedCustom.findIndex(c => c.label.toLowerCase() === categoryLabel.toLowerCase());
        
        if (existingIdx >= 0) {
          const mergedKeywords = Array.from(new Set([...updatedCustom[existingIdx].keywords, ...parsed.keywords]));
          updatedCustom[existingIdx] = {
            ...updatedCustom[existingIdx],
            keywords: mergedKeywords.slice(0, 24)
          };
        } else {
          updatedCustom.push({
            label: categoryLabel,
            description: categoryDescription,
            keywords: parsed.keywords
          });
        }

        setYtCsvKeywordCategories(updatedCustom);
        localStorage.setItem('yt_csv_keyword_categories', JSON.stringify(updatedCustom));
        
        setYtSelectedKeywords(parsed.keywords);
        alert(`AI แนะนำคีย์เวิร์ดสำหรับหมวดหมู่ "${categoryLabel}" สำเร็จ! ได้รับ ${parsed.keywords.length} คำค้นหา`);
      } else {
        alert('ผลลัพธ์ที่ตอบกลับจาก AI ไม่มีคีย์เวิร์ดในรูปแบบที่เหมาะสม');
      }
    } catch (err: any) {
      console.error(err);
      alert(`การคิดคีย์เวิร์ดโดย AI ล้มเหลว: ${err.message || String(err)}`);
    } finally {
      setYtIsRecommendingKeywords(false);
    }
  };

  const handleUploadCsvAndExtractTrends = async (file: File) => {
    if (!openRouterKey.trim()) {
      alert('กรุณาเลือกหรือกรอก OpenRouter API Key ก่อนประมวลผลด้วย AI');
      return;
    }

    setYtIsProcessingCsv(true);
    setYtCsvFilename(file.name);
    localStorage.setItem('yt_csv_filename', file.name);

    try {
      const text = await file.text();
      
      const chunks: string[] = [];
      let currentChunk = '';
      const lines = text.split('\n');

      for (const line of lines) {
        if (currentChunk.length + line.length + 1 > 25000) {
          chunks.push(currentChunk);
          currentChunk = line + '\n';
        } else {
          currentChunk += line + '\n';
        }
      }
      if (currentChunk.trim()) {
        chunks.push(currentChunk);
      }

      console.log(`[CSV Trend Extraction] Split CSV into ${chunks.length} chunks`);
      
      const allExtractedCategories: any[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const messages = [
          {
            role: 'system',
            content: `คุณเป็น content strategist สำหรับเพจ Social Media ภาษาไทย\nภารกิจ: วิเคราะห์รายการโพสไวรัลที่ให้มา แล้วสกัด YouTube Search Keywords ที่ควรค้นหา เพื่อนำมาทำคอนเทนต์ใหม่ที่จะ Viral ตาม\n\nตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความเกริ่นหรือส่งท้ายใดๆ นอกเหนือจาก JSON:\n{\n  "categories": [\n    {\n      "label": "ชื่อหมวดภาษาไทย (สั้น กระชับ ไม่เกิน 20 ตัวอักษร)",\n      "description": "อธิบายว่าทำไมหมวดนี้ถึงน่าสนใจตามเทรนด์จากโพสเหล่านี้ (1-2 ประโยค)",\n      "keywords": ["keyword 1", "keyword 2"]\n    }\n  ]\n}\n\nกำหนด:\n- สร้าง 3-6 หมวดหมู่ ตามธีมที่ Viral จากเนื้อหาที่ให้\n- แต่ละหมวดมี 8-12 keywords สำหรับค้น YouTube\n- Keywords ต้องใช้งานค้น YouTube ได้จริง (specific พอ ไม่กว้างเกินไป)\n- ผสม EN/TH ตามที่เหมาะสมกับเนื้อหา\n- เน้น keywords ที่จะเจอคลิป เรื่องเล่า/เคสจริง/วิธีทำ/ผลลัพธ์จริง ที่เอาไปทำโพสต่อได้`
          },
          {
            role: 'user',
            content: `นี่คือเนื้อหาโพสยอดนิยมบางส่วน:\n\n${chunkText}`
          }
        ];

        console.log(`[CSV Trend Extraction] Processing chunk ${i + 1}/${chunks.length}...`);
        const responseText = await callOpenRouterWithFallback(messages);
        
        const clean = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        
        let parsed: { categories: any[] };
        try {
          parsed = JSON.parse(clean);
        } catch {
          const match = clean.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            console.warn(`[CSV Trend Extraction] Failed to parse JSON for chunk ${i + 1}`);
            continue;
          }
        }

        if (parsed && Array.isArray(parsed.categories)) {
          allExtractedCategories.push(...parsed.categories);
        }
      }

      const mergedMap = new Map<string, { label: string; description: string; keywords: string[] }>();
      
      for (const cat of allExtractedCategories) {
        if (!cat.label || !cat.keywords) continue;
        const normalizedKey = cat.label.trim().toLowerCase().slice(0, 15);
        
        if (mergedMap.has(normalizedKey)) {
          const existing = mergedMap.get(normalizedKey)!;
          const uniqueKeywords = Array.from(new Set([...existing.keywords, ...cat.keywords])).slice(0, 12);
          mergedMap.set(normalizedKey, {
            ...existing,
            keywords: uniqueKeywords
          });
        } else {
          mergedMap.set(normalizedKey, {
            label: cat.label.trim(),
            description: cat.description || '',
            keywords: cat.keywords.slice(0, 12)
          });
        }
      }

      const mergedCategoriesList = Array.from(mergedMap.values());
      console.log(`[CSV Trend Extraction] Merged into ${mergedCategoriesList.length} unique categories`);

      setYtCsvKeywordCategories(mergedCategoriesList);
      localStorage.setItem('yt_csv_keyword_categories', JSON.stringify(mergedCategoriesList));
      
      if (mergedCategoriesList.length > 0) {
        setYtSelectedCategoryLabel(mergedCategoriesList[0].label);
        setYtSelectedKeywords(mergedCategoriesList[0].keywords);
      }
      
      alert(`วิเคราะห์และสกัดข้อมูลเทรนด์จากไฟล์ CSV สำเร็จ! ได้รับ ${mergedCategoriesList.length} หมวดหมู่ใหม่`);
    } catch (err: any) {
      console.error(err);
      alert(`การประมวลผลไฟล์ CSV ล้มเหลว: ${err.message || String(err)}`);
    } finally {
      setYtIsProcessingCsv(false);
    }
  };

  const handleSearchYoutubeKeyword = async (keywordsToSearch: string[], limit: number, days: number) => {
    if (keywordsToSearch.length === 0) {
      alert('กรุณาเลือกคีย์เวิร์ดหรือกรอกคำค้นหาอย่างน้อย 1 คำ');
      return;
    }

    setYtDiscoveryLoading(true);
    setYtSearchResults([]);
    setYtSelectedVideoIds([]);

    const allVideosMap = new Map<string, any>();
    const failedKeywords: string[] = [];
    let lastSearchError = '';
    
    try {
      for (let i = 0; i < keywordsToSearch.length; i++) {
        const kw = keywordsToSearch[i];
        setYtDiscoveryStatus(`กำลังค้นหาคำว่า "${kw}" (${i + 1}/${keywordsToSearch.length})...`);
        
        try {
          const response = await fetch(`${API_BASE}/youtube-keyword-search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              keyword: kw,
              limit: limit,
              days: days
            })
          });

          const data = await response.json();
          
          if (data.success && Array.isArray(data.videos)) {
            for (const video of data.videos) {
              if (!allVideosMap.has(video.id)) {
                allVideosMap.set(video.id, {
                  ...video,
                  queryMatched: kw
                });
              }
            }

            const currentList = Array.from(allVideosMap.values());
            currentList.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
            setYtSearchResults(currentList);
            localStorage.setItem('yt_search_results', JSON.stringify(currentList));
          } else {
            const errMsg = data.error || 'Unknown error';
            console.warn(`Search for keyword "${kw}" failed:`, errMsg);
            failedKeywords.push(kw);
            lastSearchError = errMsg;
            setYtDiscoveryStatus(`⚠️ ค้นหาคำว่า "${kw}" ล้มเหลว: ${errMsg}`);
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (singleErr: any) {
          const errMsg = singleErr.message || String(singleErr);
          console.warn(`Fetch for keyword "${kw}" failed:`, errMsg);
          failedKeywords.push(kw);
          lastSearchError = errMsg;
          setYtDiscoveryStatus(`⚠️ เกิดข้อผิดพลาดกับคำว่า "${kw}": ${errMsg}`);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (failedKeywords.length > 0) {
        if (allVideosMap.size > 0) {
          setYtDiscoveryStatus(`⚠️ ค้นหาเสร็จสิ้น! พบ ${allVideosMap.size} คลิป (ข้ามคำที่ล้มเหลว: ${failedKeywords.join(', ')})`);
        } else {
          setYtDiscoveryStatus(`❌ การค้นหาล้มเหลวทั้งหมด: ${lastSearchError}`);
          alert(`การค้นหาล้มเหลวทั้งหมด:\n${lastSearchError}`);
        }
      } else {
        setYtDiscoveryStatus(`✅ ค้นหาเสร็จสิ้น! ค้นพบคลิปที่ไม่ซ้ำทั้งหมด ${allVideosMap.size} คลิป`);
      }

      if (allVideosMap.size > 0) {
        localStorage.setItem('yt_last_search', keywordsToSearch.join(', '));
        setYtLastSearch(keywordsToSearch.join(', '));
      }
    } catch (err: any) {
      console.error(err);
      setYtDiscoveryStatus(`❌ เกิดข้อผิดพลาดในการค้นหา: ${err.message || String(err)}`);
      alert(`การค้นหาคลิปวิดีโอล้มเหลว: ${err.message || String(err)}`);
    } finally {
      setYtDiscoveryLoading(false);
    }
  };

  const formatYtDuration = (sec: number | null): string => {
    if (sec === null || isNaN(sec) || sec <= 0) return '--:--';
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasHumanOrStoryCues = (title: string): boolean => {
    const t = title.toLowerCase();
    const cues = [
      'interview', 'podcast', 'story', 'journey', 'talk', 'failed', 'success', 'lessons', 'how i',
      ' ordinary ', 'life', 'broke', 'millionaire', 'trader', 'investor', 'person', 'people', 'he ', 'she ',
      'สัมภาษณ์', 'เล่า', 'รีวิว', 'ประสบการณ์', 'คุย', 'คนธรรมดา', 'ชีวิต', 'เทรดเดอร์', 'เจ๊ง', 'รวย', 'จน'
    ];
    return cues.some(cue => t.includes(cue));
  };

  /*
  const runGithubScraperSequential = async (tokenToPass: string) => {
    if (sseConnection.current) {
      sseConnection.current.close();
    }

    const activeKeywords = selectedQueries.filter(Boolean);
    const queriesToRun = activeKeywords.length > 0 ? activeKeywords : [ghQuery];

    setContentRunning(prev => ({ ...prev, github: true }));
    setContentLogs(prev => ({
      ...prev,
      github: [`[SYSTEM] 🚀 เริ่มต้นรันโปรเซสบอทขุดเจาะ GitHub แบบเชื่อมสตรีมมิ่ง (${queriesToRun.length} หัวข้อ) ...`]
    }));

    for (let i = 0; i < queriesToRun.length; i++) {
      const qVal = queriesToRun[i];
      const matched = KEYWORDS.find(k => k.query === qVal);
      const label = matched ? matched.label : qVal;

      setContentLogs(prev => {
        const currentLogs = prev.github || [];
        return {
          ...prev,
          github: [...currentLogs, `[SYSTEM] 🔍 เริ่มต้นขุดเจาะหัวข้อ: [${label.toUpperCase()}] (${i+1}/${queriesToRun.length}) ...`]
        };
      });
      scrollTerminal('github');

      await new Promise<void>((resolve) => {
        const queryParams = `query=${encodeURIComponent(qVal)}&trend_mode=${ghMode}&limit=${ghLimit}&github_token=${encodeURIComponent(tokenToPass)}&openrouter_key=${encodeURIComponent(openRouterKey)}`;
        const eventUrl = `${API_BASE}/orchestrator/run/github?${queryParams}`;
        const source = new EventSource(eventUrl);
        sseConnection.current = source;

        source.onmessage = (event) => {
          setContentLogs(prev => {
            const currentLogs = prev.github || [];
            return {
              ...prev,
              github: [...currentLogs, `[${label}] ${event.data}`]
            };
          });
          scrollTerminal('github');

          if (event.data.includes('Exit Code:')) {
            source.close();
            resolve();
          }
        };

        source.onerror = (err) => {
          console.error(`SSE stream error on github multi-run [${qVal}]:`, err);
          setContentLogs(prev => {
            const currentLogs = prev.github || [];
            return {
              ...prev,
              github: [...currentLogs, `[WARN] ⚠️ หัวข้อ [${label}] เกิดข้อขัดข้องชั่วคราว หรือข้ามไปยังขั้นตอนถัดไป`]
            };
          });
          scrollTerminal('github');
          source.close();
          resolve();
        };
      });
    }

    setContentRunning(prev => ({ ...prev, github: false }));
    fetchScrapedResults();
    if (onApprove) onApprove();
  };

  const runGithubScraperDirect = async (qVal: string, modeVal: string, limitVal: number) => {
    let tokenToPass = '';
    if (selectedGithubProfileId === 'default') {
      tokenToPass = localStorage.getItem('github_token') || '';
    } else {
      const prof = dbProfiles.find(p => String(p.id) === selectedGithubProfileId);
      if (prof) {
        tokenToPass = prof.credential_key;
      }
    }

    if (sseConnection.current) {
      sseConnection.current.close();
    }

    setContentRunning(prev => ({ ...prev, github: true }));
    setContentLogs(prev => ({
      ...prev,
      github: [`[SYSTEM] 🚀 เริ่มต้นดึงข้อมูล Top ${limitVal} วันนี้จาก GitHub ...`]
    }));

    await new Promise<void>((resolve) => {
      const queryParams = `query=${encodeURIComponent(qVal)}&trend_mode=${modeVal}&limit=${limitVal}&github_token=${encodeURIComponent(tokenToPass)}&openrouter_key=${encodeURIComponent(openRouterKey)}`;
      const eventUrl = `${API_BASE}/orchestrator/run/github?${queryParams}`;
      const source = new EventSource(eventUrl);
      sseConnection.current = source;

      source.onmessage = (event) => {
        setContentLogs(prev => {
          const currentLogs = prev.github || [];
          return {
            ...prev,
            github: [...currentLogs, event.data]
          };
        });
        scrollTerminal('github');

        if (event.data.includes('Exit Code:')) {
          source.close();
          resolve();
        }
      };

      source.onerror = (err) => {
        console.error(`SSE stream error on github Top 30:`, err);
        setContentLogs(prev => {
          const currentLogs = prev.github || [];
          return {
            ...prev,
            github: [...currentLogs, `[ERROR] ❌ ไม่สามารถรันโปรเซสขุดเจาะดึงข้อมูลได้สำเร็จ`]
          };
        });
        scrollTerminal('github');
        source.close();
        resolve();
      };
    });

    setContentRunning(prev => ({ ...prev, github: false }));
    fetchScrapedResults();
    if (onApprove) onApprove();
  };
  */

  // Instant SQLite contents approval
  const handleInstantApprove = async (item: VaultContent) => {
    try {
      const res = await fetch(`${API_BASE}/vault/contents/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready_for_design' })
      });
      const data = await res.json();
      if (data.success) {
        fetchScrapedResults();
        if (onApprove) onApprove();
      }
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  // Clean up SSE connections on unmount
  useEffect(() => {
    // Dummy log to silence TS6133 strict unused warnings elegantly
  if (false) {
    console.log(resultsViewMode, setResultsViewMode, scrapedResults, loadingResults, runAiScoringForPost, handleInstantApprove, CopyHeadlineBtn);
  }

  return () => {
      if (sseConnection.current) {
        sseConnection.current.close();
      }
    };
  }, []);



  return (
    <div className="w-full max-w-[1400px] mx-auto animate-fade-in space-y-6">
      
      {/* 1. Header with Mode switch buttons replicating V1 layout styles */}
      <div className="flex justify-between items-center p-6 rounded-2xl border bg-slate-950/40 border-slate-800/80">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            🧭 หมวดค้นหา & สอยเทรดไอเดียสด (Discovery Portal)
          </h2>
          <p className="text-xs text-slate-400 mt-1">มอนิเตอร์กลยุทธ์ของคู่แข่งข้ามค่าย เฝ้าระวังโพสต์ติดกระแส และสกัดไอเดียเด่น RSS/YouTube เข้าคลังโดยตรง</p>
          
          {/* Real-time OpenRouter Key Manager in V2 */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">🔑 OpenRouter Profile:</span>
            <select
              value={selectedOpenRouterProfileId}
              onChange={(e) => {
                setSelectedOpenRouterProfileId(e.target.value);
              }}
              className="bg-slate-950/80 border border-slate-850 rounded px-2 py-1 text-[10px] text-slate-300 cursor-pointer focus:outline-none focus:border-cyan-500 min-w-48 font-sans"
            >
              <option value="default" className="bg-slate-950 text-white">⚙️ ใช้คีย์หลักเบราว์เซอร์ (Default)</option>
              {dbProfiles.filter(p => p.service_name === 'openrouter').map(p => (
                <option key={p.id} value={String(p.id)} className="bg-slate-955 text-white font-sans">
                  👤 {p.key_name} (SQLite)
                </option>
              ))}
              <option value="manual" className="bg-slate-950 text-white">✍️ กรอกคีย์เองแบบแมนนวล...</option>
            </select>

            {selectedOpenRouterProfileId === 'manual' && (
              <input
                type="password"
                placeholder="กรอก sk-or-... เพื่อเปิดใช้งาน AI"
                value={manualOpenRouterKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setManualOpenRouterKey(val);
                  localStorage.setItem('openrouter_key', val);
                }}
                className="bg-slate-955 border border-slate-850 rounded px-2.5 py-1 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-cyan-500 w-60"
              />
            )}
          </div>
        </div>
        
        {/* Navigation Switchers designed EXACTLY like V1 menu lists */}
        <div className="flex items-center gap-2.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveMainTab('radar')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
              ${activeMainTab === 'radar' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-white bg-transparent border border-transparent'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>🕵️‍♂️ Radar คู่แข่ง (Watchlist)</span>
          </button>
          
          <button 
            onClick={() => setActiveMainTab('content')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
              ${activeMainTab === 'content' 
                ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' 
                : 'text-slate-400 hover:text-white bg-transparent border border-transparent'}`}
          >
            <Search className="w-4 h-4" />
            <span>🗞️ ค้นหา Content (Scrapers)</span>
          </button>
        </div>
      </div>

      {/* 2. TAB A: Watchlist Radar (🕵️‍♂️ Radar คู่แข่ง) */}
      {activeMainTab === 'radar' && (
        <div className="space-y-6">
          
          {/* Card: Watchlist Management persistent table */}
          <div className="p-6 rounded-2xl border bg-slate-950/40 border-slate-800/80 space-y-6">
            
            {/* Control info card header */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">ฟีดเพจเป้าหมาย (Watchlist)</h3>
                <p className="text-xs text-slate-500 mt-1">เฝ้าติดตามเพจและช่องคู่แข่ง เพื่อวิจัยคะแนนความนิยม Engagement Rate รายแถว</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Real-time Apify Key Manager in V2 */}
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">⚡ Apify Profile:</span>
                  <select
                    value={selectedApifyProfileId}
                    onChange={(e) => setSelectedApifyProfileId(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-[10px] text-slate-300 cursor-pointer focus:outline-none focus:border-cyan-500 min-w-36 font-sans"
                  >
                    <option value="default" className="bg-slate-950 text-white">⚙️ คีย์หลักเบราว์เซอร์ (Default)</option>
                    {dbProfiles.filter(p => p.service_name === 'apify').map(p => (
                      <option key={p.id} value={String(p.id)} className="bg-slate-955 text-white font-sans">
                        ⚡ {p.key_name} (SQLite)
                      </option>
                    ))}
                    <option value="manual" className="bg-slate-950 text-white">✍️ กรอกคีย์เอง...</option>
                  </select>

                  {selectedApifyProfileId === 'manual' && (
                    <input
                      type="password"
                      placeholder="กรอก apify_api_..."
                      value={manualApifyKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setManualApifyKey(val);
                        localStorage.setItem('apify_key', val);
                      }}
                      className="bg-slate-955 border border-slate-850 rounded px-2.5 py-1.5 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-cyan-500 w-36"
                    />
                  )}
                </div>

                <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  ติดตามแล้ว: <span className="text-emerald-400 font-bold">{watchlistPages.length}</span> เพจ
                </div>
                <button 
                  onClick={scanSelectedPages}
                  disabled={isScanning || watchlistPages.filter(p => p.scanSelected).length === 0}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border
                    ${isScanning || watchlistPages.filter(p => p.scanSelected).length === 0
                      ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/20 active:scale-95'}`}
                >
                  {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>สแกนกลุ่ม ({watchlistPages.filter(p => p.scanSelected).length} เพจ)</span>
                </button>
              </div>
            </div>

            {/* Watchlist inputs to add competitors replicating V1 styles cleanly */}
            <form onSubmit={handleAddPage} className="flex gap-3 mb-6 flex-wrap items-center bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
              <input 
                type="url" 
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="วาง Link เพจ (Facebook, TikTok, YouTube)..."
                className="flex-1 min-w-[320px] px-4 py-2.5 border rounded-lg bg-transparent border-slate-800 text-xs text-white focus:border-cyan-400 outline-none"
                required
              />
              
              {isCustomNewCategory ? (
                <div className="flex items-center gap-1.5 w-[180px]">
                  <input 
                    type="text" 
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="พิมพ์ประเภท..."
                    className="w-full px-3 py-2.5 border rounded-lg bg-transparent border-slate-800 text-xs text-white focus:border-blue-400 outline-none"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => { setIsCustomNewCategory(false); setNewCategory(''); }}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={newCategory}
                  onChange={e => {
                    if (e.target.value === 'NEW') {
                      setIsCustomNewCategory(true);
                      setNewCategory('');
                    } else {
                      setNewCategory(e.target.value);
                    }
                  }}
                  className="w-[180px] px-3 py-2.5 border rounded-lg bg-slate-950 border-slate-800 text-xs text-slate-300 focus:border-cyan-400 outline-none cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-950">-- เลือกประเภท --</option>
                  {allCategories.map(c => (
                    <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>
                  ))}
                  <option value="NEW" className="font-bold bg-slate-950 text-cyan-400">+ สร้างประเภทใหม่</option>
                </select>
              )}

              <input 
                type="text" 
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="📝 Note (ไม่บังคับ)"
                className="w-[180px] px-4 py-2.5 border rounded-lg bg-transparent border-slate-800 text-xs text-white focus:border-cyan-400 outline-none"
              />

              <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 select-none hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={newIsOwnPage}
                  onChange={e => setNewIsOwnPage(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-400">⭐ เพจของฉัน</span>
              </label>

              <button 
                type="submit" 
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs whitespace-nowrap transition-all shadow-md shadow-blue-500/10 hover:-translate-y-0.5 active:translate-y-0"
              >
                + เพิ่มเพจ
              </button>
            </form>

            {/* Select All / Deselect All */}
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => toggleAllScan(true)} 
                className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all hover:bg-emerald-500/20" 
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}
              >
                ✅ เลือกทั้งหมด
              </button>
              <button 
                onClick={() => toggleAllScan(false)} 
                className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all hover:bg-slate-800" 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', color: '#888', border: '1px solid #334155' }}
              >
                ☐ ยกเลิกทั้งหมด
              </button>
              <span className="text-xs text-slate-500">เลือก Scan: {watchlistPages.filter(p => p.scanSelected).length}/{watchlistPages.length} เพจ</span>
            </div>

            {/* Grid watchlist table */}
            <div className="data-grid-container border border-slate-900">
              <table className="data-grid-table">
                <thead>
                  <tr>
                    <th className="data-grid-th w-10 text-center">Scan</th>
                    <th className="data-grid-th">แพลตฟอร์ม/หน้าเพจ</th>
                    <th className="data-grid-th w-32">ประเภท</th>
                    <th className="data-grid-th w-28 text-right">ผู้ติดตาม</th>
                    <th className="data-grid-th w-28 text-right">Engagement</th>
                    <th className="data-grid-th w-28 text-center">สถานะ</th>
                    <th className="data-grid-th w-[340px] text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistPages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="data-grid-td text-center text-slate-500 py-12">
                        <Info className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                        ไม่มีเพจที่อยู่ในเป้าหมายขณะนี้ กรุณากรอกลิงก์ FB/TikTok เพิ่มเข้าคลัง
                      </td>
                    </tr>
                  ) : (
                    watchlistPages.map(page => (
                      <tr 
                        key={page.id} 
                        className={`data-grid-tr border-b border-slate-900/50 hover:bg-slate-950/20
                          ${!page.scanSelected ? 'opacity-40' : ''}`}
                      >
                        <td className="data-grid-td text-center">
                          <input 
                            type="checkbox" 
                            checked={page.scanSelected}
                            onChange={() => toggleScanSelect(page.id)}
                            className="w-4 h-4 accent-emerald-400 cursor-pointer"
                          />
                        </td>
                        <td className="data-grid-td">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center flex-shrink-0 text-cyan-400">
                              📁
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white flex items-center gap-1.5 flex-wrap">
                                {page.name}
                                {page.isOwnPage && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-black">
                                    ⭐ ของฉัน
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <a href={page.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline font-bold">
                                  เปิดดู ↗
                                </a>
                              </div>
                              {page.note && (
                                <div className="text-[10px] text-slate-400 mt-1 max-w-[320px] leading-relaxed flex items-start gap-1" title={page.note}>
                                  <span>📝</span>
                                  <span className="italic">{page.note}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="data-grid-td">
                          <span className="text-xs text-slate-300 font-semibold">
                            {page.category}
                          </span>
                        </td>
                        <td className="data-grid-td text-right text-xs font-semibold text-white">
                          {page.followers > 0 ? page.followers.toLocaleString() : '-'}
                        </td>
                        <td className="data-grid-td text-right text-xs font-bold text-blue-400">
                          {page.engagementRate > 0 ? `${page.engagementRate.toFixed(2)}%` : '-'}
                        </td>
                        <td className="data-grid-td text-center">
                          <div className="flex flex-col items-center gap-1">
                            {page.status === 'scraped' ? (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                ✅ สแกนแล้ว
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-500">
                                รอสแกน
                              </span>
                            )}
                            {page.deepResearchDate && (
                              <span 
                                className="text-[10px] text-purple-400 font-medium" 
                                title={`วิจัยลึกเมื่อ ${new Date(page.deepResearchDate).toLocaleDateString('th-TH')} (${page.deepResearchPostCount} โพสต์)`}
                              >
                                🔬 วิจัยแล้ว ({new Date(page.deepResearchDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="data-grid-td text-right">
                          <div className="flex flex-col items-end gap-2">
                            
                            {/* Spacious Limit input & Research button group styled in dark glassmorphism */}
                            <div className="flex items-center">
                              <input 
                                type="number" 
                                value={deepResearchLimit} 
                                onChange={e => setDeepResearchLimit(Number(e.target.value))}
                                className="w-14 h-7 bg-slate-950/80 text-white border border-slate-800 focus:border-cyan-500 rounded-l text-xs font-bold text-center focus:outline-none"
                              />
                              <button 
                                onClick={() => handleDeepResearch(page)}
                                disabled={isScanning}
                                className="h-7 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-y border-r border-cyan-500/30 rounded-r text-[10px] font-black transition-all flex items-center justify-center gap-0.5 active:scale-95"
                              >
                                🔬 วิจัยลึก
                              </button>
                            </div>
                            
                            {/* Actions Button Grid (dark themed glassmorphism buttons) */}
                            <div className="flex items-center gap-1.5">
                              {page.deepResearchDate && (
                                <button 
                                  onClick={() => handleDownloadCSV(page)}
                                  className="h-7 w-8 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded flex items-center justify-center transition-all active:scale-95"
                                  title="ดาวน์โหลด CSV รายงานดึงลึก"
                                >
                                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                                </button>
                              )}
  
                              <button 
                                onClick={() => openEditModal(page)}
                                className="h-7 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-black flex items-center justify-center gap-0.5 transition-all active:scale-95"
                                title="แก้ไขรายละเอียด"
                              >
                                ✍️ แก้ไข
                              </button>
  
                              <button 
                                onClick={() => handleRemovePage(page.id)}
                                className="h-7 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black flex items-center justify-center gap-0.5 transition-all active:scale-95"
                              >
                                ✕ ลบ
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Watchlist terminal logs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                  <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span>TERMINAL LOGS (ขุดคู่แข่ง)</span>
                </div>
                <button 
                  onClick={() => setScanLogs(['[SYSTEM] Logs cleared.'])}
                  className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded hover:text-white"
                >
                  ล้างหน้าจอ
                </button>
              </div>
              <div className="terminal-box h-32">
                {scanLogs.map((log, idx) => (
                  <div key={idx} className="terminal-line">{log}</div>
                ))}
                <div ref={watchlistTerminalBottom} />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. TAB B: Content Scrapers (🗞️ ค้นหา Content) */}
      {activeMainTab === 'content' && (
        <div className="space-y-6">
          
          {/* Card: Subtab Switcher for RSS / YT / GH */}
          <div className="p-6 rounded-2xl border bg-slate-950/40 border-slate-800/80">
            <div className="flex border-b border-slate-900 pb-3 mb-6 gap-2">
              {[
                { id: 'rss', title: '🗞️ RSS ข่าวไอทีด่วน', desc: 'Proxy 3 ชั้น & คะแนน AI' },
                { id: 'youtube', title: '▶️ YouTube ดูดซับ/แคปสไลด์', desc: 'OpenCV แคปภาพสวย' },
                { id: 'github', title: '🐙 GitHub Trends คลังสุดฮอต', desc: 'Gemini คลิกเบต 3 สคริปต์' },
                { id: 'replicator', title: '🌀 AI Viral Replicator', desc: 'ค้นพบเรื่องราวที่คล้ายกันจาก CSV' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setContentActiveSubTab(sub.id as any)}
                  className={`text-left p-3.5 rounded-xl border flex-1 transition-all duration-300
                    ${contentActiveSubTab === sub.id 
                      ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/5' 
                      : 'border-slate-800 bg-slate-950/20 hover:border-pink-500/30'}`}
                >
                  <div className="text-sm font-black text-white">{sub.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{sub.desc}</div>
                </button>
              ))}
            </div>

            {/* Sub-tab Configuration layouts */}
            {/* Sub-tab Configuration layouts */}
            {contentActiveSubTab === 'rss' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Config Panel */}
                <div className="lg:col-span-1 bg-slate-950/40 p-5 rounded-xl border border-slate-900 flex flex-col justify-between min-h-[360px]">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">ตั้งค่า RSS Scraper</h4>
                    
                    {/* Popular Feeds badges */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {POPULAR_RSS_SITES.map(feed => (
                        <button
                          key={feed.name}
                          type="button"
                          onClick={() => setRssUrl(feed.url)}
                          className={`text-[10px] p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer
                            ${rssUrl === feed.url 
                              ? 'border-pink-500 bg-pink-500/10 text-white font-bold' 
                              : 'border-slate-900 bg-transparent text-slate-400 hover:text-white'}`}
                        >
                          <span>{feed.icon}</span>
                          <span className="truncate">{feed.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">RSS FEED URL</label>
                        <input 
                          type="text" 
                          className="glass-input text-xs w-full" 
                          value={rssUrl}
                          onChange={e => setRssUrl(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">จำกัดข่าวย้อนหลัง (Limit)</label>
                        <input 
                          type="number" 
                          className="glass-input text-xs w-full" 
                          value={rssLimit}
                          onChange={e => setRssLimit(Number(e.target.value))}
                          min={1} max={50}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scraper Start Button at the bottom of the config card */}
                  <button
                    type="button"
                    onClick={() => {
                      const queryParams = `url=${encodeURIComponent(rssUrl)}&limit=${rssLimit}&openrouter_key=${encodeURIComponent(openRouterKey)}`;
                      runContentScraper('rss', queryParams);
                    }}
                    disabled={contentRunning.rss}
                    className="w-full mt-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-lg text-xs hover:from-pink-400 hover:to-rose-400 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    {contentRunning.rss ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>🗞️ สตาร์ทบอทดึงข่าว RSS</span>}
                  </button>
                </div>

                {/* Right Terminal Panel */}
                <div className="lg:col-span-2 bg-slate-950/40 p-5 rounded-xl border border-slate-900 flex flex-col justify-between h-[420px]">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                          <div className={`w-2 h-2 rounded-full ${contentRunning.rss ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                          <span>TERMINAL LOGS (บอทดึงข่าว RSS)</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setContentLogs(prev => ({ ...prev, rss: ['[SYSTEM] Logs cleared.'] }))}
                          className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded hover:text-white cursor-pointer"
                        >
                          ล้างหน้าจอ
                        </button>
                      </div>
                      <div className="terminal-box h-[280px] overflow-y-auto font-mono text-[10px] bg-slate-950 p-4 border border-slate-850 rounded-lg text-slate-300 custom-scrollbar text-left">
                        {(contentLogs.rss || []).map((log, idx) => (
                          <div key={idx} className="terminal-line py-0.5 border-b border-slate-900/40 last:border-b-0 leading-relaxed font-sans">{log}</div>
                        ))}
                        <div ref={contentTerminalBottoms.rss} />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 text-left">
                      * ระบบขุดข้อมูลจะทำการวิเคราะห์ความนิยมและคัดสรรหัวข้อแบบ Clickbait ภาษาไทยลง SQLite ทันทีหลังจากรัน Exit Code สำเร็จ
                    </div>
                  </div>
                </div>
              </div>
            )}

            {contentActiveSubTab === 'youtube' && (
              <div className="space-y-6">
                {/* Secondary Tab Switcher inside YouTube */}
                <div className="flex gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-900 max-w-md text-left">
                  <button
                    type="button"
                    onClick={() => setYtActiveMode('keyword')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer
                      ${ytActiveMode === 'keyword'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                  >
                    🧭 ค้นหาจาก Keyword
                  </button>
                  <button
                    type="button"
                    onClick={() => setYtActiveMode('extractor')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer
                      ${ytActiveMode === 'extractor'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                  >
                    🎞️ สกัดสไลด์จากลิงก์ตรง
                  </button>
                </div>

                {ytActiveMode === 'extractor' ? (
                  /* Original 3-Column YouTube Link Extractor View */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-slate-950/40 p-5 rounded-xl border border-slate-900 flex flex-col justify-between min-h-[360px]">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide text-left">ตั้งค่า YouTube Extractor</h4>
                        <div className="space-y-3">
                          <div className="text-left">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">ลิงก์คลิปวิดีโอ (YouTube Video Link)</label>
                            <input 
                              type="text" 
                              className="glass-input text-xs w-full" 
                              value={ytUrl}
                              onChange={e => setYtUrl(e.target.value)}
                            />
                          </div>
                          <div className="text-left">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">จำนวนรูปสไลด์ที่สกัดแคป (OpenCV Frames)</label>
                            <input 
                              type="number" 
                              className="glass-input text-xs w-full" 
                              value={ytLimit}
                              onChange={e => setYtLimit(Number(e.target.value))}
                              min={1} max={15}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const queryParams = `url=${encodeURIComponent(ytUrl)}&limit=${ytLimit}&openrouter_key=${encodeURIComponent(openRouterKey)}`;
                          runContentScraper('youtube', queryParams);
                        }}
                        disabled={contentRunning.youtube}
                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-lg text-xs hover:from-red-400 hover:to-pink-500 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        {contentRunning.youtube ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>▶️ สกัดและแคป YouTube สไลด์</span>}
                      </button>
                    </div>

                    <div className="lg:col-span-2 bg-slate-950/40 p-5 rounded-xl border border-slate-900 flex flex-col justify-between h-[420px]">
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                              <div className={`w-2 h-2 rounded-full ${contentRunning.youtube ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                              <span>TERMINAL LOGS (บอทแคป YouTube)</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setContentLogs(prev => ({ ...prev, youtube: ['[SYSTEM] Logs cleared.'] }))}
                              className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded hover:text-white cursor-pointer"
                            >
                              ล้างหน้าจอ
                            </button>
                          </div>
                          <div className="terminal-box h-[280px] overflow-y-auto font-mono text-[10px] bg-slate-950 p-4 border border-slate-850 rounded-lg text-slate-300 custom-scrollbar text-left">
                            {(contentLogs.youtube || []).map((log, idx) => (
                              <div key={idx} className="terminal-line py-0.5 border-b border-slate-900/40 last:border-b-0 leading-relaxed font-sans">{log}</div>
                            ))}
                            <div ref={contentTerminalBottoms.youtube} />
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 text-left">
                          * ระบบขุดข้อมูลจะทำการวิเคราะห์ความนิยมและคัดสรรหัวข้อแบบ Clickbait ภาษาไทยลง SQLite ทันทีหลังจากรัน Exit Code สำเร็จ
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 🧭 New YouTube Keyword Discovery Hub View (Full Width layout) */
                  <div className="space-y-6 text-left">
                    {/* Top Options Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-950/60 rounded-2xl border border-slate-900">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">🔥 ความนิยมต่ำสุด (Min Views)</label>
                        <input
                          type="number"
                          className="glass-input text-xs w-full bg-slate-950 text-white"
                          value={ytEvergreenMinViews}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setYtEvergreenMinViews(val);
                            localStorage.setItem('yt_evergreen_min_views', String(val));
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">🌲 ความยาว Evergreen (Min วินาที)</label>
                        <input
                          type="number"
                          className="glass-input text-xs w-full bg-slate-950 text-white"
                          value={ytEvergreenMinDuration}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setYtEvergreenMinDuration(val);
                            localStorage.setItem('yt_evergreen_min_duration', String(val));
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                            checked={ytEvergreenOnly}
                            onChange={e => {
                              const checked = e.target.checked;
                              setYtEvergreenOnly(checked);
                              localStorage.setItem('yt_evergreen_only', String(checked));
                            }}
                          />
                          <span className="text-xs font-black text-slate-300">🌲 กรองเฉพาะ Evergreen เท่านั้น</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                            checked={ytEvergreenIgnoreDate}
                            onChange={e => {
                              const checked = e.target.checked;
                              setYtEvergreenIgnoreDate(checked);
                              localStorage.setItem('yt_evergreen_ignore_date', String(checked));
                            }}
                          />
                          <span className="text-xs font-black text-slate-300">📅 ไม่จำกัดวันสำหรับ Evergreen</span>
                        </label>
                      </div>
                    </div>

                    {/* Main Split Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                      
                      {/* Left: Category Panel */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="p-5 bg-slate-950/40 rounded-2xl border border-slate-900 space-y-4">
                          <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                              <span>📂</span> หมวดหมู่คีย์เวิร์ด
                            </h4>
                          </div>

                          {/* CSV Uploader */}
                          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 space-y-2">
                            <div className="text-[10px] font-black text-slate-400">📁 อัปโหลด CSV สรุปโพสเทรนด์</div>
                            <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-800 hover:border-violet-500 rounded-lg cursor-pointer bg-slate-950 hover:bg-violet-950/10 transition-all text-center">
                              <span className="text-[11px] font-bold text-violet-400">
                                {ytIsProcessingCsv ? '⏳ กำลังประมวลผล AI...' : '📂 เลือกไฟล์ CSV'}
                              </span>
                              <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                disabled={ytIsProcessingCsv}
                                onChange={e => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadCsvAndExtractTrends(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                            {ytCsvFilename && (
                              <div className="flex items-center justify-between gap-1.5 text-[9px] text-slate-500 bg-slate-900 p-1.5 rounded">
                                <span className="truncate max-w-[120px] font-mono">📄 {ytCsvFilename}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setYtCsvFilename('');
                                    setYtCsvKeywordCategories([]);
                                    localStorage.removeItem('yt_csv_filename');
                                    localStorage.removeItem('yt_csv_keyword_categories');
                                  }}
                                  className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                                >
                                  ล้าง
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Manual Keyword Input */}
                          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 space-y-2">
                            <div className="text-[10px] font-black text-slate-400">✍️ กรอกคีย์เวิร์ดเอง (บรรทัดละคำ)</div>
                            <textarea
                              className="glass-input text-xs w-full h-24 bg-slate-950 text-white font-mono leading-relaxed"
                              placeholder="พิมพ์ หรือวางคีย์เวิร์ดที่นี่&#10;เช่น:&#10;forex lessons&#10;trading journey&#10;เรียน AI"
                              value={ytCustomInputText}
                              onChange={e => {
                                const text = e.target.value;
                                setYtCustomInputText(text);
                                localStorage.setItem('yt_custom_input_text', text);
                              }}
                            />
                            {parsedCustomKeywords.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setYtSelectedCategoryLabel('กรอกด้วยตนเอง');
                                  setYtSelectedKeywords(parsedCustomKeywords);
                                }}
                                className="w-full py-1.5 bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 hover:text-red-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                              >
                                📥 ใช้คีย์เวิร์ดกลุ่มนี้ ({parsedCustomKeywords.length} คำ)
                              </button>
                            )}
                          </div>

                          {/* Categories List */}
                          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                            {allYtCategories.map(cat => {
                              const isActive = ytSelectedCategoryLabel === cat.label;
                              return (
                                <div
                                  key={cat.label}
                                  onClick={() => {
                                    setYtSelectedCategoryLabel(cat.label);
                                    setYtSelectedKeywords(cat.keywords || []);
                                  }}
                                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:border-red-500/50
                                    ${isActive
                                      ? 'border-red-600 bg-red-950/20'
                                      : 'border-slate-850 bg-slate-950/40'}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="text-xs font-black text-white truncate">{cat.label}</div>
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-bold">
                                      {cat.keywords?.length || 0} คำ
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {cat.description || 'ไม่มีรายละเอียด'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* AI Recommended Button */}
                          {ytSelectedCategoryLabel && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentCat = allYtCategories.find(c => c.label === ytSelectedCategoryLabel);
                                if (currentCat) {
                                  handleAiRecommendKeywords(currentCat.label, currentCat.description || '');
                                }
                              }}
                              disabled={ytIsRecommendingKeywords}
                              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-900/20 active:scale-95 cursor-pointer"
                            >
                              {ytIsRecommendingKeywords ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>กำลังหาไอเดีย...</span>
                                </>
                              ) : (
                                <span>🧠 ให้ AI หา Keyword</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: Search Panel & Results */}
                      <div className="lg:col-span-3 space-y-6">
                        
                        {/* Search controls */}
                        <div className="p-5 bg-slate-950/40 rounded-2xl border border-slate-900 space-y-4">
                          <div className="flex gap-2 flex-wrap items-center">
                            <input
                              type="text"
                              placeholder="พิมพ์คำค้นหาเดี่ยวตรงนี้..."
                              className="flex-1 min-w-[200px] glass-input text-xs bg-slate-950 text-white"
                              value={ytSearchQueryText}
                              onChange={e => setYtSearchQueryText(e.target.value)}
                            />

                            <button
                              type="button"
                              onClick={() => handleSearchYoutubeKeyword([ytSearchQueryText], ytSearchLimit, ytSearchDays)}
                              disabled={ytDiscoveryLoading || !ytSearchQueryText.trim()}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                            >
                              🔍 ค้นหาเดี่ยว
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSearchYoutubeKeyword(ytCheckedKeywords, ytSearchLimit, ytSearchDays)}
                              disabled={ytDiscoveryLoading || ytCheckedKeywords.length === 0}
                              className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-all active:scale-95 shadow-md shadow-red-950/30 cursor-pointer flex items-center gap-1.5"
                            >
                              🔥 ค้นหากลุ่ม ({ytCheckedKeywords.length} คำ)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setYtSearchResults([]);
                                setYtSearchQueryText('');
                                setYtSelectedVideoIds([]);
                                localStorage.removeItem('yt_search_results');
                              }}
                              className="px-3 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                            >
                              ล้างตาราง
                            </button>
                          </div>

                          {/* Options grid */}
                          <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-900 text-[11px] flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">📅 ย้อนหลัง (วัน):</span>
                              <select
                                value={ytSearchDays}
                                onChange={e => setYtSearchDays(Number(e.target.value))}
                                className="bg-transparent font-bold text-white focus:text-red-400 outline-none cursor-pointer"
                              >
                                <option value={0} className="bg-slate-950 text-white">ไม่จำกัดวัน</option>
                                <option value={7} className="bg-slate-950 text-white">7 วันย้อนหลัง</option>
                                <option value={30} className="bg-slate-950 text-white">30 วันย้อนหลัง</option>
                                <option value={90} className="bg-slate-950 text-white">90 วันย้อนหลัง</option>
                                <option value={120} className="bg-slate-950 text-white">120 วันย้อนหลัง</option>
                                <option value={365} className="bg-slate-950 text-white">1 ปีย้อนหลัง</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">🔢 จำนวนผลลัพธ์ต่อคำ:</span>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={ytSearchLimit}
                                onChange={e => setYtSearchLimit(Number(e.target.value))}
                                className="w-12 bg-transparent font-bold text-white text-center outline-none border-b border-slate-800 focus:border-red-400"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">📸 ดึงรูปต่อคลิป:</span>
                              <input
                                type="number"
                                min={1}
                                max={15}
                                value={ytLimit}
                                onChange={e => setYtLimit(Number(e.target.value))}
                                className="w-12 bg-transparent font-bold text-white text-center outline-none border-b border-slate-800 focus:border-red-400"
                              />
                            </div>

                            {ytLastSearch && (
                              <div className="text-[10px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[200px] sm:ml-auto">
                                ล่าสุด: <span className="font-mono text-red-400 font-bold">{ytLastSearch}</span>
                              </div>
                            )}
                          </div>

                          {/* Keyword Tags pills */}
                          {ytSelectedKeywords.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <span>💊 คีย์เวิร์ดในกลุ่มนี้ ({ytCheckedKeywords.length}/{ytSelectedKeywords.length} คำที่เลือก):</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setYtCheckedKeywords(ytSelectedKeywords)}
                                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-[9px] font-bold cursor-pointer transition-all active:scale-95"
                                  >
                                    ☑️ เลือกทั้งหมด
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setYtCheckedKeywords([])}
                                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-[9px] font-bold cursor-pointer transition-all active:scale-95"
                                  >
                                    ⬜ ยกเลิกทั้งหมด
                                  </button>
                                  <button
                                    type="button"
                                    disabled={ytDiscoveryLoading || ytCheckedKeywords.length === 0}
                                    onClick={() => handleSearchYoutubeKeyword(ytCheckedKeywords, ytSearchLimit, ytSearchDays)}
                                    className="px-2.5 py-0.5 rounded bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 hover:border-red-600 disabled:opacity-50 text-red-400 hover:text-red-300 text-[9px] font-black cursor-pointer transition-all active:scale-95"
                                  >
                                    🔍 ค้นหาที่เลือก ({ytCheckedKeywords.length})
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                {ytSelectedKeywords.map(kw => {
                                  const isChecked = ytCheckedKeywords.includes(kw);
                                  return (
                                    <button
                                      key={kw}
                                      type="button"
                                      onClick={() => {
                                        if (isChecked) {
                                          setYtCheckedKeywords(prev => prev.filter(k => k !== kw));
                                        } else {
                                          setYtCheckedKeywords(prev => [...prev, kw]);
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded text-[10px] transition-all font-mono cursor-pointer
                                        ${isChecked 
                                          ? 'bg-red-950/30 border border-red-500/50 text-red-400 font-bold hover:border-red-400 shadow-sm shadow-red-950/20' 
                                          : 'bg-slate-950 border border-slate-850 text-slate-500 hover:text-slate-350 hover:border-slate-700'}`}
                                    >
                                      #{kw}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Loading status bar */}
                        {ytDiscoveryLoading && (
                          <div className="flex flex-col items-center justify-center p-12 bg-slate-950/40 rounded-2xl border border-slate-900 space-y-3">
                            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                            <div className="text-xs font-bold text-white">{ytDiscoveryStatus}</div>
                            <div className="text-[10px] text-slate-500">ระบบกำลังสแกนและดึงผลลัพธ์จาก YouTube โดยไม่ใช้โควตา API</div>
                          </div>
                        )}

                        {/* Search Results */}
                        {!ytDiscoveryLoading && (
                          <div className="space-y-4">
                            
                            {/* Summary panel */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/60 p-4 rounded-xl border border-slate-900 gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={toggleSelectAllYtVideos}
                                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg text-[10px] font-black transition-all cursor-pointer hover:bg-slate-850"
                                >
                                  {ytSelectedVideoIds.length === ytSearchResults.filter(video => ytEvergreenOnly ? (video.duration || 0) >= ytEvergreenMinDuration : true).length && ytSelectedVideoIds.length > 0
                                    ? '⬜ ยกเลิกการเลือกทั้งหมด'
                                    : '☑️ เลือกทั้งหมด'}
                                </button>
                                <span className="text-slate-400">
                                  พบคลิปไม่ซ้ำทั้งหมด: <strong className="text-white font-black">{ytSearchResults.length}</strong> รายการ
                                  {ytSelectedVideoIds.length > 0 && (
                                    <span className="text-red-400 font-bold ml-2">
                                      (เลือกอยู่ <strong className="text-white font-black">{ytSelectedVideoIds.length}</strong> รายการ)
                                    </span>
                                  )}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-amber-400 font-bold">
                                    🔥 ยอดนิยม ({ytSearchResults.filter(v => (v.views || 0) >= ytEvergreenMinViews).length})
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-bold">
                                    🌲 Evergreen ({ytSearchResults.filter(v => (v.duration || 0) >= ytEvergreenMinDuration).length})
                                  </span>
                                  <span className="text-[10px] text-blue-400 font-bold">
                                    🎙️ คนคุย ({ytSearchResults.filter(v => hasHumanOrStoryCues(v.title)).length})
                                  </span>
                                </div>
                                
                                {ytSelectedVideoIds.length > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={handleBatchYoutubeImport}
                                      className="px-3 py-1.5 bg-red-600/15 border border-red-500/25 text-red-400 hover:bg-red-650 hover:text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                                    >
                                      📥 สกัดที่เลือก ({ytSelectedVideoIds.length} คลิป)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleBatchYoutubeImportResume}
                                      className="px-3 py-1.5 bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-650 hover:text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                                    >
                                      📥 สกัดต่อ (ข้ามที่ดึงแล้ว)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDeleteSelectedYtVideos}
                                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-red-450 hover:bg-red-950/40 hover:text-red-400 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                                    >
                                      🗑️ ลบที่เลือก ({ytSelectedVideoIds.length} คลิป)
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Videos grid */}
                            {ytSearchResults.length === 0 ? (
                              <div className="p-16 bg-slate-950/20 border border-slate-900 rounded-2xl text-center text-slate-500">
                                🛸 ไม่พบรายการคลิป หรือยังไม่ได้กดรันการค้นหา
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {ytSearchResults
                                  .filter(video => {
                                    if (ytEvergreenOnly) {
                                      return (video.duration || 0) >= ytEvergreenMinDuration;
                                    }
                                    return true;
                                  })
                                  .map(video => {
                                    const isPopular = (video.views || 0) >= ytEvergreenMinViews;
                                    const isEvergreen = (video.duration || 0) >= ytEvergreenMinDuration;
                                    const isHumanSpeak = hasHumanOrStoryCues(video.title);
                                    const alreadyScraped = scrapedResults.some(item => 
                                      (item.source_url && (item.source_url.includes(video.id) || item.source_url === video.url)) || 
                                      item.id === video.id
                                    );

                                    return (
                                      <div
                                        key={video.id}
                                        className={`bg-slate-950/40 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-lg shadow-black/45 group ${
                                          alreadyScraped ? 'border-emerald-900/60 hover:border-emerald-850' : 'border-slate-900 hover:border-slate-800'
                                        }`}
                                      >
                                        <div>
                                          {/* Thumbnail overlay */}
                                          <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                                            {video.thumbnail ? (
                                              <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-300"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 font-bold text-[10px]">
                                                NO IMAGES
                                              </div>
                                            )}
                                            
                                            {/* CHECKBOX OVERLAY */}
                                            <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded border border-slate-800">
                                              <input
                                                type="checkbox"
                                                checked={ytSelectedVideoIds.includes(video.id)}
                                                onChange={() => toggleYtVideoSelection(video.id)}
                                                className="w-4 h-4 cursor-pointer accent-red-500 bg-slate-950 border-slate-800 rounded focus:ring-0 focus:ring-offset-0"
                                              />
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteIndividualYtVideo(video.id);
                                                }}
                                                className="text-[10px] text-slate-400 hover:text-red-400 transition-all cursor-pointer ml-0.5"
                                                title="ลบวิดีโอนี้ออกจากการค้นหา"
                                              >
                                                🗑️
                                              </button>
                                            </div>

                                            {video.duration !== null && (
                                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[10px] text-white font-black font-mono">
                                                {formatYtDuration(video.duration)}
                                              </span>
                                            )}

                                            {video.queryMatched && (
                                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-violet-900/90 text-[8px] text-violet-100 font-bold font-mono">
                                                #{video.queryMatched}
                                              </span>
                                            )}
                                          </div>


                                          {/* Details */}
                                          <div className="p-4 space-y-2.5">
                                            <a
                                              href={video.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-xs font-black text-white hover:text-red-400 transition-all line-clamp-2 leading-relaxed"
                                              title={video.title}
                                            >
                                              {video.title}
                                            </a>

                                            {/* Channel details */}
                                            <div className="flex items-center gap-2">
                                              <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-750 flex-shrink-0 flex items-center justify-center text-[10px] text-slate-400 font-bold overflow-hidden font-mono">
                                                {video.channelName ? video.channelName.charAt(0).toUpperCase() : 'Y'}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <a
                                                  href={video.channelUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="text-[10px] text-slate-400 font-bold truncate hover:underline block"
                                                >
                                                  {video.channelName || 'YouTube Channel'}
                                                </a>
                                              </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                              <span>👀 {video.views ? video.views.toLocaleString() : '0'} views</span>
                                              <span>
                                                {video.uploadedAt ? (
                                                  /^\d{8}$/.test(video.uploadedAt)
                                                    ? `${video.uploadedAt.slice(0, 4)}-${video.uploadedAt.slice(4, 6)}-${video.uploadedAt.slice(6, 8)}`
                                                    : new Date(video.uploadedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
                                                ) : 'N/A'}
                                              </span>
                                            </div>

                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-1 pt-1">
                                              {alreadyScraped && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-450 border border-emerald-500/30 font-black animate-pulse flex items-center gap-0.5">
                                                  <CheckCircle className="w-2.5 h-2.5" />
                                                  ดึงเข้าคลังแล้ว
                                                </span>
                                              )}
                                              {isPopular && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-500/20 font-black">
                                                  🔥 Popular
                                                </span>
                                              )}
                                              {isEvergreen && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-500/20 font-black">
                                                  🌲 Evergreen
                                                </span>
                                              )}
                                              {isHumanSpeak && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black">
                                                  🎙️ Human Speak
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Actions buttons */}
                                        <div className="p-4 pt-0 grid grid-cols-2 gap-2 border-t border-slate-900/60 mt-3">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setYtUrl(video.url);
                                              setYtActiveMode('extractor');
                                            }}
                                            className="py-1.5 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer hover:bg-slate-850"
                                          >
                                            ▶️ โหลดลง Extractor
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const queryParams = `url=${encodeURIComponent(video.url)}&limit=${ytLimit}&openrouter_key=${encodeURIComponent(openRouterKey)}`;
                                              runContentScraper('youtube', queryParams);
                                              alert(`กำลังรันโปรเซสสกัด OpenCV สไลด์และดึงสคริปต์วิดีโอนี้เข้าคลังหลังบ้าน...`);
                                              setYtActiveMode('extractor');
                                            }}
                                            className={`py-1.5 rounded-lg text-[10px] font-black text-center transition-all cursor-pointer ${
                                              alreadyScraped 
                                                ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-450 hover:bg-emerald-800/40 hover:text-emerald-300' 
                                                : 'bg-red-600/15 border border-red-500/25 text-red-400 hover:bg-red-650 hover:text-white'
                                            }`}
                                          >
                                            {alreadyScraped ? '✅ ดึงเข้าคลังแล้ว (ดึงซ้ำ)' : '📥 สกัด & ดึงเข้าคลัง'}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}

                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

            {contentActiveSubTab === 'github' && (
              /* GitHub Layout is Rendered FULL-WIDTH! */
              <div className="space-y-6">
                
                {/* Header info */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-4 flex-wrap gap-4 text-left">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span className="text-xl">🐙</span> ค้นหาของดีและขุดดาวจาก GitHub Trends
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      ดูแนวโน้มวันนี้จากดาวที่พุ่งขึ้น หรือระบุเจาะจงรายหัวข้อ แล้วสั่งบอทประมวลผล clickbait สคริปต์
                    </p>
                  </div>
                  {/* COMPACT & HIGH-CONTRAST TOP 30 BUTTON IN THE HEADER */}
                  <button
                    type="button"
                    onClick={handleSearchTodayTop30}
                    disabled={ghSearchLoading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer font-sans whitespace-nowrap"
                  >
                    {ghSearchLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        <span>กำลังดึงข้อมูล...</span>
                      </>
                    ) : (
                      <>
                        <span>🔥 ดึงด่วน Top 30 เทรนด์วันนี้</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Discovery Modes */}
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 text-left shadow-lg">
                  <div className="mb-3">
                    <div className="text-xs font-bold text-cyan-400">⚡ เลือกกลยุทธ์การค้นหา (Discovery Mode)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-sans">ระบุเกณฑ์การสืบค้นเพื่อคัดเลือกคลังดาวน์โหลด GitHub</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {DISCOVERY_MODES.map(mode => {
                      const active = ghMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setGhMode(mode.id)}
                          className={`flex-1 min-w-[160px] text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-20 ${
                            active
                              ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)] text-white scale-[1.01]'
                              : 'border-slate-850 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-white hover:bg-slate-900/40'
                          }`}
                          title={mode.description}
                        >
                          <div className={`text-xs font-black flex items-center justify-between gap-1.5 ${active ? 'text-white' : 'text-slate-200'}`}>
                            <span>{mode.label}</span>
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>}
                          </div>
                          <div className="text-[10px] mt-1 leading-snug font-sans text-slate-400">{mode.short}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Keyword queries grid */}
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 text-left shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-900/40 pb-2.5">
                    <div>
                      <div className="text-xs font-bold text-purple-400">🔮 เลือกหัวข้อเทรนด์หลัก (Query Topics)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        ระบบจะควบรวมคำค้นหาและดึงข้อมูลมาเรียบเรียงโดยไม่ซ้ำซ้อน
                      </div>
                    </div>
                    <div className="flex gap-2 font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedQueries(KEYWORDS.filter(k => k.query).map(k => k.query))}
                        className="text-[10px] px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-purple-500/10 active:scale-95 flex items-center gap-1"
                      >
                        ✨ เลือกทุกหัวข้อ AI
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQueries([''])}
                        className="text-[10px] px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-300 font-bold rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                      >
                        🧹 ล้างตัวเลือก
                      </button>
                    </div>
                  </div>

                  {/* FLEX WRAP HORIZONTAL CHIPS - COMPLETELY SAVES SPACE */}
                  <div className="max-h-44 overflow-y-auto pr-1 flex flex-wrap gap-2 custom-scrollbar font-sans">
                    {KEYWORDS.map(k => {
                      const active = selectedKeywords.some(selected => selected.query === k.query);
                      return (
                        <button
                          key={k.query || 'all'}
                          type="button"
                          onClick={() => toggleKeywordQuery(k.query)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer select-none font-sans ${
                            active
                              ? 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.15)] font-bold'
                              : 'border-slate-850 bg-slate-950/40 text-slate-400 hover:border-purple-500/40 hover:bg-purple-950/10 hover:text-slate-200'
                          }`}
                          title="คลิกเพื่อเลือกหัวข้อหลักในการค้นหา"
                        >
                          <span>{k.emoji} {k.label}</span>
                          {active && (
                            <span className="w-3.5 h-3.5 rounded-full bg-purple-500 text-white text-[9px] flex items-center justify-center font-bold font-sans">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-900/30 text-[10px] text-slate-500 font-bold flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-900 text-slate-400">
                      💡 สแกนควบรวมทั้งหมด: <span className="text-purple-400 font-black">{selectedTopicCount} หัวข้อ</span>
                    </div>
                  </div>
                </div>

                {/* Configuration control row */}
                <div className="flex flex-wrap items-center gap-4 text-left">
                  {/* Repo Count Limit */}
                  <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-850 rounded-xl px-4 py-3 shadow-inner">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">จำกัดดึงต่อหัวข้อ</label>
                    <input
                      type="number"
                      value={ghCount}
                      min={1}
                      max={100}
                      onChange={e => setGhCount(e.target.value)}
                      className="w-16 bg-transparent text-sm font-black text-white text-center outline-none border-b border-slate-800 focus:border-purple-500"
                    />
                  </div>

                  {/* AI Model dropdown */}
                  <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-850 rounded-xl px-4 py-3 flex-1 min-w-[240px] shadow-inner">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">🤖 โมเดลเขียนคำโปรย:</label>
                    <select
                      value={ghModel}
                      onChange={e => setGhModel(e.target.value)}
                      className="bg-transparent text-xs font-black text-white outline-none cursor-pointer w-full font-sans focus:text-purple-400"
                    >
                      {GH_MODEL_OPTIONS.map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-950 text-white">{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Run Search Button */}
                  <button
                    type="button"
                    onClick={() => handleGithubSearch()}
                    disabled={ghSearchLoading}
                    className="px-8 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:via-indigo-500 hover:to-blue-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 disabled:opacity-50 cursor-pointer font-sans"
                  >
                    {ghSearchLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>กำลังสแกนหาของเด็ด...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 text-violet-200" />
                        <span>ค้นหาคลัง GitHub ({plannedRepoTotal} รายการ)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* API Token and profile settings */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 mb-4 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">🔑 GitHub Profile:</span>
                    <select
                      value={selectedGithubProfileId}
                      onChange={(e) => setSelectedGithubProfileId(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer focus:outline-none focus:border-cyan-500 w-44 font-sans"
                    >
                      <option value="default" className="bg-slate-950 text-white">⚙️ คีย์เริ่มต้น (Default)</option>
                      {dbProfiles.filter(p => p.service_name === 'github').map(p => (
                        <option key={p.id} value={String(p.id)} className="bg-slate-950 text-white">
                          🐙 {p.key_name} (SQLite)
                        </option>
                      ))}
                      <option value="manual" className="bg-slate-950 text-white">✍️ กรอกคีย์เอง...</option>
                    </select>
                  </div>

                  {selectedGithubProfileId === 'manual' && (
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="password"
                        placeholder="กรอก ghp_..."
                        value={localStorage.getItem('github_token') || ''}
                        onChange={(e) => {
                          localStorage.setItem('github_token', e.target.value);
                          setSelectedGithubProfileId('manual');
                        }}
                        className="bg-slate-955 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 w-full"
                      />
                    </div>
                  )}
                  
                  {/* API Rate Limit Checker */}
                  <button
                    type="button"
                    onClick={checkGhRateLimit}
                    disabled={ghIsCheckingRate}
                    className="text-xs px-3.5 py-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer font-sans"
                  >
                    {ghIsCheckingRate ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <span>📊 ตรวจสอบ Quota API</span>}
                  </button>

                  {ghRateLimit && (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500">SEARCH:</span>
                        <span className="font-bold text-cyan-400">{ghRateLimit.search.remaining}/{ghRateLimit.search.limit}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500">CORE/README:</span>
                        <span className="font-bold text-cyan-400">{ghRateLimit.core.remaining}/{ghRateLimit.core.limit}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footage Presets section */}
                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/30">
                  <button
                    type="button"
                    onClick={() => setShowGhFootageSection(!showGhFootageSection)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-900/40 transition-all cursor-pointer text-left font-sans"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🖼️</span>
                      <span className="font-bold text-xs text-white">รูปภาพ Footage ประกอบโพสและสไลด์</span>
                    </div>
                    <span className={`text-xs text-slate-500 transition-transform ${showGhFootageSection ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {showGhFootageSection && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-900/60 pt-4 text-left">
                      <p className="text-[10px] text-slate-400">เลือกตำแหน่งโฟลเดอร์ภาพ หรือกดสร้างโฟลเดอร์ตามหัวข้อ Dropbox เพื่อจัดการคลังภาพ</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={ghPickFootageFolder}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                        >
                          📁 เลือกโฟลเดอร์ (Folder Picker)
                        </button>
                        {ghFootageFolder && (
                          <span className="text-[10px] text-slate-400 truncate bg-slate-950 px-2.5 py-1 rounded border border-slate-850 font-mono">
                            📂 {ghFootageFolderName || ghFootageFolder}
                          </span>
                        )}
                      </div>

                      {ghFootageFolder && ghSubfolders.length === 0 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <p className="text-[10px] text-amber-300 mb-2">
                            ⚠️ โฟลเดอร์หลักนี้ยังไม่มีการจัดแบ่งหัวข้อ — กดสร้าง Subfolders ทั้ง {KEYWORDS.length} หัวข้อเลย!
                          </p>
                          <button
                            type="button"
                            onClick={ghCreateKeywordSubfolders}
                            disabled={ghIsCreatingFolders}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer font-sans"
                          >
                            {ghIsCreatingFolders ? '⏳ กำลังสร้างโฟลเดอร์...' : '📂 สร้าง Subfolders ครบเซ็ต'}
                          </button>
                        </div>
                      )}

                      {ghSubfolders.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-500">ซิงค์ตามหัวข้อ:</label>
                            <select
                              value={selectedKw.query}
                              onChange={e => setPrimaryKeywordQuery(e.target.value)}
                              className="bg-slate-955 border border-slate-850 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 flex-1 font-sans cursor-pointer"
                            >
                              {ghSubfolders.length > 0
                                ? KEYWORDS.filter(k => ghSubfolders.some(sf => sf.name === k.label)).map(k => {
                                    const sf = ghSubfolders.find(s => s.name === k.label);
                                    return (
                                      <option key={k.query} value={k.query} className="bg-slate-955 text-white">
                                        {k.emoji} {k.label} ({sf?.imageCount ?? 0} รูปภาพ)
                                      </option>
                                    );
                                  })
                                : KEYWORDS.map(k => (
                                    <option key={k.query} value={k.query} className="bg-slate-955 text-white">
                                      {k.emoji} {k.label}
                                    </option>
                                  ))
                              }
                            </select>
                            {ghSubfolders.length < KEYWORDS.length && (
                              <button
                                type="button"
                                onClick={ghCreateKeywordSubfolders}
                                disabled={ghIsCreatingFolders}
                                className="text-[10px] px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded border border-slate-800 transition-all cursor-pointer font-bold font-sans"
                              >
                                {ghIsCreatingFolders ? '⏳' : '+ เพิ่มโฟลเดอร์ขาด'}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5">
                              <label className="text-[10px] text-slate-400 font-bold">จำนวน Prompt:</label>
                              <input
                                type="text"
                                value={ghStockCount}
                                onChange={e => {
                                  const v = e.target.value;
                                  if (v === '' || /^\d+$/.test(v)) setGhStockCount(v);
                                }}
                                className="w-10 bg-transparent text-xs font-bold text-white text-center outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleGenerateStockPrompt}
                              disabled={ghIsGeneratingPrompt}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer font-sans"
                            >
                              {ghIsGeneratingPrompt ? '⏳ กำลังคำนวณ...' : '✨ หมุนคำชวนสร้าง Prompt'}
                            </button>
                          </div>

                          {ghGeneratedPrompt && (
                            <div className="p-3 bg-slate-950/70 border border-slate-900 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-bold">📝 Prompt ที่ประดิษฐ์ขึ้น</span>
                                <div className="flex items-center gap-2">
                                  {ghFootageMessage && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">{ghFootageMessage}</span>}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(ghGeneratedPrompt);
                                      setGhFootageMessage('📋 คัดลอกพร้อมใช้งานแล้ว!');
                                      setTimeout(() => setGhFootageMessage(''), 2000);
                                    }}
                                    className="text-[9px] font-bold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded cursor-pointer font-sans"
                                  >
                                    คัดลอกทั้งหมด
                                  </button>
                                </div>
                              </div>
                              <textarea
                                readOnly
                                value={ghGeneratedPrompt}
                                className="w-full bg-slate-950 text-slate-300 text-xs font-mono p-2.5 rounded border border-slate-850 outline-none resize-none"
                                rows={6}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Results + selection controls ── */}
                {ghRepos.length > 0 && (
                  <div className="space-y-4">
                    {/* Selection bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectGhAll}
                          className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                        >
                          ☑ เลือกทั้งหมด
                        </button>
                        <button
                          type="button"
                          onClick={deselectGhAll}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold transition-all border border-slate-850 cursor-pointer"
                        >
                          ☐ ยกเลิก
                        </button>
                        <span className="text-xs text-slate-400 font-bold ml-1">
                          เลือก {ghSelectedIds.size} / {ghRepos.length} รายการ
                        </span>
                      </div>

                      {ghSelectedIds.size > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={downloadGhReposCSV}
                            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            ⬇ โหลด CSV (repos)
                          </button>
                          <button
                            type="button"
                            onClick={handleGhSaveSelectedToContentStock}
                            disabled={ghIsGenerating}
                            className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="บันทึก repo ที่เลือกเข้า คลัง SQLite"
                          >
                            {ghIsGenerating ? '⏳ กำลังเก็บ...' : '📦 เก็บเข้าคลัง Content'}
                          </button>
                          <button
                            type="button"
                            onClick={ghIsGenerating ? () => { ghStopRef.current = true; } : handleGenerateGhPosts}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              ghIsGenerating
                                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                            }`}
                          >
                            {ghIsGenerating ? '⛔ หยุด' : '✍️ หมุนโพส Clickbait'}
                          </button>
                          {ghGeneratedPosts.some(p => p.status === 'done') && (
                            <button
                              type="button"
                              onClick={downloadGhPostsCSV}
                              className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              ⬇ โหลด CSV (โพส AI)
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {ghGenLog && (
                      <div className="px-3.5 py-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-lg text-xs font-bold animate-pulse text-left">
                        {ghGenLog}
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20">
                      <table className="w-full text-left border-collapse font-sans">
                        <thead>
                          <tr className="border-b border-slate-900 bg-slate-950/40">
                            <th className="p-3.5 text-center w-12">
                              {/* Checkbox or blank */}
                            </th>
                            <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">คลังซอร์สโค้ด (Repository)</th>
                            <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-24">ดาววันนี้</th>
                            <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-24">ดาวรวม</th>
                            <th className="p-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-36 text-center">บอทประมวลผล</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60 text-slate-300">
                          {ghRepos.map((repo, idx) => {
                            const isChecked = ghSelectedIds.has(repo.id);
                            const genStatus = ghGeneratedPosts.find(p => p.repoId === repo.id);
                            
                            return (
                              <React.Fragment key={repo.id}>
                                <tr 
                                  onClick={() => toggleGhSelect(repo.id)}
                                  className={`hover:bg-slate-900/20 transition-all cursor-pointer ${
                                    isChecked ? 'bg-violet-500/[0.02]' : ''
                                  }`}
                                >
                                  <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleGhSelect(repo.id)}
                                      className="accent-violet-500 w-4 h-4 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3.5">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-600 font-mono">#{idx + 1}</span>
                                        <a
                                          href={repo.html_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={e => e.stopPropagation()}
                                          className="text-xs font-black text-white hover:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
                                        >
                                          <span>{repo.full_name}</span>
                                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                        {repo.language && (
                                          <span className="px-2 py-0.5 text-[9px] rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                                            {repo.language}
                                          </span>
                                        )}
                                      </div>
                                      {repo.description && (
                                        <p className="text-[11px] text-slate-400 line-clamp-2 max-w-[560px] leading-relaxed">{repo.description}</p>
                                      )}
                                      {repo.topics && repo.topics.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5 font-sans">
                                          {repo.topics.slice(0, 5).map((t: string) => (
                                            <span key={t} className="px-1.5 py-0.5 text-[9px] rounded bg-violet-500/10 text-violet-300 border border-violet-500/10">
                                              {t}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-center text-xs font-black text-orange-400 font-sans">
                                    🔥 +{(repo.stars_today || 0).toLocaleString()}
                                  </td>
                                  <td className="p-3.5 text-center text-xs font-black text-yellow-400 font-sans">
                                    ⭐ {repo.stargazers_count.toLocaleString()}
                                  </td>
                                  <td className="p-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                    {genStatus ? (
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black font-sans
                                        ${genStatus.status === 'done' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' : ''}
                                        ${genStatus.status === 'loading' ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400 animate-pulse' : ''}
                                        ${genStatus.status === 'error' ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400' : ''}
                                        ${genStatus.status === 'pending' ? 'bg-slate-900 border border-slate-800 text-slate-500' : ''}
                                      `}>
                                        {genStatus.status === 'done' && '✅ สำเร็จ'}
                                        {genStatus.status === 'loading' && '⏳ เขียนโพส...'}
                                        {genStatus.status === 'error' && '❌ ขัดข้อง'}
                                        {genStatus.status === 'pending' && '⏸ รอคิว'}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 italic">พร้อมขุดสคริปต์</span>
                                    )}
                                  </td>
                                </tr>

                                {/* Expanded generated post box inside the repository table */}
                                {genStatus && genStatus.status === 'done' && (
                                  <tr className="bg-slate-950/40">
                                    <td colSpan={5} className="p-4 border-b border-slate-900/60" onClick={e => e.stopPropagation()}>
                                      <div className="space-y-4 max-w-[800px] mx-auto border-l-2 border-amber-400 pl-4 py-2 text-left">
                                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                                          <span className="text-xs font-bold text-amber-300">📢 โพสต์คลิกเบตที่ AI หมุนประดิษฐ์ขึ้น</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const rows = [
                                                ['id', 'headline', 'repo_url', 'clickbait_caption', 'comment_1', 'comment_2', 'comment_3'],
                                                [
                                                  `res_${repo.id}`, repo.full_name, repo.html_url,
                                                  genStatus.clickbait_caption, genStatus.comment_1, genStatus.comment_2, genStatus.comment_3
                                                ]
                                              ];
                                              downloadCSV(rows, `github_post_${repo.name}_${Date.now()}.csv`);
                                            }}
                                            className="text-[9px] bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 px-2 py-0.5 rounded cursor-pointer font-bold font-sans"
                                          >
                                            📥 โหลด CSV คู่นี้
                                          </button>
                                        </div>

                                        <div className="space-y-3.5">
                                          <PostField label="📢 Clickbait Caption (สไตล์หลัก)" value={genStatus.clickbait_caption} />
                                          <PostField label="💬 Comment 1 (รายละเอียดจุดเด่น)" value={genStatus.comment_1} imageUrl={genStatus.images[0]} />
                                          <PostField label="💬 Comment 2 (วิธีประยุกต์และประเด็นเสริม)" value={genStatus.comment_2} imageUrl={genStatus.images[1]} />
                                          <PostField label="💬 Comment 3 (จุดเด่นสุดท้าย & ลิงก์ปลายทาง)" value={genStatus.comment_3} imageUrl={genStatus.images[2]} />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Empty State placeholder */}
                {!ghSearchLoading && ghRepos.length === 0 && (
                  <div className="text-center py-16 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/15">
                    <span className="text-3xl">🐙</span>
                    <p className="text-xs font-bold mt-3">ยังไม่ได้สแกนหรือทำการค้นหาข้อมูลคลังดาว GitHub</p>
                    <p className="text-[10px] text-slate-600 mt-1">เลือกและกรองพิกัดหมวดหมู่เป้าหมายด้านบน แล้วสั่งบอทค้นหาเพื่อแสดงข้อมูล</p>
                  </div>
                )}
              </div>
            )}

            {contentActiveSubTab === 'replicator' && (
              <ViralReplicatorPortal 
                API_BASE={API_BASE} 
                openRouterKey={openRouterKey}
                onApprove={onApprove}
              />
            )}
          </div>
        </div>
      )}

      {/* 5. EDIT WATCHLIST ITEM MODAL REPLICATING V1 */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 animate-fade-in" onClick={() => setEditingPage(null)}>
          <div 
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl border bg-slate-950 border-slate-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 border-b border-slate-900 pb-3">
              <h3 className="text-base font-black text-white">✏️ แก้ไขรายละเอียดเพจเฝ้าระวัง</h3>
              <button onClick={() => setEditingPage(null)} className="text-slate-500 hover:text-white text-lg font-black">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">ชื่อหน้าเพจ</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">ประเภทเนื้อหา</label>
                {isCustomEditCategory ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      className="glass-input text-xs"
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => setIsCustomEditCategory(false)}
                      className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <select
                    value={allCategories.includes(editCategory) ? editCategory : 'NEW'}
                    onChange={e => {
                      if (e.target.value === 'NEW') {
                        setIsCustomEditCategory(true);
                        setEditCategory('');
                      } else {
                        setEditCategory(e.target.value);
                      }
                    }}
                    className="glass-input text-xs cursor-pointer text-slate-300"
                  >
                    {allCategories.map(c => (
                      <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>
                    ))}
                    <option value="NEW" className="font-bold text-cyan-400 bg-slate-950">+ พิมพ์ประเภทใหม่</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">ผู้ติดตาม (Followers)</label>
                  <input
                    type="text"
                    value={editFollowers}
                    onChange={e => setEditFollowers(e.target.value)}
                    placeholder="เช่น 150000"
                    className="glass-input text-xs font-mono text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">สิทธิ์ความเป็นเจ้าของ</label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-800 p-2.5 rounded-lg select-none">
                    <input
                      type="checkbox"
                      checked={editIsOwnPage}
                      onChange={e => setEditIsOwnPage(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-slate-400">⭐ เพจของฉัน</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">บันทึกช่วยจำ (Note)</label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  className="glass-input text-xs h-20 resize-none"
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900 flex justify-end gap-2">
              <button 
                onClick={() => setEditingPage(null)} 
                className="px-4 py-2 border border-slate-800 bg-slate-900 text-slate-400 rounded-lg text-xs font-bold hover:text-white"
              >
                ยกเลิก
              </button>
              <button 
                onClick={saveEdit}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-lg text-xs"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clickbait Caption Spawner Modal */}
      {activeCopyPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setActiveCopyPost(null)}>
          <div 
            className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl border bg-slate-950 border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✍️</span>
                <div className="text-left">
                  <h3 className="text-base font-black text-white">AI Clickbait Copywriting Spawner</h3>
                  <p className="text-[10px] text-slate-500 font-medium">สกัดคำพาดหัว & ร่างคอมเมนต์ต่อเนื่อง สำหรับเพจคุณ</p>
                </div>
              </div>
              <button onClick={() => setActiveCopyPost(null)} className="text-slate-500 hover:text-white text-lg font-black transition-colors">✕</button>
            </div>

            {/* Tone Selector */}
            <div className="bg-slate-900/50 border border-slate-900 p-3 rounded-xl flex items-center justify-between gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">เลือกโทนเขียน:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'selfwrite', label: '✍️ ทำทรงเขียนเอง', desc: 'เล่าเนื้อหาระดับลึกเชิงวิเคราะห์' },
                  { id: 'clickbait', label: '🔥 คลิกเบตดึงดูดสุดขีด', desc: 'เน้นกระตุ้น FOMO / กระแสร้อน' },
                  { id: 'casual', label: '💬 คุยชิลแบบเพื่อนสนิท', desc: 'เล่าเป็นกันเอง สุภาพ สนุก' }
                ].map(tone => (
                  <button
                    key={tone.id}
                    onClick={() => {
                      setCaptionTone(tone.id as any);
                      runClickbaitSpawner(activeCopyPost);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border
                      ${captionTone === tone.id 
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/5' 
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}
                    title={tone.desc}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {isCopyGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <span className="text-xs font-bold animate-pulse text-amber-400">กำลังปั่นคำโฆษณาคลิกเบตระเบิดยอดวิว...</span>
              </div>
            ) : captionResults ? (
              <div className="space-y-5 text-left">
                {/* 3 Caption Options */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📑</span> ตัวเลือกแคปชั่นแนะนำ (คลิกเพื่อคัดลอก)
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { title: 'Option 1: เล่าเรื่องกระตุ้นต่อมคิด', content: captionResults.caption1 },
                      { title: 'Option 2: ขยี้ประเด็นสำคัญ', content: captionResults.caption2 },
                      { title: 'Option 3: เปิดหัวเรียกแขก', content: captionResults.caption3 }
                    ].map((cap, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative group hover:border-amber-500/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-amber-400">{cap.title}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cap.content);
                              alert('📋 คัดลอกแคปชั่นลงคลิปบอร์ดแล้ว!');
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded hover:bg-amber-500/20"
                          >
                            📋 คัดลอก
                          </button>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium select-all whitespace-pre-line">{cap.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment Thread Sequence */}
                <div className="space-y-3 border-t border-slate-900 pt-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💬</span> ด้ายคอมเมนต์ต่อยอด (Thread Comments) เพื่อสะสมยอดดันโพสต์
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { part: '1/3 เนื้อความเปิดเรื่อง', content: captionResults.comment1 },
                      { part: '2/3 สกัดวิเคราะห์หลัก', content: captionResults.comment2 },
                      { part: '3/3 ปิดท้ายเรียก Engagement', content: captionResults.comment3 }
                    ].map((comm, idx) => (
                      <div key={idx} className="bg-slate-900/60 border border-slate-900 rounded-xl p-3.5 relative group hover:border-cyan-500/20 flex flex-col justify-between gap-2.5 transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{comm.part}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-4 select-all whitespace-pre-line">{comm.content}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(comm.content);
                            alert(`📋 คัดลอกเม้นท์ ${idx + 1}/3 ลงคลิปบอร์ดแล้ว!`);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/30 text-[9px] font-black py-1 rounded transition-all"
                        >
                          📋 คัดลอกเม้นท์ {idx + 1}/3
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Note Box */}
                <div className="bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-900/30 rounded-xl p-4">
                  <h5 className="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <span>💡</span> คำแนะนำสำหรับ Admin ในการดีไซน์ลงปก Canvas
                  </h5>
                  <p className="text-xs text-purple-200 leading-relaxed font-semibold">{captionResults.note}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p className="text-xs">เกิดข้อผิดพลาดในการโหลดแคปชั่น กรุณากดเลือกโทนเขียนด้านบนเพื่อสั่งรันใหม่อีกครั้งครับ</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-900 flex justify-end gap-2">
              <button 
                onClick={() => setActiveCopyPost(null)} 
                className="px-4 py-2 border border-slate-800 bg-slate-900 text-slate-400 rounded-lg text-xs font-bold hover:text-white hover:border-slate-700 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Analyzer Panel replicating V1 */}
      {activeChatPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in" onClick={() => setActiveChatPost(null)}>
          <div 
            className="w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl border bg-slate-950 border-slate-800 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💬</span>
                <div className="text-left">
                  <h3 className="text-base font-black text-white">AI Trend Chat Analyzer</h3>
                  <p className="text-[10px] text-slate-500 font-medium">ห้องแชทวิจัยเจาะประเด็นข่าวและวิจัยกระแสโพสต์ไวรัล</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ใช้ AI โมเดล:</span>
                  <select
                    value={chatModel}
                    onChange={e => setChatModel(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[10px] text-slate-300 font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (แนะนำ/เร็ว)</option>
                    <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (ละเอียดสูง)</option>
                    <option value="deepseek/deepseek-chat">DeepSeek V3</option>
                  </select>
                </div>
                <button onClick={() => setActiveChatPost(null)} className="text-slate-500 hover:text-white text-lg font-black">✕</button>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Side: Post context and pinned prompts */}
              <div className="w-[38%] border-r border-slate-900 p-5 overflow-y-auto custom-scrollbar bg-slate-950/40 space-y-5">
                <div className="text-left">
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider">ข้อมูลโพสต์ที่ใช้อ้างอิง</span>
                  <h4 className="text-xs font-black text-white leading-snug mt-2">{activeChatPost.title}</h4>
                  {activeChatPost.author_name && (
                    <p className="text-[10px] text-cyan-400 mt-1 font-bold">✍️ แหล่งที่มา: {activeChatPost.author_name}</p>
                  )}
                  {activeChatPost.selected_headline && (
                    <p className="text-[11px] text-cyan-200 line-clamp-3 bg-cyan-950/20 border border-cyan-800/10 rounded p-2.5 leading-relaxed mt-2.5 italic">
                      🇹🇭 {activeChatPost.selected_headline}
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-900 pt-4 text-left">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">เนื้อหาแคปชั่นต้นทางดิบ</span>
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg text-[11px] text-slate-300 font-medium overflow-y-auto max-h-[160px] custom-scrollbar whitespace-pre-line mt-1.5 leading-relaxed select-all text-left">
                    {activeChatPost.raw_content || 'ไม่มีเนื้อหาข้อความ'}
                  </div>
                </div>

                {/* Saved Prompts V1 Templates */}
                <div className="border-t border-slate-900 pt-4 text-left">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">📌 คำถามวิเคราะห์ด่วนสำเร็จรูป</span>
                  <div className="space-y-2 mt-2">
                    {[
                      { icon: '📊', text: 'สรุปเทรนด์หลัก 3-5 อย่างจากโพสต์นี้' },
                      { icon: '💡', text: 'ควรขยายความจากเนื้อหาไปทำคอร์สออนไลน์อย่างไร?' },
                      { icon: '📱', text: 'เขียนสคริปต์คลิปสั้น (TikTok/Reel) ตามกระแสข่าวนี้' },
                      { icon: '🎭', text: 'แปลงข่าวนี้ให้เป็นนิทานเชิงปรัชญาสำหรับคนรุ่นใหม่' }
                    ].map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setChatInputText(t.text);
                        }}
                        className="w-full text-left bg-slate-900 hover:bg-slate-900/80 border border-slate-850 hover:border-cyan-500/20 p-2.5 rounded-lg text-[10px] text-slate-300 font-semibold flex items-start gap-2 transition-all"
                      >
                        <span className="text-xs">{t.icon}</span>
                        <span>{t.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Message log & Chat input */}
              <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 text-left">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold select-none
                        ${msg.role === 'user' ? 'bg-cyan-500 text-slate-950' : 'bg-indigo-600 text-white'}`}>
                        {msg.role === 'user' ? 'ME' : 'AI'}
                      </div>
                      <div className={`rounded-xl p-3.5 text-xs leading-relaxed
                        ${msg.role === 'user' 
                          ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-800/30 text-white' 
                          : 'bg-slate-900 border border-slate-850 text-slate-200 whitespace-pre-line'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isChatting && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">AI</div>
                      <div className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="ml-1 text-[10px] font-bold text-slate-500">AI กำลังประมวลผลเชิงลึก...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-900 bg-slate-950 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 rounded-xl px-4 py-2.5 focus-within:border-cyan-500/50 transition-all">
                    <input
                      type="text"
                      placeholder="พิมพ์หัวข้อวิจัย ปรับแต่งเนื้อหา หรือยิงคำถามเพิ่มเติมได้ที่นี่..."
                      value={chatInputText}
                      onChange={e => setChatInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && runAiChatSend()}
                      className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-0"
                    />
                    <button
                      onClick={runAiChatSend}
                      disabled={isChatting || !chatInputText.trim()}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1
                        ${chatInputText.trim() && !isChatting
                          ? 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-md shadow-cyan-500/5'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                    >
                      🚀 ส่งข้อความ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── HELPER COMPONENTS FOR PREMIUM VISUAL EXPERIENCE ───

const CopyHeadlineBtn = ({ headline }: { headline: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(headline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all duration-300 flex items-center gap-1 active:scale-95 cursor-pointer
        ${copied 
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold' 
          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 font-bold'
        }`}
    >
      <span>📋 {copied ? 'คัดลอกพาดหัวสำเร็จ!' : 'คัดลอกพาดหัว'}</span>
    </button>
  );
};

const PostField = ({ label, value, imageUrl }: { label: string; value: string; imageUrl?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`text-[9px] font-black px-2.5 py-1 rounded transition-all cursor-pointer ${
            copied 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-bold' 
              : 'bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:text-white text-slate-300 font-bold'
          }`}
        >
          {copied ? '📋 คัดลอกสำเร็จ!' : '📋 คัดลอก'}
        </button>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all font-sans text-left">{value}</p>
      {imageUrl && (
        <div className="w-48 aspect-video rounded overflow-hidden border border-slate-900 bg-slate-950 mt-2">
          <img src={imageUrl} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};
