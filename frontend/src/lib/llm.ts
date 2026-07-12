// Central AI text-provider switch: OpenRouter หรือ Kie.ai
// เลือกได้จากหน้า Settings (เก็บใน localStorage 'llm_provider') แล้วทุกส่วนของโปรแกรมใช้ร่วมกัน

import { useEffect, useState } from 'react';

export type LlmProvider = 'openrouter' | 'kie';

const PROVIDER_CHANGED_EVENT = 'llm-provider-changed';

const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

export const LLM_PROVIDER_LABELS: Record<LlmProvider, string> = {
  openrouter: 'OpenRouter',
  kie: 'Kie.ai'
};

export const getLlmProvider = (): LlmProvider =>
  localStorage.getItem('llm_provider') === 'kie' ? 'kie' : 'openrouter';

export const setLlmProvider = (provider: LlmProvider) => {
  localStorage.setItem('llm_provider', provider);
  // แจ้งทุก component ที่ mount ค้างอยู่ (keep-alive) ให้อัพเดตป้าย/สถานะทันที
  window.dispatchEvent(new Event(PROVIDER_CHANGED_EVENT));
};

// Hook สำหรับ component ที่ต้องแสดงชื่อ/สถานะ provider แบบสด — อัพเดตทันทีเมื่อเปลี่ยนในหน้า Settings
export function useLlmProvider(): LlmProvider {
  const [provider, setProvider] = useState<LlmProvider>(() => getLlmProvider());
  useEffect(() => {
    const sync = () => setProvider(getLlmProvider());
    window.addEventListener(PROVIDER_CHANGED_EVENT, sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener(PROVIDER_CHANGED_EVENT, sync);
      window.removeEventListener('focus', sync);
    };
  }, []);
  return provider;
}

export const getOpenRouterKey = (): string =>
  (localStorage.getItem('openrouter_key') || '').trim();

export const getKieKey = (): string =>
  (localStorage.getItem('kie_key') || localStorage.getItem('kie_api_key') || '').trim();

// คีย์ของ provider ที่เลือกไว้ — ใช้ส่งให้ backend ที่ต้องเรียก AI แทน frontend
export const getLlmKey = (provider: LlmProvider = getLlmProvider()): string =>
  provider === 'kie' ? getKieKey() : getOpenRouterKey();

export const getLlmProviderLabel = (): string => LLM_PROVIDER_LABELS[getLlmProvider()];

export const missingLlmKeyMessage = (): string =>
  `ไม่พบ ${getLlmProviderLabel()} API Key กรุณาตั้งค่าในหน้า Settings ก่อน`;

// Kie.ai ใช้ endpoint แยกตามโมเดลและไม่มี vendor prefix เช่น
// OpenRouter 'google/gemini-2.5-flash' -> Kie 'gemini-2.5-flash'
export const toKieModel = (model: string): string =>
  model.includes('/') ? model.split('/').pop()! : model;

export interface ChatCompletionOptions {
  // override คีย์เฉพาะกรณีที่หน้านั้นให้ผู้ใช้กรอกคีย์เอง
  openRouterKey?: string;
  kieKey?: string;
  signal?: AbortSignal;
}

// ใช้แทน fetch('https://openrouter.ai/api/v1/chat/completions', ...) ทุกจุด
// ทั้งสอง provider ตอบกลับรูปแบบ OpenAI (data.choices[0].message.content) เหมือนกัน
// ฝั่ง Kie.ai วิ่งผ่าน backend proxy (/api/kie-chat) เพื่อเลี่ยงปัญหา CORS
export async function chatCompletions(
  payload: Record<string, any>,
  opts: ChatCompletionOptions = {}
): Promise<Response> {
  const provider = getLlmProvider();

  if (provider === 'kie') {
    const apiKey = (opts.kieKey || getKieKey());
    const model = toKieModel(String(payload.model || 'gemini-2.5-flash'));
    return fetch(`${BACKEND_BASE}/api/kie-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model, payload: { ...payload, model } }),
      signal: opts.signal
    });
  }

  const apiKey = (opts.openRouterKey || getOpenRouterKey());
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal: opts.signal
  });
}
