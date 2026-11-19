import { loadFont as loadSans } from '@remotion/google-fonts/Nunito';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

// Fontes OFL (uso comercial livre).
const sans = loadSans('normal', { weights: ['500', '600', '700', '800', '900'], subsets: ['latin', 'latin-ext'] });
const mono = loadMono('normal', { weights: ['500', '600', '800'], subsets: ['latin', 'latin-ext'] });

export const fonts = { sans: `${sans.fontFamily}, sans-serif`, mono: `${mono.fontFamily}, monospace` };

export const THEME = {
  bg: 'linear-gradient(150deg, #F7F1FF 0%, #FBEFFF 55%, #FFF4FB 100%)',
  gradient: 'linear-gradient(100deg, #E817DF 0%, #7B2FF2 100%)',
  brand: '#7B2FF2',
  magenta: '#E817DF',
  ink: '#1D1530',
  muted: '#6B6280',
  line: '#E6DEFA',
  card: '#FFFFFF',
  ok: '#16A34A',
  danger: '#E5484D',
  shadow: '0 24px 60px rgba(61, 20, 140, .14)',
  code: {
    bg: '#1B1530', bar: '#251D40', text: '#E8E2FF', comment: '#7F75A3', string: '#A5E3A0',
    number: '#FFB86C', keyword: '#FF79C6', type: '#8BE9FD', fn: '#C9A7FF', lineNo: '#5E5582',
  },
};
