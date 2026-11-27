import { useCallback, useEffect, useReducer } from 'react';
import type { Aspect } from '../../../shared/contract.ts';
import { renderProject } from '../../state/actions.ts';
import { INITIAL_STATE, reduce } from '../../state/studioState.ts';
import { FailurePanel } from '../FailurePanel.tsx';
import { RenderPanel } from '../RenderPanel.tsx';
import { useEditorTools } from './EditorContext.ts';

/** The render of the project as it is on disk, in its own aspect (blocked while the check has errors). */
export function RenderBox() {
  const { api, document, errors } = useEditorTools();
  const [state, dispatch] = useReducer(reduce, INITIAL_STATE);
  useEffect(() => api.video.onProgress(({ fraction }) => dispatch({ type: 'render-progress', fraction })), [api]);
  const render = useCallback(() => void renderProject(api, dispatch, { folder: document.folder, aspect: document.aspect as Aspect }), [api, document]);
  const cancel = useCallback(() => void api.video.cancel(), [api]);
  return (
    <>
      {state.failure && <FailurePanel failure={state.failure} />}
      <RenderPanel render={state.render} blocked={errors.length > 0} onRender={render} onCancel={cancel} />
    </>
  );
}
