import type { CastMember } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { ConfirmDialog } from '../common/ConfirmDialog.tsx';

type Props = Readonly<{ member: CastMember; onConfirm: () => void; onCancel: () => void }>;

/** Takes a character out of the project's cast (its file stays in cast/); one who still says lines is told why it cannot go. */
export function RemoveMemberDialog({ member, onConfirm, onCancel }: Props) {
  const translate = useTranslate();
  const { id, name } = member.file;
  return (
    <ConfirmDialog title={translate('cast.removeTitle', { name })} confirm={translate('cast.removeConfirm')} danger onConfirm={onConfirm} onCancel={onCancel}>
      <p>{translate('cast.removeHint', { file: `cast/${id}.json` })}</p>
      {member.lines > 0 && <p className="warning-text" data-testid="remove-still-speaks">{translate('cast.stillSpeaks', { id: name, count: member.lines })}</p>}
    </ConfirmDialog>
  );
}
