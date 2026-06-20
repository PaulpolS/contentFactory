import React, { useState, useEffect } from 'react';

interface NumInputProps {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

// input ตัวเลขที่ลบค่าทิ้งเพื่อพิมพ์ใหม่ได้ (ไม่เด้งกลับเป็น 0 ระหว่างพิมพ์)
export const NumInput: React.FC<NumInputProps> = ({
  label, value, onChange, step = 1, min, max, disabled, readOnly, className = '',
}) => {
  const [text, setText] = useState(String(value));

  // sync จากภายนอกเมื่อ value เปลี่ยน (เช่น template เปลี่ยนค่า)
  useEffect(() => { setText(String(value)); }, [value]);

  const commit = (raw: string) => {
    if (raw === '' || raw === '-' || raw === '.') return; // ปล่อยให้พิมพ์ต่อ
    let n = parseFloat(raw);
    if (!Number.isFinite(n)) return;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    onChange(n);
  };

  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium text-zinc-400">{label}</span>}
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        readOnly={readOnly}
        value={text}
        onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
        onBlur={() => setText(String(value))}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 disabled:opacity-50"
      />
    </label>
  );
};

export default NumInput;
