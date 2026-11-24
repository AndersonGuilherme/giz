// The small dense math of the Qwen pipeline that runs outside ONNX: linear layers and vector sums, accumulated in the
// same order as the motor (start from the bias, add the products in index order), so the audio is the same.
export type LinearLayer = Readonly<{ weights: Float32Array; bias: Float32Array; outputs: number }>;

function dot(layer: LinearLayer, output: number, input: ArrayLike<number>): number {
  const row = output * input.length;
  let sum = layer.bias[output];
  for (let index = 0; index < input.length; index++) sum += layer.weights[row + index] * input[index];
  return sum;
}

/** y = W·x + b. */
export function linear(layer: LinearLayer, input: ArrayLike<number>): Float32Array {
  const output = new Float32Array(layer.outputs);
  for (let index = 0; index < layer.outputs; index++) output[index] = dot(layer, index, input);
  return output;
}

/** y = silu(W·x + b), the activation of the text projection. */
export function linearSilu(layer: LinearLayer, input: ArrayLike<number>): Float32Array {
  const output = new Float32Array(layer.outputs);
  for (let index = 0; index < layer.outputs; index++) {
    const value = dot(layer, index, input);
    output[index] = value / (1 + Math.exp(-value));
  }
  return output;
}

/** Adds `vector` into `target`, element by element. */
export function addInto(target: Float32Array, vector: ArrayLike<number>): Float32Array {
  for (let index = 0; index < target.length; index++) target[index] += vector[index];
  return target;
}

/** The element-wise sum of the vectors, as a new float32 vector. */
export function sum(...vectors: ArrayLike<number>[]): Float32Array {
  return vectors.reduce<Float32Array>((total, vector) => addInto(total, vector), new Float32Array(vectors[0].length));
}
