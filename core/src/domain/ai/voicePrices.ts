import type { VoiceProviderName } from '../project/Project.ts';
import { CostEstimate } from './CostEstimate.ts';

/** What one text costs with one voice model. */
type VoicePrice = (text: string) => CostEstimate;
type PriceList = Readonly<Record<string, VoicePrice>>;

const MILLION = 1_000_000;
const FREE: VoicePrice = () => CostEstimate.ZERO;

// The UTF-8 size of a code point: 1 byte up to U+007F, 2 up to U+07FF, 3 up to U+FFFF, 4 beyond.
const UTF8_LIMITS = [0x7f, 0x7ff, 0xffff];
const bytesOf = (codePoint: number): number => 1 + UTF8_LIMITS.filter((limit) => codePoint > limit).length;
const utf8Bytes = (text: string): number => [...text].reduce((total, symbol) => total + bytesOf(symbol.codePointAt(0)!), 0);

// ElevenLabs counts characters (code points, not UTF-16 units); Fish counts the UTF-8 bytes of the text.
const perMillionCharacters = (dollars: number): VoicePrice => (text) => CostEstimate.ofDollars(([...text].length * dollars) / MILLION);
const perMillionBytes = (dollars: number): VoicePrice => (text) => CostEstimate.ofDollars((utf8Bytes(text) * dollars) / MILLION);

// Prices in US$, checked on 2026-11-27: elevenlabs.io/pricing/api (per 1K characters, "the same on every plan") and
// docs.fish.audio pricing-and-rate-limits (per million UTF-8 bytes). A model missing here has an unknown cost.
const VOICE_PRICES: Readonly<Record<VoiceProviderName, PriceList | VoicePrice>> = {
  qwen: FREE,
  recording: FREE,
  elevenlabs: {
    eleven_v4: perMillionCharacters(80),
    eleven_v4_turbo: perMillionCharacters(40),
    eleven_v3: perMillionCharacters(80),
    eleven_v3_conversational: perMillionCharacters(40),
    eleven_multilingual_v2: perMillionCharacters(80),
    eleven_flash_v2_5: perMillionCharacters(40),
    eleven_flash_v2: perMillionCharacters(40),
    eleven_turbo_v2_5: perMillionCharacters(40),
    eleven_turbo_v2: perMillionCharacters(40),
  },
  fish: {
    // drama-3 has a promotional US$ 10 until 2026-11-30; the list price is the upper bound.
    'drama-3': perMillionBytes(50),
    's2.1-pro': perMillionBytes(15),
    's2.1-pro-free': FREE,
    's2-pro': perMillionBytes(15),
    s1: perMillionBytes(15),
  },
};

function priceOf(provider: VoiceProviderName, model: string | undefined): VoicePrice | undefined {
  const prices = VOICE_PRICES[provider];
  if (typeof prices === 'function') return prices;
  return model !== undefined && Object.hasOwn(prices, model) ? prices[model] : undefined;
}

/** What saying the text costs with the voice (the local voice and own recordings are free); unknown off the table. */
export function voiceCostEstimate(provider: VoiceProviderName, model: string | undefined, text: string): CostEstimate {
  const price = priceOf(provider, model);
  return price ? price(text) : CostEstimate.UNKNOWN;
}
