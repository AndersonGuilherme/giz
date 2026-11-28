import { test } from 'node:test';
import assert from 'node:assert/strict';
import { secondLaunch } from '../../src/main/secondLaunch.ts';

function fakeWindow(minimized = false) {
  const calls: string[] = [];
  return {
    calls,
    window: { isMinimized: () => minimized, restore: () => void calls.push('restore'), focus: () => void calls.push('focus'), isDestroyed: () => false },
  };
}

function steps(window?: ReturnType<typeof fakeWindow>['window']) {
  const done: string[] = [];
  const handle = secondLaunch({
    window: () => window,
    open: () => void done.push('open'),
    relaunch: (folder) => void done.push(`relaunch ${folder}`),
  });
  return { done, handle };
}

test('a second launch brings the window back (restored when minimized, focused) and opens nothing new', () => {
  const { window, calls } = fakeWindow(true);
  const { done, handle } = steps(window);
  handle(['gizzycera'], '/home/ana');
  assert.deepEqual(calls, ['restore', 'focus']);
  assert.deepEqual(done, []);
});

test('with --project= the folder (read from where it was launched) is handed over to be granted and opened', () => {
  const { window, calls } = fakeWindow();
  const { done, handle } = steps(window);
  handle(['gizzycera', '--project=cupom'], '/home/ana/Gizzycera');
  assert.deepEqual(calls, ['focus']);
  assert.deepEqual(done, ['relaunch /home/ana/Gizzycera/cupom']);
});

test('with no window left (macOS keeps the app running), a second launch opens one', () => {
  const { done, handle } = steps(undefined);
  handle(['gizzycera', '--project=/p/x'], '/');
  assert.deepEqual(done, ['relaunch /p/x', 'open']);
});
