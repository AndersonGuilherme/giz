import type { Portraits } from '../../../shared/projects.ts';

// The picker shows each square at half its drawn size (sharp on a doubled screen).
const SHOWN = 0.5;

type Props = Readonly<{ id: string; name: string; portraits: Portraits | null }>;

/** A ready character's face, cut from the one picture of all portraits; its initial while the picture is not there. */
export function Portrait({ id, name, portraits }: Props) {
  const index = portraits?.ids.indexOf(id) ?? -1;
  if (!portraits || index < 0) return <span className="portrait initial" aria-hidden="true">{name.slice(0, 1)}</span>;
  const size = portraits.cell * SHOWN;
  const style = {
    backgroundImage: `url(${portraits.image})`,
    backgroundSize: `${portraits.columns * size}px auto`,
    backgroundPosition: `${-(index % portraits.columns) * size}px ${-Math.floor(index / portraits.columns) * size}px`,
    width: size,
    height: size,
  };
  return <span className="portrait" style={style} aria-hidden="true" />;
}
