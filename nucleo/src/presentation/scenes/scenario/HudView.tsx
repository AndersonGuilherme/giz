import type { CSSProperties, FC } from 'react';
import type { Rectangle } from '../../../domain/layout/Box.ts';
import { HudLayout, type HudBar, type HudText } from '../../../domain/scenario/HudLayout.ts';
import type { Hud } from '../../../domain/script/SceneElements.ts';
import type { AspectRatio } from '../../../domain/values/AspectRatio.ts';
import { TEXT_FONT } from '../fonts.ts';

// A dark parchment panel with cream letters and a green bar, like a chronicle's status line.
const COLORS = { panel: 'rgba(24, 16, 11, 0.72)', border: 'rgba(240, 214, 160, 0.35)', text: '#f6e7c8', label: '#d8c39b', track: 'rgba(255, 240, 210, 0.16)', fill: '#8fcf6a' };

const placed = (rectangle: Rectangle): CSSProperties => ({ position: 'absolute', left: rectangle.x, top: rectangle.y, width: rectangle.width, height: rectangle.height });

const Text: FC<Readonly<{ text: HudText; color: string; align?: 'left' | 'right' }>> = ({ text, color, align = 'left' }) => (
  <div style={{ ...placed(text.rectangle), fontFamily: TEXT_FONT, fontWeight: 800, fontSize: text.fit.size, lineHeight: text.font.lineHeight(), color, textAlign: align, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
    {text.fit.lines[0]}
  </div>
);

const Bar: FC<Readonly<{ bar: HudBar }>> = ({ bar }) => (
  <>
    <Text text={bar.label} color={COLORS.label} />
    <div style={{ ...placed(bar.track), background: COLORS.track, borderRadius: bar.track.height / 2 }} />
    <div style={{ ...placed(bar.fill), background: `linear-gradient(90deg, #5fae4a, ${COLORS.fill})`, borderRadius: bar.track.height / 2 }} />
    <div style={{ ...placed(bar.percentArea), display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', fontFamily: TEXT_FONT, fontWeight: 900, fontSize: bar.label.fit.size * 1.15, color: COLORS.text }}>
      {bar.percent}
    </div>
  </>
);

/** The HUD in the top left corner of the safe area: fields on one line and the optional progress bar. */
export const HudView: FC<Readonly<{ hud: Hud; aspect: AspectRatio }>> = ({ hud, aspect }) => {
  const layout = HudLayout.for(hud, aspect);
  return (
    <>
      <div style={{ ...placed(layout.panel), background: COLORS.panel, border: `2px solid ${COLORS.border}`, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }} />
      <Text text={layout.fields} color={COLORS.text} />
      {layout.bar && <Bar bar={layout.bar} />}
    </>
  );
};
