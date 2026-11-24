import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isQwenVoice, modelFolder, QWEN_MODELS, QWEN_VOICES, repositoryOf } from '../../../../src/infrastructure/voice/qwen/qwenModels.ts';

test('the nine Qwen voices, and only them', () => {
  assert.deepEqual([...QWEN_VOICES], ['serena', 'vivian', 'uncle_fu', 'ryan', 'aiden', 'ono_anna', 'sohee', 'eric', 'dylan']);
  assert.equal(isQwenVoice('vivian'), true);
  assert.equal(isQwenVoice('Vivian'), false);
  assert.equal(isQwenVoice('roberto'), false);
});

test('each model has its Hugging Face export; QWEN_TTS_REPO points to another one', () => {
  assert.equal(repositoryOf('0.6b', {}), 'elbruno/Qwen3-TTS-12Hz-0.6B-CustomVoice-ONNX');
  assert.equal(repositoryOf('1.7b', {}), 'elbruno/Qwen3-TTS-12Hz-1.7B-CustomVoice-ONNX');
  assert.equal(repositoryOf('1.7b', { QWEN_TTS_REPO: 'eu/outro' }), 'eu/outro');
  assert.equal(QWEN_MODELS['1.7b'].instruct, true);
});

test('a downloaded model lives in <modelsDir>/<owner>__<name>, the motor layout (existing downloads are reused)', () => {
  assert.equal(modelFolder('elbruno/Qwen3-TTS-12Hz-0.6B-CustomVoice-ONNX', '/m'), '/m/elbruno__Qwen3-TTS-12Hz-0.6B-CustomVoice-ONNX');
});
