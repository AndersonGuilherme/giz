import { useTranslate } from '../../i18n.ts';

type Props = Readonly<{ ready: boolean; provider: string; onWrite: () => void; onGenerate: () => void }>;

/** The two ways on: write the script by hand, or let the text AI write a draft (its cost comes first). */
export function IdeaActions({ ready, provider, onWrite, onGenerate }: Props) {
  const translate = useTranslate();
  return (
    <section className="idea-actions">
      <button type="button" className="way" data-testid="write-myself" disabled={!ready} onClick={onWrite}>
        <strong>✎ {translate('idea.writeMyself')}</strong>
        <span>{translate('idea.writeMyselfDetail')}</span>
      </button>
      <button type="button" className="way ai" data-testid="generate-ai" disabled={!ready} onClick={onGenerate}>
        <strong>✦ {translate('idea.generate')}</strong>
        <span>{translate('idea.generateDetail', { provider })}</span>
      </button>
      {!ready && <p className="muted small">{translate('idea.fillFirst')}</p>}
    </section>
  );
}
