import { RigStill } from 'giz-core/src/presentation/studio/index.ts';
import type { CastCatalog, CastDocument, CastMember } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { parametersOf } from '../../cast/characterDraft.ts';

type Props = Readonly<{ document: CastDocument; catalog: CastCatalog; selected: string; select: (id: string) => void }>;

/** A character's face: its rig drawn small (the narrator, a voice without a body, shows a microphone mark). */
export function Face({ member, catalog, size = 120 }: Readonly<{ member: Pick<CastMember, 'file'>; catalog: CastCatalog; size?: number }>) {
  const rig = catalog.rigs.find(({ id }) => id === member.file.rig);
  if (!rig) return <span className="cast-face voice" aria-hidden="true">♪</span>;
  return <span className="cast-face" aria-hidden="true"><RigStill id={member.file.id} rig={rig.id} parameters={parametersOf(member.file, rig)} height={size} expression={member.file.defaultExpression as never} /></span>;
}

function Member({ member, catalog, chosen, select }: Readonly<{ member: CastMember; catalog: CastCatalog; chosen: boolean; select: () => void }>) {
  const translate = useTranslate();
  return (
    <li>
      <button type="button" className={`cast-member${chosen ? ' on' : ''}`} aria-pressed={chosen} data-testid={`member-${member.file.id}`} onClick={select}>
        <Face member={member} catalog={catalog} />
        <span className="member-text">
          <strong>{member.file.name}</strong>
          <span className="muted small">{member.file.rig ? translate('cast.lines', { count: member.lines }) : translate('cast.narrator')}</span>
          {member.problem && <span className="warning-text small">{member.problem}</span>}
        </span>
      </button>
    </li>
  );
}

/** The project's characters, each with its face and how many lines it says. */
export function CastList({ document, catalog, selected, select }: Props) {
  return (
    <ul className="cast-list" data-testid="cast-list">
      {document.members.map((member) => <Member key={member.file.id} member={member} catalog={catalog} chosen={member.file.id === selected} select={() => select(member.file.id)} />)}
    </ul>
  );
}
