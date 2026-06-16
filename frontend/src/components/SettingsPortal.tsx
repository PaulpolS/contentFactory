import { useState, useEffect } from 'react';
import {
  Sliders,
  Eye,
  EyeOff,
  Check,
  Clipboard,
  RefreshCw,
  Key,
  ShieldCheck,
  Database,
  Sparkles,
  UserCheck,
  Activity,
  Trash2,
  Plus
} from 'lucide-react';

interface FBPageAccount {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  followers_count?: number;
}

interface CreditDetails {
  total_remaining: number;
  total_limit: number;
  total_usage: number;
  is_active: boolean;
}

interface SettingsPortalProps {
  appScale: number;
  setAppScale: (scale: number) => void;
}

const API_BASE = 'http://localhost:5005/api';

const KEY_REGISTRY = [
  {
    id: 'openrouter',
    name: 'OpenRouter API Key',
    desc: 'ใช้รันบอท AI (Gemini / Claude / GPT) สำหรับวิเคราะห์แนวโน้มข่าว สรุปหัวข้อสแกนคลิป และประเมินเกรดโพสต์ไวรัลคู่แข่ง',
    placeholder: 'sk-or-v1-...',
    storageKey: 'openrouter_key',
    helperLink: 'https://openrouter.ai/keys'
  },
  {
    id: 'kie',
    name: 'KIE.ai API Key',
    desc: 'สำหรับระบบสกัดตัวหนังสือจากรูปภาพ (OCR) และเรียกเครื่องมือวิเคราะห์เชิงภาพประสิทธิภาพสูง',
    placeholder: 'kie-api-key-...',
    storageKey: 'kie_key',
    helperLink: 'https://kie.ai'
  },
  {
    id: 'github',
    name: 'GitHub Token',
    desc: 'คีย์ส่วนบุคคล (Personal Access Token) เพื่อเพิ่มจำนวนครั้งการสแกน Repositories ยอดนิยมใน Discovery Portal',
    placeholder: 'ghp_...',
    storageKey: 'github_token',
    helperLink: 'https://github.com/settings/tokens'
  },
  {
    id: 'dropbox',
    name: 'Dropbox Token',
    desc: 'โทเคนสำหรับเชื่อมโยงพื้นที่จัดเก็บ Cloud Drive เพื่อทำการซิงค์ภาพประกอบ สื่อโฆษณา และรายงานแบบอัตโนมัติ',
    placeholder: 'sl.u.abc...',
    storageKey: 'dropbox_key',
    helperLink: 'https://www.dropbox.com/developers'
  },
  {
    id: 'google',
    name: 'Google API Key',
    desc: 'เชื่อมต่อตรงกับ Google AI Studio (Gemini Flash/Pro ดั้งเดิม) หรือการโอนถ่ายเอกสารชีตข้อมูลหลังบ้าน',
    placeholder: 'AIzaSy...',
    storageKey: 'google_key',
    helperLink: 'https://aistudio.google.com/'
  },
  {
    id: 'apify',
    name: 'Apify API Key',
    desc: 'กุญแจสำคัญสำหรับเรียกใช้ Facebook/TikTok/YouTube Scrapers ในเรดาร์สแกนคู่แข่งคู่ขนาน',
    placeholder: 'apify_api_...',
    storageKey: 'apify_key',
    helperLink: 'https://console.apify.com/account/integrations'
  },
  {
    id: 'giphy',
    name: 'GIPHY API Key',
    desc: 'ใช้ในการเรียกค้นคลังข้อมูลภาพมีมภาพเคลื่อนไหว (GIFs) สื่อกระตุ้นการมีส่วนร่วมสำหรับการสร้าง Canvas',
    placeholder: 'giphy_api_key_...',
    storageKey: 'giphy_key',
    helperLink: 'https://developers.giphy.com/'
  }
];

export default function SettingsPortal({ appScale, setAppScale }: SettingsPortalProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'api_keys' | 'facebook' | 'display'>('api_keys');

  // Named API Key Profiles States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [newService, setNewService] = useState<string>('openrouter');
  const [newName, setNewName] = useState<string>('');
  const [newKey, setNewKey] = useState<string>('');
  const [showNewKey, setShowNewKey] = useState<boolean>(false);

  // Unified general API Keys state
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    KEY_REGISTRY.forEach(item => {
      init[item.id] = localStorage.getItem(item.storageKey) || '';
    });
    return init;
  });

  // Unified key names state for primary keys
  const [apiKeyNames, setApiKeyNames] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    KEY_REGISTRY.forEach(item => {
      init[item.id] = localStorage.getItem(item.storageKey + '_name') || 'Default';
    });
    return init;
  });

  // Track raw DB key values and names to check for unsaved edits (dirty status)
  const [dbKeys, setDbKeys] = useState<Record<string, string>>({});
  const [dbKeyNames, setDbKeyNames] = useState<Record<string, string>>({});

  // Track which inputs have shown passwords
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Dynamic DB sync status check from SQLite
  const [dbKeysStatus, setDbKeysStatus] = useState<Record<string, { exists: boolean; length: number; updated_at?: string }>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Credit checking states
  const [checkingCredit, setCheckingCredit] = useState(false);
  const [creditResult, setCreditResult] = useState<{
    openrouter?: CreditDetails | false | null;
    apify?: { status: string; key_format: boolean } | null;
    github?: { status: string; rate_limit_limit?: number; rate_limit_remaining?: number } | null;
  } | null>(null);

  // Advanced Profile drawer
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [storageBytes, setStorageBytes] = useState(0);

  // Facebook user token state
  const [fbUserToken, setFbUserToken] = useState(() => localStorage.getItem('fb_user_token') || '');
  const [showFbToken, setShowFbToken] = useState(false);
  const [fbUserSaved, setFbUserSaved] = useState(false);

  // Facebook app credentials for lifetime token conversion
  const [fbAppId, setFbAppId] = useState(() => localStorage.getItem('fb_app_id') || '');
  const [fbAppSecret, setFbAppSecret] = useState(() => localStorage.getItem('fb_app_secret') || '');

  // Track which saved page tokens are lifetime tokens
  const [lifetimePageIds, setLifetimePageIds] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('fb_lifetime_page_ids') || '{}');
    } catch {
      return {};
    }
  });

  // Extracted FB pages accounts
  const [fbPages, setFbPages] = useState<FBPageAccount[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Saved page tokens local map
  const [savedPageTokens, setSavedPageTokens] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('fb_page_tokens_map') || '{}');
    } catch {
      return {};
    }
  });

  // Copy state feedbacks
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dropbox Auto-Token Generator states
  const [dropboxAppKey, setDropboxAppKey] = useState(() => localStorage.getItem('dropbox_app_key') || '');
  const [dropboxAppSecret, setDropboxAppSecret] = useState(() => localStorage.getItem('dropbox_app_secret') || '');
  const [showDropboxGenerator, setShowDropboxGenerator] = useState(false);

  // Fetch local DB key details on mount to synchronize if client is empty
  const fetchDbCredentials = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/credentials`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const statusMap: Record<string, { exists: boolean; length: number; updated_at?: string }> = {};
          const dbValues: Record<string, string> = {};
          const dbNamesMap: Record<string, string> = {};

          data.data.forEach((row: any) => {
            const hasKey = !!row.credential_key && row.credential_key !== 'MOCK_' + row.service_name.toUpperCase() + '_KEY' && row.credential_key.trim() !== '';
            
            // Only map primary credential to the main configuration grid inputs
            if (row.is_primary === 1 || (!row.is_primary && row.key_name === 'Default')) {
              statusMap[row.service_name] = {
                exists: hasKey,
                length: row.credential_key ? row.credential_key.length : 0,
                updated_at: row.updated_at
              };
              dbValues[row.service_name] = row.credential_key;
              dbNamesMap[row.service_name] = row.key_name || 'Default';
            }
          });

          setDbKeysStatus(statusMap);
          setDbKeys(dbValues);
          setDbKeyNames(dbNamesMap);

          // Populate empty localStorage slots from local database
          setApiKeys(prev => {
            const updated = { ...prev };
            let hasChanges = false;
            KEY_REGISTRY.forEach(item => {
              const dbVal = dbValues[item.id];
              const localVal = localStorage.getItem(item.storageKey);
              if (dbVal && !localVal && dbVal !== 'MOCK_' + item.id.toUpperCase() + '_KEY') {
                localStorage.setItem(item.storageKey, dbVal);
                if (item.id === 'google') {
                  localStorage.setItem('google_api_key', dbVal);
                }
                updated[item.id] = dbVal;
                hasChanges = true;
              }
            });
            return hasChanges ? updated : prev;
          });

          // Populate empty key name slots in localStorage from local database
          setApiKeyNames(prev => {
            const updated = { ...prev };
            let hasChanges = false;
            KEY_REGISTRY.forEach(item => {
              const dbNameVal = dbNamesMap[item.id];
              const localNameVal = localStorage.getItem(item.storageKey + '_name');
              if (dbNameVal && !localNameVal) {
                localStorage.setItem(item.storageKey + '_name', dbNameVal);
                updated[item.id] = dbNameVal;
                hasChanges = true;
              }
            });
            return hasChanges ? updated : prev;
          });

          // Also pull Dropbox Auto-Refresh credentials
          const dbAppKey = dbValues['dropbox_app_key'];
          const dbAppSecret = dbValues['dropbox_app_secret'];
          const dbRefreshToken = dbValues['dropbox_refresh_token'];

          if (dbAppKey && !localStorage.getItem('dropbox_app_key')) {
            localStorage.setItem('dropbox_app_key', dbAppKey);
            setDropboxAppKey(dbAppKey);
          }
          if (dbAppSecret && !localStorage.getItem('dropbox_app_secret')) {
            localStorage.setItem('dropbox_app_secret', dbAppSecret);
            setDropboxAppSecret(dbAppSecret);
          }
          if (dbRefreshToken && !localStorage.getItem('dropbox_refresh_token')) {
            localStorage.setItem('dropbox_refresh_token', dbRefreshToken);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to retrieve SQLite keys configuration:', err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/credentials`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProfiles(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    }
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newKey.trim()) {
      alert('กรุณากรอกชื่อโปรไฟล์และรหัสกุญแจ');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/vault/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: newService,
          key_name: newName,
          credential_key: newKey
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewName('');
        setNewKey('');
        await fetchProfiles();
        await fetchDbCredentials();
        alert('🎉 บันทึกโปรไฟล์กุญแจเรียบร้อยแล้ว!');
      } else {
        alert(`❌ เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleDeleteProfile = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบโปรไฟล์กุญแจนี้?')) return;
    try {
      const res = await fetch(`${API_BASE}/vault/credentials/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchProfiles();
        await fetchDbCredentials();
      } else {
        alert(`❌ ลบล้มเหลว: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleToggleProfile = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/vault/credentials/${id}/toggle`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        await fetchProfiles();
        await fetchDbCredentials();
      }
    } catch (err) {
      console.error('Failed to toggle credential:', err);
    }
  };

  const exchangeDropboxCode = async (code: string) => {
    const appKey = localStorage.getItem('dropbox_app_key')?.trim() || '';
    const appSecret = localStorage.getItem('dropbox_app_secret')?.trim() || '';
    const redirectUri = window.location.origin;

    if (!appKey || !appSecret) {
      alert('❌ ไม่พบ App Key หรือ App Secret ในเครื่องโปรดระบุก่อนเชื่อมต่อสิทธิ์ครับ');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncFeedback('🔄 กำลังแลกเปลี่ยนคีย์ถาวรกับเซิร์ฟเวอร์ Dropbox...');
      
      const res = await fetch(`${API_BASE}/vault/dropbox/exchange-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: appKey,
          client_secret: appSecret,
          redirect_uri: redirectUri
        })
      });

      const data = await res.json();
      if (data.success && data.data?.access_token) {
        const accessToken = data.data.access_token;
        const refreshToken = data.data.refresh_token || '';

        // Save access token
        localStorage.setItem('dropbox_key', accessToken);
        setApiKeys(prev => ({ ...prev, dropbox: accessToken }));

        // Save refresh token, App Key and App Secret
        if (refreshToken) {
          localStorage.setItem('dropbox_refresh_token', refreshToken);
        }
        
        // Build payload to sync all to SQLite
        const payload: Record<string, string> = {
          dropbox: accessToken,
          dropbox_app_key: appKey,
          dropbox_app_secret: appSecret
        };
        if (refreshToken) {
          payload.dropbox_refresh_token = refreshToken;
        }

        // Synchronize all key inputs to SQLite database
        const syncRes = await fetch(`${API_BASE}/vault/credentials/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials: payload })
        });

        const syncData = await syncRes.json();
        if (syncData.success) {
          setSyncFeedback('🎉 ยินดีด้วย! เชื่อมโยงบัญชี Dropbox และบันทึกระบบ Auto-Refresh (ต่ออายุคีย์อัตโนมัติ) ลง SQLite เรียบร้อยแล้วครับ!');
          await fetchDbCredentials();
          calculateStorageUsage();
        } else {
          setSyncFeedback('🟢 ได้รับคีย์จาก Dropbox แล้ว แต่มีปัญหาในการเขียนข้อมูลลงฐานข้อมูล SQLite');
        }
      } else {
        throw new Error(data.error || 'การแลกเปลี่ยนคีย์ล้มเหลว');
      }
    } catch (err: any) {
      setSyncFeedback(`❌ เชื่อมต่อล้มเหลว: ${err.message || 'กรุณาตรวจสอบ App Key / Secret และสิทธิ์ Redirect URI'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 8000);
    }
  };

  useEffect(() => {
    fetchDbCredentials();
    fetchProfiles();
    calculateStorageUsage();

    // Check if there is an OAuth callback code from Dropbox in query parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Clean up URL query parameters so it doesn't exchange again
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Attempt to exchange the code
      exchangeDropboxCode(code);
    }
  }, []);

  // Compute localStorage byte size for advanced stats
  const calculateStorageUsage = () => {
    let bytes = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        bytes += (localStorage[key] || '').length * 2;
      }
    }
    setStorageBytes(bytes);
  };

  // Toggle eye visibility
  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle single key state change
  const handleKeyChange = (id: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [id]: value }));
  };

  // Save all keys to LocalStorage and Sync with backend SQLite
  const handleSaveAndSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      // 1. Save all keys and names in frontend localStorage
      KEY_REGISTRY.forEach(item => {
        const val = apiKeys[item.id]?.trim() || '';
        const nameVal = apiKeyNames[item.id]?.trim() || 'Default';
        
        if (val) {
          localStorage.setItem(item.storageKey, val);
          localStorage.setItem(item.storageKey + '_name', nameVal);
          if (item.id === 'google') {
            localStorage.setItem('google_api_key', val);
          }
        } else {
          localStorage.removeItem(item.storageKey);
          localStorage.removeItem(item.storageKey + '_name');
          if (item.id === 'google') {
            localStorage.removeItem('google_api_key');
          }
        }
      });

      // 2. Synchronize to SQLite endpoint
      const payload: Record<string, { key: string; name: string }> = {};
      KEY_REGISTRY.forEach(item => {
        payload[item.id] = {
          key: apiKeys[item.id]?.trim() || '',
          name: apiKeyNames[item.id]?.trim() || 'Default'
        };
      });

      const res = await fetch(`${API_BASE}/vault/credentials/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credentials: payload })
      });

      const data = await res.json();
      if (data.success) {
        setSyncFeedback('🟢 บันทึกคีย์ลงบนเบราว์เซอร์ และซิงค์เข้าฐานข้อมูล SQLite สำเร็จแล้วครับ! บอทหลังบ้านพร้อมใช้งานทันที');
        await fetchDbCredentials();
        calculateStorageUsage();
      } else {
        throw new Error(data.error || 'การซิงค์ล้มเหลว');
      }
    } catch (err: any) {
      setSyncFeedback(`❌ เกิดข้อผิดพลาดในการบันทึก: ${err.message || 'เชื่อมต่อเซิร์ฟเวอร์หลังบ้านขัดข้อง'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Live Credit Diagnostic Checker
  const handleCheckCredits = async () => {
    setCheckingCredit(true);
    setCreditResult(null);

    const orKey = apiKeys['openrouter']?.trim() || '';
    const githubKey = apiKeys['github']?.trim() || '';
    const apifyKey = apiKeys['apify']?.trim() || '';

    const results: any = {
      openrouter: null,
      apify: null,
      github: null
    };

    try {
      // 1. Live Check OpenRouter Credits
      if (orKey) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/credits', {
            headers: {
              'Authorization': `Bearer ${orKey}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.data) {
              results.openrouter = data.data as CreditDetails;
            }
          } else {
            results.openrouter = false; 
          }
        } catch {
          results.openrouter = false;
        }
      }

      // 2. Apify key validator
      if (apifyKey) {
        results.apify = {
          status: apifyKey.startsWith('apify_api_') ? 'Verified Format' : 'Unknown Pattern',
          key_format: apifyKey.length > 15
        };
      }

      // 3. GitHub Rate Limit validation
      if (githubKey) {
        try {
          const res = await fetch('https://api.github.com/rate_limit', {
            headers: {
              'Authorization': `token ${githubKey}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            results.github = {
              status: 'Active',
              rate_limit_limit: data?.rate?.limit,
              rate_limit_remaining: data?.rate?.remaining
            };
          } else {
            results.github = { status: 'Unauthorized' };
          }
        } catch {
          results.github = { status: 'Failed Connection' };
        }
      }

      setCreditResult(results);
    } catch (err) {
      console.error('Credits diagnostics error:', err);
    } finally {
      setCheckingCredit(false);
    }
  };

  // Clear all localStorage configurations for clean slate
  const handleClearLocalStorage = () => {
    if (confirm('⚠️ คำเตือน! คุณแน่ใจที่จะลบข้อมูลคีย์ทั้งหมดใน Browser Local Storage ของเครื่องนี้? ข้อมูลในไฟล์ฐานข้อมูล SQLite จะไม่ได้รับผลกระทบ')) {
      KEY_REGISTRY.forEach(item => {
        localStorage.removeItem(item.storageKey);
        localStorage.removeItem(item.storageKey + '_name');
      });
      localStorage.removeItem('fb_user_token');
      localStorage.removeItem('fb_page_tokens_map');
      localStorage.removeItem('fb_lifetime_page_ids');
      localStorage.removeItem('fb_app_id');
      localStorage.removeItem('fb_app_secret');
      
      // Reload state
      const cleared: Record<string, string> = {};
      const clearedNames: Record<string, string> = {};
      KEY_REGISTRY.forEach(item => {
        cleared[item.id] = '';
        clearedNames[item.id] = 'Default';
      });
      setApiKeys(cleared);
      setApiKeyNames(clearedNames);
      setFbUserToken('');
      setFbAppId('');
      setFbAppSecret('');
      setFbPages([]);
      setSavedPageTokens({});
      setLifetimePageIds({});
      calculateStorageUsage();
      alert('🧹 ทำความสะอาดข้อมูล Local Storage บนเครื่องนี้เสร็จสิ้นแล้วครับ!');
    }
  };

  // Save FB User Token
  const saveFbUserToken = () => {
    localStorage.setItem('fb_user_token', fbUserToken);
    localStorage.setItem('fb_app_id', fbAppId);
    localStorage.setItem('fb_app_secret', fbAppSecret);
    setFbUserSaved(true);
    setTimeout(() => setFbUserSaved(false), 2000);
  };

  // Fetch managed FB pages via Facebook Graph API Explorer
  const fetchFacebookPages = async () => {
    if (!fbUserToken.trim()) {
      setFetchError('❌ กรุณากรอก Facebook User Access Token ที่กล่องข้อความก่อนกดดึงข้อมูลครับ');
      return;
    }

    setLoadingPages(true);
    setFetchError(null);
    setFbPages([]);

    try {
      let finalUserToken = fbUserToken.trim();

      // If App ID & App Secret are provided, exchange short-lived token for long-lived token
      if (fbAppId.trim() && fbAppSecret.trim()) {
        const exchangeUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${fbAppId.trim()}&client_secret=${fbAppSecret.trim()}&fb_exchange_token=${encodeURIComponent(finalUserToken)}`;
        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();

        if (exchangeData.error) {
          throw new Error(`แปลงเป็น Token ตลอดชีพไม่สำเร็จ: ${exchangeData.error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'}`);
        }

        if (exchangeData.access_token) {
          finalUserToken = exchangeData.access_token;
          setFbUserToken(finalUserToken);
          localStorage.setItem('fb_user_token', finalUserToken);
        }
      }

      const url = `https://graph.facebook.com/v20.0/me/accounts?fields=name,access_token,category,followers_count&limit=100&access_token=${encodeURIComponent(finalUserToken)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || 'เกิดข้อผิดพลาดจาก Facebook Graph API');
      }

      if (Array.isArray(data.data)) {
        setFbPages(data.data);
        if (data.data.length === 0) {
          setFetchError('ℹ️ ดึงข้อมูลสำเร็จ แต่ไม่พบเพจที่ Token นี้เป็นผู้ดูแล');
        }
      }
    } catch (err: any) {
      setFetchError(`❌ ไม่สามารถดึงข้อมูลเพจได้: ${err.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setLoadingPages(false);
    }
  };

  // Download page tokens as a JSON file
  const downloadPageTokensAsJson = () => {
    if (fbPages.length === 0) return;
    
    const dataToExport = fbPages.map(page => ({
      page_id: page.id,
      page_name: page.name,
      category: page.category || '',
      followers_count: page.followers_count || 0,
      access_token: page.access_token,
      token_type: fbAppId.trim() && fbAppSecret.trim() ? 'lifetime (never expires)' : 'derived from user token'
    }));

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `facebook_page_tokens_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download saved page tokens from local storage as a JSON file
  const downloadSavedPageTokensAsJson = () => {
    const savedCount = Object.keys(savedPageTokens).length;
    if (savedCount === 0) return;
    
    const dataToExport = Object.entries(savedPageTokens).map(([id, token]) => {
      const matchedPage = fbPages.find(p => p.id === id);
      return {
        page_id: id,
        page_name: matchedPage ? matchedPage.name : 'Unknown Saved Page',
        access_token: token,
      };
    });

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `saved_facebook_page_tokens_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper to copy text to clipboard with feedback
  const handleCopyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Save a single Facebook page token
  const savePageTokenLocally = (id: string, token: string) => {
    const updated = { ...savedPageTokens, [id]: token };
    setSavedPageTokens(updated);
    localStorage.setItem('fb_page_tokens_map', JSON.stringify(updated));

    const isLifetime = fbAppId.trim() !== '' && fbAppSecret.trim() !== '';
    const updatedLifetime = { ...lifetimePageIds, [id]: isLifetime };
    setLifetimePageIds(updatedLifetime);
    localStorage.setItem('fb_lifetime_page_ids', JSON.stringify(updatedLifetime));
  };

  // Save all discovered Facebook page tokens at once
  const saveAllPageTokens = () => {
    if (fbPages.length === 0) return;
    const updated = { ...savedPageTokens };
    const isLifetime = fbAppId.trim() !== '' && fbAppSecret.trim() !== '';
    const updatedLifetime = { ...lifetimePageIds };
    
    fbPages.forEach(page => {
      updated[page.id] = page.access_token;
      updatedLifetime[page.id] = isLifetime;
    });
    
    setSavedPageTokens(updated);
    localStorage.setItem('fb_page_tokens_map', JSON.stringify(updated));

    setLifetimePageIds(updatedLifetime);
    localStorage.setItem('fb_lifetime_page_ids', JSON.stringify(updatedLifetime));

    alert(`💾 บันทึก Access Token ของทั้ง ${fbPages.length} เพจเรียบร้อยแล้วครับ!`);
  };

  // Remove a saved page token
  const removeSavedToken = (id: string) => {
    const updated = { ...savedPageTokens };
    delete updated[id];
    setSavedPageTokens(updated);
    localStorage.setItem('fb_page_tokens_map', JSON.stringify(updated));

    const updatedLifetime = { ...lifetimePageIds };
    delete updatedLifetime[id];
    setLifetimePageIds(updatedLifetime);
    localStorage.setItem('fb_lifetime_page_ids', JSON.stringify(updatedLifetime));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
                  {/* Introduction Command Center Header */}
      <div 
        className="p-6 border relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-glass)',
          borderColor: 'var(--border-glass)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Subtle glow matching CoinPulse */}
        <div 
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" 
          style={{ backgroundColor: 'rgba(37, 99, 235, 0.05)' }}
        />
        
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono tracking-wider flex items-center gap-2 uppercase">
              <Sliders className="w-4 h-4 text-cyan-400" />
              ⚙️ SYSTEM SETTINGS (ศูนย์ตั้งค่าระบบ & กุญแจ API)
            </h3>
            
            {/* CoinPulse Styled Badge */}
            <span 
              className="text-[10px] font-mono px-2.5 py-0.5 rounded font-bold tracking-widest uppercase border"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderColor: 'rgba(37, 99, 235, 0.4)',
                color: 'var(--accent-cyan)',
              }}
            >
              🔒 Git-Safe Config
            </span>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed max-w-4xl font-sans">
            จัดการและปรับแต่งค่าการสเกลขนาดหน้าต่างโปรแกรม ขนาดตัวอักษรและปุ่มควบคุมทั้งหมดให้สอดคล้องกับสายตาของคุณ พร้อมระบุคีย์บริการสำหรับโมดูล AI และการดักจับเพจ Facebook ทุกข้อมูลบันทึกในเครื่องส่วนตัว ปลอดภัยสูงสุด
          </p>

          {/* Subtabs Selector styled strictly as CoinPulse Filter Chips */}
          <div className="flex items-center gap-2.5 pt-2">
            {(['api_keys', 'facebook', 'display'] as const).map(tab => {
              const isActive = activeSubTab === tab;
              let label = '';
              let Icon = Key;
              
              if (tab === 'api_keys') {
                label = `กุญแจ API ทั้งหมด (${KEY_REGISTRY.length})`;
                Icon = Key;
              } else if (tab === 'facebook') {
                label = `โทเคนเพจ Facebook (${Object.keys(savedPageTokens).length})`;
                Icon = UserCheck;
              } else {
                label = `ขนาดตัวอักษร & ปุ่ม (${appScale}%)`;
                Icon = Sliders;
              }
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className="px-4 font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer uppercase tracking-wider text-xs"
                  style={{
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                    borderColor: isActive ? 'var(--accent-cyan)' : 'var(--border-glass)',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    boxShadow: isActive ? 'var(--glow-cyan)' : 'none',
                    outline: 'none',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUBTAB 1: API KEYS GRID */}
      {activeSubTab === 'api_keys' && (
        <div className="space-y-6">
          
          <div 
            className="p-6 border space-y-6 transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-glass)',
              borderColor: 'var(--border-glass)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            }}
          >
            <div 
              className="flex items-center justify-between pb-4"
              style={{ borderBottom: '1px solid var(--border-glass)' }}
            >
              <div>
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  🔑 ตัวตั้งค่าบริการกุญแจ API Keys (SQLite DB Mapped)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  แก้ไขคีย์ที่คุณต้องการเรียกใช้งาน จากนั้นกดปุ่มบันทึกและซิงค์ คีย์จะถูกส่งไปแทนที่ค่าตั้งต้นจำลองของระบบหลังบ้าน
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Secondary Button styled as per coinpulse-DESIGN.md */}
                <button
                  onClick={handleCheckCredits}
                  disabled={checkingCredit}
                  className="px-4 font-mono text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                  style={{
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    borderRadius: '8px',
                    opacity: checkingCredit ? 0.4 : 1,
                  }}
                >
                  <Activity className={`w-3.5 h-3.5 ${checkingCredit ? 'animate-pulse' : ''}`} />
                  <span>{checkingCredit ? 'CHECKING...' : 'PINGS DIAGNOSTICS'}</span>
                </button>

                {/* Primary Button styled strictly as per coinpulse-DESIGN.md */}
                <button
                  onClick={handleSaveAndSync}
                  disabled={isSyncing}
                  className="px-4 text-white font-mono text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  style={{
                    height: '36px',
                    backgroundColor: isSyncing ? 'var(--border-glass-bright)' : 'var(--accent-cyan)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: isSyncing ? 'none' : 'var(--glow-cyan)',
                    opacity: isSyncing ? 0.5 : 1,
                  }}
                >
                  {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSyncing ? 'SYNCING...' : 'SAVE & SYNC SQLITE'}</span>
                </button>
              </div>
            </div>

            {syncFeedback && (
              <div 
                className="p-4 border text-xs font-mono text-white leading-relaxed"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  borderColor: 'rgba(37, 99, 235, 0.3)',
                  borderRadius: '6px',
                }}
              >
                {syncFeedback}
              </div>
            )}

            {/* Diagnostic Credit Results Display */}
            {creditResult && (
              <div 
                className="p-5 space-y-3 font-mono border"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderColor: 'var(--border-glass)',
                  borderRadius: '8px',
                }}
              >
                <div 
                  className="flex items-center justify-between pb-2"
                  style={{ borderBottom: '1px solid var(--border-glass)' }}
                >
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    บอร์ดรายงานสถานะกุญแจ (API Key Diagnostics)
                  </span>
                  <button 
                    onClick={() => setCreditResult(null)} 
                    className="text-[10px] text-slate-500 hover:text-white cursor-pointer bg-transparent border-none"
                  >
                    [ซ่อนรายงาน]
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-400">
                  {/* OpenRouter Status */}
                  <div 
                    className="p-3 space-y-1 border"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '6px',
                    }}
                  >
                    <span className="text-xs font-bold text-white block">OpenRouter Credits</span>
                    {creditResult?.openrouter === null ? (
                      <span className="text-slate-500 italic">ไม่ได้เปิดใช้งานการตรวจสอบ</span>
                    ) : creditResult?.openrouter === false ? (
                      <span className="text-rose-500 font-bold">❌ UNAUTHORIZED / FAILED</span>
                    ) : creditResult?.openrouter ? (
                      <div className="space-y-1 font-mono">
                        <span 
                          className="inline-block px-1.5 py-0.5 text-[9px] border rounded-sm font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            borderColor: 'rgba(34, 197, 94, 0.2)',
                          }}
                        >
                          ✓ ACTIVE
                        </span>
                        <div className="flex justify-between pt-1">
                          <span>ยอดคงเหลือ:</span>
                          <span className="text-white font-bold">${creditResult.openrouter.total_remaining.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ใช้ไปแล้ว:</span>
                          <span>${creditResult.openrouter.total_usage.toFixed(4)} / ${creditResult.openrouter.total_limit.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">ไม่ได้เปิดใช้งานการตรวจสอบ</span>
                    )}
                  </div>

                  {/* Apify Status */}
                  <div 
                    className="p-3 space-y-1 border"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '6px',
                    }}
                  >
                    <span className="text-xs font-bold text-white block">Apify Key Status</span>
                    {creditResult?.apify === null ? (
                      <span className="text-slate-500 italic">ไม่ได้กรอกกุญแจ Apify Key</span>
                    ) : creditResult?.apify ? (
                      <div className="space-y-1 font-mono">
                        <span 
                          className="inline-block px-1.5 py-0.5 text-[9px] border rounded-sm font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            borderColor: 'rgba(34, 197, 94, 0.2)',
                          }}
                        >
                          ✓ FORMAT VALID
                        </span>
                        <div className="flex justify-between pt-1">
                          <span>ฟอร์แมต API:</span>
                          <span className="text-zinc-300 font-bold">{creditResult.apify.status}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block leading-tight">บอท Scraper หลังบ้านพร้อมเชื่อมระบบ Apify Cloud</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">ไม่ได้กรอกกุญแจ Apify Key</span>
                    )}
                  </div>

                  {/* GitHub Status */}
                  <div 
                    className="p-3 space-y-1 border"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '6px',
                    }}
                  >
                    <span className="text-xs font-bold text-white block">GitHub Rate Limit (API)</span>
                    {creditResult?.github === null ? (
                      <span className="text-slate-500 italic">ไม่ได้ระบุ GitHub Token</span>
                    ) : creditResult?.github?.status === 'Unauthorized' ? (
                      <span className="text-rose-500 font-bold">❌ UNAUTHORIZED</span>
                    ) : creditResult?.github ? (
                      <div className="space-y-1 font-mono">
                        <span 
                          className="inline-block px-1.5 py-0.5 text-[9px] border rounded-sm font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            borderColor: 'rgba(34, 197, 94, 0.2)',
                          }}
                        >
                          ✓ VERIFIED
                        </span>
                        <div className="flex justify-between pt-1">
                          <span>เครดิตชั่วโมงนี้:</span>
                          <span className="text-white font-bold">{creditResult.github.rate_limit_remaining} / {creditResult.github.rate_limit_limit}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block leading-tight">อัตราการสแกนเร็วขึ้น 60 เท่า เมื่อเทียบกับแบบปกติ</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">ไม่ได้ระบุ GitHub Token</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Keys Fields Inputs Form Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {KEY_REGISTRY.map(item => {
                const value = apiKeys[item.id] || '';
                const isRevealed = !!showKeys[item.id];
                const dbStatus = dbKeysStatus[item.id];
                
                const dbKeyVal = dbKeys[item.id] || '';
                const dbKeyNameVal = dbKeyNames[item.id] || 'Default';
                const currentName = apiKeyNames[item.id] || 'Default';
                const isDirty = (value.trim() !== dbKeyVal.trim()) || (currentName.trim() !== dbKeyNameVal.trim());

                // Color codes following Coinpulse Status Chips
                const dbBadgeStyle = dbStatus?.exists
                  ? { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }
                  : { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', borderColor: 'var(--border-glass)' };
                
                const dbBadgeText = dbStatus?.exists
                  ? `เซฟลง SQLite (ยาว ${dbStatus.length} ตัวอักษร)`
                  : 'ไม่มีคีย์ในฐานข้อมูล';

                return (
                  <div 
                    key={item.id} 
                    className="p-5 border space-y-3 flex flex-col justify-between transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '12px',
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-white font-mono flex items-center gap-1.5 uppercase tracking-wider">
                            <Key className="w-3.5 h-3.5 text-cyan-400" />
                            {item.name}
                          </label>
                          <p className="text-[11px] text-slate-400 leading-normal font-sans pr-4">
                            {item.desc}
                          </p>
                        </div>
                        
                        <a 
                          href={item.helperLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] font-mono flex items-center gap-0.5 border px-2 py-0.5 rounded transition-all"
                          style={{
                            color: 'var(--accent-cyan)',
                            borderColor: 'rgba(37, 99, 235, 0.3)',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          รับคีย์ตรงนี้ 🔗
                        </a>
                      </div>

                      {/* Display SQLite Active Status indicator */}
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[9px] font-mono border px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider"
                          style={dbBadgeStyle}
                        >
                          {dbBadgeText}
                        </span>
                        {isDirty && (
                          <span className="text-[9px] font-mono text-amber-400">
                            (รอเซฟลง SQLite)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Profile / Key Name input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono block">ชื่อโปรไฟล์ / ชื่อเรียกคีย์ (Profile Name):</label>
                        <input
                          type="text"
                          placeholder="Default"
                          value={apiKeyNames[item.id] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setApiKeyNames(prev => ({ ...prev, [item.id]: val }));
                          }}
                          className="glass-input text-xs h-[30px] font-sans text-white"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            borderColor: 'var(--border-glass)',
                            color: '#ffffff',
                          }}
                        />
                      </div>

                      {/* Actual Key Input styled strictly as glass-input in index.css */}
                      <div className="space-y-1 relative">
                        <label className="text-[10px] text-slate-400 font-mono block">รหัสกุญแจ (API Key / Token):</label>
                        <div className="relative">
                          <input
                            type={isRevealed ? 'text' : 'password'}
                            placeholder={item.placeholder}
                            value={value}
                            onChange={e => handleKeyChange(item.id, e.target.value)}
                            className="glass-input pr-10 font-mono text-xs h-[36px]"
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.4)',
                              borderColor: 'var(--border-glass)',
                              color: '#ffffff',
                            }}
                          />
                          
                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(item.id)}
                            className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
                            title={isRevealed ? 'ซ่อนรหัสกุญแจ' : 'แสดงรหัสกุญแจ'}
                            style={{ background: 'transparent', border: 'none' }}
                          >
                            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                  </div>

                    {item.id === 'dropbox' && (
                      <div className="mt-3 pt-3 border-t border-slate-900/60 space-y-3">
                        <button
                          type="button"
                          onClick={() => setShowDropboxGenerator(!showDropboxGenerator)}
                          className="w-full py-1.5 px-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          ⚡ {showDropboxGenerator ? 'ปิดตัวช่วยสร้างคีย์อัตโนมัติ' : 'เปิดตัวช่วยสร้างคีย์และต่ออายุอัตโนมัติ (OAuth2)'}
                        </button>
                        
                        {showDropboxGenerator && (
                          <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-lg space-y-3 animate-fade-in text-[11px] font-sans text-left">
                            <span className="text-cyan-400 font-bold block mb-1">🔑 แผงควบคุมสิทธิ์ Dropbox (Auto-Refresh Builder)</span>
                            
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">DROPBOX APP KEY (APP ID)</label>
                                <input
                                  type="text"
                                  placeholder="ใส่ App Key ที่ได้จาก Dropbox Developers Portal"
                                  value={dropboxAppKey}
                                  onChange={e => {
                                    setDropboxAppKey(e.target.value);
                                    localStorage.setItem('dropbox_app_key', e.target.value);
                                  }}
                                  className="glass-input text-[10px] h-[30px] font-mono text-white"
                                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">DROPBOX APP SECRET</label>
                                <input
                                  type="password"
                                  placeholder="ใส่ App Secret ที่ได้จาก Dropbox Developers Portal"
                                  value={dropboxAppSecret}
                                  onChange={e => {
                                    setDropboxAppSecret(e.target.value);
                                    localStorage.setItem('dropbox_app_secret', e.target.value);
                                  }}
                                  className="glass-input text-[10px] h-[30px] font-mono text-white"
                                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                                />
                              </div>
                            </div>

                            {/* Status Badge */}
                            {localStorage.getItem('dropbox_refresh_token') && (
                              <div className="flex items-center gap-1.5 py-1 px-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                                <span>🟢 พร้อมต่ออายุอัตโนมัติ (Auto-Refresh Enabled)</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (!dropboxAppKey.trim()) {
                                  alert('กรุณากรอก Dropbox App Key ก่อนกดล็อกอินครับ');
                                  return;
                                }
                                // Save app credentials
                                localStorage.setItem('dropbox_app_key', dropboxAppKey.trim());
                                localStorage.setItem('dropbox_app_secret', dropboxAppSecret.trim());
                                
                                const redirectUri = window.location.origin;
                                const url = `https://www.dropbox.com/oauth2/authorize?client_id=${dropboxAppKey.trim()}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&token_access_type=offline`;
                                window.location.href = url;
                              }}
                              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg text-[10px] hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              🔗 ล็อคอินและลงทะเบียนสิทธิ์กับ Dropbox
                            </button>
                            
                            <p className="text-[9px] text-slate-500 leading-normal font-sans">
                              * หมายเหตุ: ต้องเพิ่ม <code className="font-mono text-slate-400">http://localhost:5173</code> ใน Redirect URIs ของแอปคุณบน Dropbox App Console ก่อนใช้งานระบบนี้
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Named API Key Profiles Manager Section */}
            <div 
              className="mt-8 p-6 space-y-6 border"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                borderColor: 'var(--border-glass)',
                borderRadius: '16px',
                backdropFilter: 'blur(12px)'
              }}
            >
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-glass)' }}>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-wide uppercase">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    ระบบจัดการโปรไฟล์ API Keys (Named Key Profiles Manager)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ตั้งค่าและจัดเก็บ API Key หลายบัญชีแยกตามชื่อโปรไฟล์ของคุณ สำหรับเรียกใช้งานเป็นตัวเลือก Dropdown ในฟังก์ชันต่างๆ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Add New Profile Form */}
                <form onSubmit={handleAddProfile} className="space-y-4 p-5 rounded-xl border bg-slate-950/40" style={{ borderColor: 'var(--border-glass)' }}>
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> เพิ่มโปรไฟล์ใหม่
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">ประเภทบริการ (Service)</label>
                      <select
                        value={newService}
                        onChange={e => setNewService(e.target.value)}
                        className="glass-input cursor-pointer text-slate-300"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                      >
                        {KEY_REGISTRY.map(item => (
                          <option key={item.id} value={item.id} className="bg-slate-955 text-white">
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">ชื่อโปรไฟล์ (Profile Name)</label>
                      <input
                        type="text"
                        placeholder="เช่น บัญชีหลัก, สต๊าฟ, คีย์สำรอง..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="glass-input font-sans text-white"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">รหัสกุญแจ / โทเคน (API Key / Token)</label>
                      <div className="relative">
                        <input
                          type={showNewKey ? 'text' : 'password'}
                          placeholder="กรอก API Key หรือ Token ที่นี่..."
                          value={newKey}
                          onChange={e => setNewKey(e.target.value)}
                          className="glass-input font-mono pr-10 text-white"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewKey(!showNewKey)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
                          style={{ border: 'none', background: 'transparent' }}
                        >
                          {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full btn-neon btn-neon-cyan font-bold py-2.5 mt-2 flex justify-center items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>บันทึกโปรไฟล์กุญแจ</span>
                    </button>
                  </div>
                </form>

                {/* 2. Profiles List Table/Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-slate-500" /> โปรไฟล์คีย์ที่บันทึกไว้ในระบบ ({profiles.length})
                  </h4>

                  {profiles.length === 0 ? (
                    <div 
                      className="p-8 border rounded-xl text-center text-xs text-slate-500"
                      style={{ borderColor: 'var(--border-glass)', backgroundColor: 'rgba(0,0,0,0.1)' }}
                    >
                      ยังไม่มีโปรไฟล์กุญแจบันทึกไว้ คุณสามารถเพิ่มโปรไฟล์แรกได้โดยใช้ฟอร์มซ้ายมือครับ
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar border rounded-xl" style={{ borderColor: 'var(--border-glass)' }}>
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-850">
                          <tr>
                            <th className="p-3">บริการ</th>
                            <th className="p-3">ชื่อโปรไฟล์</th>
                            <th className="p-3">รหัสกุญแจ (Truncated)</th>
                            <th className="p-3 text-center">เปิดใช้งาน</th>
                            <th className="p-3 text-center">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900/10">
                          {profiles.map((prof: any) => {
                            const serviceMeta = KEY_REGISTRY.find(k => k.id === prof.service_name);
                            const maskedKey = prof.credential_key
                              ? `${prof.credential_key.substring(0, 8)}...${prof.credential_key.substring(prof.credential_key.length - 6)}`
                              : 'Invalid key';
                            
                            return (
                              <tr key={prof.id} className="hover:bg-slate-950/30 transition-colors">
                                <td className="p-3 font-medium">
                                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                    {serviceMeta?.name.split(' ')[0] || prof.service_name}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold text-white font-sans">{prof.key_name}</td>
                                <td className="p-3 font-mono text-slate-400 text-[11px]">{maskedKey}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleToggleProfile(prof.id)}
                                    className="cursor-pointer bg-transparent border-none p-0 inline-flex items-center justify-center transition-opacity hover:opacity-80"
                                    title={prof.is_active === 1 ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                                    style={{ border: 'none', background: 'transparent' }}
                                  >
                                    <span 
                                      className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                                        prof.is_active === 1 
                                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                          : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                      }`}
                                    >
                                      {prof.is_active === 1 ? 'Active' : 'Disabled'}
                                    </span>
                                  </button>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteProfile(prof.id)}
                                    className="text-red-500 hover:text-red-400 cursor-pointer bg-transparent border-none p-1.5 rounded transition-colors inline-flex items-center justify-center hover:bg-red-500/10"
                                    title="ลบโปรไฟล์คีย์นี้"
                                    style={{ border: 'none', background: 'transparent' }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Utility */}
            <div 
              className="flex items-center justify-between pt-4 text-xs font-mono"
              style={{ borderTop: '1px solid var(--border-glass)' }}
            >
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                style={{ background: 'transparent', border: 'none' }}
              >
                <Database className="w-4 h-4 text-slate-500" />
                <span>{showAdvanced ? '[-] ซ่อนข้อมูลระบบชั้นสูง' : '[+] แสดงโปรไฟล์ชั้นสูง & จัดการระบบ'}</span>
              </button>

              <button
                onClick={handleClearLocalStorage}
                className="text-rose-500 hover:text-red-400 font-bold hover:underline cursor-pointer"
                style={{ background: 'transparent', border: 'none' }}
              >
                🧹 ล้างข้อมูลกุญแจบน Browser เครื่องนี้
              </button>
            </div>

            {/* Advanced Settings Drawer */}
            {showAdvanced && (
              <div 
                className="p-5 border text-xs font-mono space-y-3 leading-relaxed text-slate-400"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderColor: 'var(--border-glass)',
                  borderRadius: '8px',
                }}
              >
                <h5 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Database className="w-4 h-4 text-cyan-400" />
                  โปรไฟล์สภาพแวดล้อมหลังบ้าน (Backend Env Profile)
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div 
                    className="space-y-1 p-3 border"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '8px',
                    }}
                  >
                    <span className="text-slate-500 block">เส้นทางฐานข้อมูล SQLite:</span>
                    <span className="text-slate-200 break-all select-all font-bold">content_vault/databases/content_pool.db</span>
                  </div>
                  <div 
                    className="space-y-1 p-3 border"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '8px',
                    }}
                  >
                    <span className="text-slate-500 block">ปริมาณคีย์ที่เก็บใน Browser Local Storage:</span>
                    <span className="text-slate-200 font-bold">{(storageBytes / 1024).toFixed(3)} KB ({storageBytes} Bytes)</span>
                  </div>
                  <div 
                    className="space-y-1 p-3 border"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '8px',
                    }}
                  >
                    <span className="text-slate-500 block">ความปลอดภัยแบบ Git-Safe:</span>
                    <span className="text-slate-200">✓ เปิดใช้งาน (ฐานข้อมูล SQLite อยู่ในไฟล์ .gitignore ป้องกันการคอมมิต)</span>
                  </div>
                  <div 
                    className="space-y-1 p-3 border"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '8px',
                    }}
                  >
                    <span className="text-slate-500 block">เครื่องมือรันสคริปต์หลังบ้าน:</span>
                    <span className="text-slate-200">Python 3.x + sqlite3 module + Apify Client API</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUBTAB 2: FACEBOOK TOKENS PORTAL */}
      {activeSubTab === 'facebook' && (
        <div className="space-y-6">
          
          {/* Card A: Facebook User Token Input */}
          <div 
            className="p-6 border space-y-4 transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-glass)',
              borderColor: 'var(--border-glass)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            }}
          >
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
              🔑 Facebook User Access Token (กุญแจตัวแม่สำหรับสกัดสิทธิ์เพจ)
            </h4>
            <p className="text-xs text-slate-400 leading-normal font-sans">
              ใช้สำหรับการเรียกดูเพจทั้งหมดที่คุณเป็นผู้ดูแลระบบ เพื่อหยิบเอาโทเคนเพจแบบกึ่งถาวร (Long-Lived Page Tokens) มาเก็บไว้ในระบบเพื่อนำส่งไฟล์อัตโนมัติ (Long-Lived Page Tokens) มาเก็บไว้ในระบบเพื่อนำส่งไฟล์อัตโนมัติ
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <input
                  type={showFbToken ? 'text' : 'password'}
                  value={fbUserToken}
                  onChange={e => setFbUserToken(e.target.value)}
                  placeholder="EAAW..."
                  className="w-full glass-input"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowFbToken(!showFbToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
                >
                  {showFbToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveFbUserToken}
                  className="px-4 py-2 font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 border cursor-pointer"
                  style={{
                    backgroundColor: fbUserSaved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(37, 99, 235, 0.15)',
                    borderColor: fbUserSaved ? 'rgba(34, 197, 94, 0.2)' : 'var(--accent-cyan)',
                    color: fbUserSaved ? '#22c55e' : 'var(--accent-cyan)',
                    borderRadius: '8px',
                  }}
                >
                  {fbUserSaved ? <Check className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
                  <span>{fbUserSaved ? 'บันทึกแล้ว' : 'บันทึก Token'}</span>
                </button>

                <button
                  onClick={fetchFacebookPages}
                  disabled={loadingPages}
                  className="px-4 py-2 font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 border cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.3)',
                    borderColor: 'var(--accent-cyan)',
                    borderRadius: '8px',
                  }}
                >
                  {loadingPages ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>{loadingPages ? 'กำลังค้นหา...' : 'ค้นหาเพจ'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-black/40 border border-white/5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Facebook App ID (สำหรับแปลงเป็น Token ตลอดชีพ)
                </label>
                <input
                  type="text"
                  value={fbAppId}
                  onChange={e => {
                    setFbAppId(e.target.value);
                    localStorage.setItem('fb_app_id', e.target.value);
                  }}
                  placeholder="เช่น 145634995501895"
                  className="w-full glass-input text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Facebook App Secret (สำหรับแปลงเป็น Token ตลอดชีพ)
                </label>
                <input
                  type="password"
                  value={fbAppSecret}
                  onChange={e => {
                    setFbAppSecret(e.target.value);
                    localStorage.setItem('fb_app_secret', e.target.value);
                  }}
                  placeholder="App Secret ของคุณ"
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Card B: Quick Tutorial */}
          <div 
            className="p-6 border space-y-4 transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-glass)',
              borderColor: 'var(--border-glass)',
              borderRadius: '12px',
            }}
          >
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
              ℹ️ วิธีดึงรหัสโทเคนเพจเฟซบุ๊ก (Facebook Page Access Token) ใน 3 ขั้นตอน
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-400 font-sans">
              <div className="p-3 rounded-md bg-black/35 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-white block">1. ไปที่ Facebook Developers</div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  สร้างแอปประเภทธุรกิจในบัญชีนักพัฒนาของคุณ จากนั้นเข้าไปที่เครื่องมือ Graph API Explorer เพื่อเตรียมสิทธิในการเข้าถึงข้อมูล
                </p>
              </div>
              <div className="p-3 rounded-md bg-black/35 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-white block">2. เลือกสิทธิ์การเข้าถึง (Permissions)</div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  เพิ่มสิทธิ์ <code className="text-cyan-300 font-mono">pages_show_list</code>, <code className="text-cyan-300 font-mono">pages_read_engagement</code>, และ <code className="text-cyan-300 font-mono">pages_manage_posts</code> แล้วกดยืนยันเพื่อขอโทเคนผู้ใช้งาน
                </p>
              </div>
              <div className="p-3 rounded-md bg-black/35 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-white block">3. วางรหัสและสกัดคีย์</div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  คัดลอกรหัสโทเคนผู้ใช้งานมาใส่ในกล่องค้นหาด้านบนของหน้านี้ กดดึงข้อมูล แล้วระบบจะสกัดคีย์แยกรายเพจให้เซฟลงเครื่องได้อย่างปลอดภัยครับ
                </p>
              </div>
            </div>
          </div>

          {/* Card C: Main accounts registry grid */}
          <div 
            className="p-6 border space-y-6 transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-glass)',
              borderColor: 'var(--border-glass)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            }}
          >
            <div 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4"
              style={{ borderBottom: '1px solid var(--border-glass)' }}
            >
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  👥 รายชื่อเพจเฟซบุ๊กที่ตรวจจับได้จากสิทธิ์ของคุณ
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  กดปุ่มบันทึกลงเครื่องในแต่ละแถวเพจที่ต้องการ เพื่อให้โปรแกรมสามารถนำโทเคนเพจนั้นไปใช้ในการสร้างและโพสแบบอัตโนมัติ
                </p>
              </div>
              
              {fbPages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={downloadPageTokensAsJson}
                    className="px-4 py-2 font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 border cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      borderColor: 'rgba(6, 182, 212, 0.2)',
                      color: 'var(--accent-cyan)',
                      borderRadius: '8px',
                    }}
                  >
                    <span>📥 ดาวน์โหลด JSON</span>
                  </button>

                  <button
                    onClick={saveAllPageTokens}
                    className="px-4 py-2 font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 border cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22c55e',
                      borderRadius: '8px',
                    }}
                  >
                    <span>💾 บันทึกเพจทั้งหมด ({fbPages.length})</span>
                  </button>
                </div>
              )}
            </div>

            {fetchError && (
              <div 
                className="p-4 border text-xs text-[#EF4444] leading-relaxed font-mono"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                }}
              >
                {fetchError}
              </div>
            )}

            {fbPages.length > 0 ? (
              <div className="overflow-x-auto w-full" style={{ borderRadius: '0px' }}>
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <th className="py-2.5 px-4 text-left font-bold rounded-none w-40 text-slate-400">ชื่อเพจเฟซบุ๊ก</th>
                      <th className="py-2.5 px-4 text-left font-bold rounded-none w-40 text-slate-400">หมวดหมู่เพจ</th>
                      <th className="py-2.5 px-4 text-left font-bold rounded-none w-36 text-slate-400">เฟซบุ๊ก ID</th>
                      <th className="py-2.5 px-4 text-right font-bold rounded-none w-32 text-slate-400">ผู้ติดตาม</th>
                      <th className="py-2.5 px-4 text-right font-bold rounded-none w-64 text-slate-400">สิทธิ์ Access Token / การเซฟ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fbPages.map(page => {
                      const isSaved = !!savedPageTokens[page.id];
                      return (
                        <tr 
                          key={page.id} 
                          className="hover:bg-white/[0.02] transition-colors"
                          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                        >
                          <td className="py-3 px-4 text-white font-bold rounded-none">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="mr-0.5">📄</span>
                              <span>{page.name}</span>
                              {fbAppId.trim() !== '' && fbAppSecret.trim() !== '' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 leading-none">
                                  ♾️ ตลอดชีพ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 rounded-none">
                            {page.category || 'ไม่มีข้อมูลหมวดหมู่'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] rounded-none">
                            {page.id}
                          </td>
                          <td className="py-3 px-4 text-right text-xs font-bold text-zinc-300 rounded-none">
                            {page.followers_count !== undefined ? page.followers_count.toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-4 rounded-none">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCopyToClipboard(page.access_token, page.id)}
                                className="h-7 px-2.5 text-[10px] text-zinc-400 hover:text-white rounded flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                                style={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                  border: '1px solid var(--border-glass)',
                                }}
                                title="คัดลอกโทเคนสำหรับนักพัฒนาสำหรับใช้ภายนอกโปรแกรม"
                              >
                                <Clipboard className="w-3.5 h-3.5" />
                                <span>{copiedId === page.id ? 'COPIED!' : 'COPY TOKEN'}</span>
                              </button>
                              
                              <button
                                onClick={() => savePageTokenLocally(page.id, page.access_token)}
                                className="h-7 px-2.5 rounded text-[10px] font-black transition-all flex items-center justify-center gap-0.5 active:scale-95 border cursor-pointer"
                                style={{
                                  backgroundColor: isSaved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(37, 99, 235, 0.15)',
                                  borderColor: isSaved ? 'rgba(34, 197, 94, 0.2)' : 'var(--accent-cyan)',
                                  color: isSaved ? '#22c55e' : 'var(--accent-cyan)',
                                }}
                              >
                                <span>{isSaved ? '✓ SAVED' : '📥 SAVE KEY'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 italic font-sans">
                ไม่มีรายชื่อเพจเฟซบุ๊กที่ดึงเข้ามาในปัจจุบัน กรุณาป้อน User Token ด้านบนแล้วกดค้นหา
              </div>
            )}
          </div>

          {/* Card D: Local Registry View */}
          <div 
            className="p-6 border space-y-4 transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-glass)',
              borderColor: 'var(--border-glass)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            }}
          >
            <div 
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2"
              style={{ borderBottom: '1px solid var(--border-glass)' }}
            >
              <h5 className="text-xs font-bold text-zinc-300 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                👥 รายการกุญแจโทเคนเพจเฟซบุ๊กที่บันทึกแล้วใน Browser เครื่องนี้ ({Object.keys(savedPageTokens).length} รายการ)
              </h5>
              
              <div className="flex items-center gap-3">
                {Object.keys(savedPageTokens).length > 0 && (
                  <button
                    onClick={downloadSavedPageTokensAsJson}
                    className="h-7 px-3 text-[10px] font-bold font-mono transition-all flex items-center gap-1 active:scale-95 border cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      borderColor: 'rgba(6, 182, 212, 0.2)',
                      color: 'var(--accent-cyan)',
                      borderRadius: '6px',
                    }}
                  >
                    <span>📥 ดาวน์โหลด JSON ที่บันทึกไว้</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">🔒 Git-Safe Storage Active</span>
              </div>
            </div>

            {Object.keys(savedPageTokens).length === 0 ? (
              <p className="text-xs text-slate-500 italic font-sans">
                ไม่มีข้อมูลโทเคนเพจที่ถูกเก็บถาวรใน Browser ขณะนี้
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {Object.entries(savedPageTokens).map(([id, token]) => (
                  <div 
                    key={id} 
                    className="px-3 py-1.5 border flex items-center gap-3 text-xs font-mono shadow-sm"
                    style={{
                      backgroundColor: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      borderRadius: '8px',
                    }}
                  >
                    <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[150px]" title={`เพจ ID: ${id}`}>
                      🆔 {id.slice(0, 6)}...{id.slice(-4)}
                    </span>
                    
                    {!!lifetimePageIds[id] && (
                      <span className="px-1 py-0.5 rounded text-[8px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 leading-none">
                        ♾️ ตลอดชีพ
                      </span>
                    )}
                    
                    <span className="text-[9px] text-slate-500 select-none">
                      ••••••••••••••••
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyToClipboard(token, id)}
                        className="p-1 text-slate-500 hover:text-white rounded transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
                        title="คัดลอกรหัสโทเคนเพจเฟซบุ๊ก"
                        style={{ background: 'transparent', border: 'none' }}
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('คุณแน่ใจว่าต้องการลบโทเคนเพจนี้ออกจาก Browser เครื่องนี้?')) {
                            removeSavedToken(id);
                          }
                        }}
                        className="text-rose-500 hover:text-red-400 font-bold px-1 text-xs cursor-pointer bg-transparent border-none p-0"
                        title="ลบรหัสออกจากเครื่อง"
                        style={{ background: 'transparent', border: 'none' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

            {/* SUBTAB 3: DISPLAY SETTINGS (ZOOM SCALING) */}
      {activeSubTab === 'display' && (
        <div className="space-y-6 animate-fade-in">
          
          <div 
            className="p-6 border space-y-6 transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-glass)',
              borderColor: 'var(--border-glass)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            }}
          >
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
                🖥️ ปรับขนาดหน้าต่าง & ตัวอักษรการใช้งาน (Display Scale Setting)
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans pr-6">
                ระบบจะทำการขยายหรือย่อขนาดตัวอักษร ไอคอน ข้อมูลในตาราง ตลอดจนขนาดของปุ่มควบคุมคำสั่งทั้งหมดในโปรแกรมโดยอัตโนมัติ 
                ช่วยให้คุณอ่านเนื้อหา สแกนโพสต์คู่แข่ง และจัดแจง Canvas ได้อย่างมีประสิทธิภาพและสบายตาที่สุดครับ
              </p>
            </div>

            {/* Scale Selector Grid in Dark Theme Coinpulse */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              {[100, 115, 130, 145].map(scale => {
                let label = 'ขนาดปกติ';
                let scaleDesc = 'ขนาดมาตรฐานตั้งต้น ชัดเจน พอดีกับหน้าจอ';
                
                if (scale === 115) {
                  label = 'ขนาดใหญ่';
                  scaleDesc = 'ขยาย 15% ตัวหนังสือโตขึ้นอย่างพอเหมาะ';
                }
                if (scale === 130) {
                  label = 'ขนาด XL';
                  scaleDesc = 'ขยาย 30% ปุ่มและตารางดูเด่นชัด กดง่ายสบายตา';
                }
                if (scale === 145) {
                  label = 'ขนาดจัมโบ้';
                  scaleDesc = 'ขยายสูงสุด 45% ตัวหนังสือและปุ่มขนาดจัมโบ้ เหมาะกับจอขนาดใหญ่';
                }

                const isSelected = appScale === scale;
                return (
                  <button
                    key={scale}
                    onClick={() => setAppScale(scale)}
                    className="p-5 border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-95 text-xs font-mono font-bold"
                    style={{
                      height: '144px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-glass)',
                      borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-glass)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: isSelected ? 'var(--glow-cyan)' : 'none',
                      outline: 'none',
                    }}
                  >
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-xl font-bold">{scale}%</span>
                        {isSelected && (
                          <span 
                            className="h-5 px-2.5 border text-[9px] font-mono rounded-sm flex items-center justify-center font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: 'rgba(37, 99, 235, 0.1)',
                              borderColor: 'rgba(37, 99, 235, 0.4)',
                              color: 'var(--accent-cyan)',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white block mt-1">{label}</span>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 leading-normal font-sans mt-2">
                      {scaleDesc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Property Preview Info Box */}
            <div className="p-4 rounded-lg border border-[#27272A] bg-[#09090B] text-xs font-mono space-y-2 text-[#A1A1AA] leading-relaxed">
              <h5 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                ⚙️ ข้อมูลการจัดเก็บและการปรับสเกลของระบบ
              </h5>
              <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-500 font-sans">
                <li>การตั้งค่าสเกลนี้ถูกบันทึกแยกไว้ในเบราว์เซอร์เครื่องนี้อย่างปลอดภัยผ่านคีย์ <code className="text-zinc-300 font-mono">localStorage.getItem('app_scale')</code></li>
                <li>ใช้เทคนิคสเกลระดับหน่วยสัมพัทธ์ (REM Relative sizing scaling) ซึ่งช่วยขยายขนาดยูสเซอร์อินเตอร์เฟสพร้อมกันโดยไม่ลดความละเอียดของการเรนเดอร์ลง</li>
                <li>สเกลที่เลือกในแท็บนี้จะจดจำและถูกเรียกใช้โดยอัตโนมัติในทุกๆ หน้าจอของระบบ Content Factory</li>
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}