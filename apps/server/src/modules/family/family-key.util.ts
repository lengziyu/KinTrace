import { pinyin } from 'pinyin-pro';

const FAMILY_SUFFIX_PATTERN = /(宗亲|家族|氏族|宗族|祠堂|祖祠)$/g;

function sanitizeAscii(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function buildFamilyKeyBase(name: string) {
  const normalizedName = name.replace(/\s+/g, '').replace(FAMILY_SUFFIX_PATTERN, '') || name;
  const transliterated = pinyin(normalizedName, {
    toneType: 'none',
    type: 'array',
  })
    .join('')
    .toLowerCase();

  const sanitized = sanitizeAscii(transliterated) || sanitizeAscii(name) || 'family';
  return sanitized.slice(0, 18);
}

export function generateThreeDigitSuffix() {
  while (true) {
    const value = Math.floor(100 + Math.random() * 900);
    const text = String(value);
    const [a, b, c] = text;

    if (a === b && b === c) {
      continue;
    }

    return text;
  }
}
