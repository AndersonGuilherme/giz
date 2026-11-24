// Roda a mesma caracterização em cada passo da refatoração.
// Um passo só:  STEP=1 node --test characterization.test.ts      Todos: node --test characterization.test.ts
import { characterize } from './characterization.ts';
import { OrderService as Step0 } from './order-service.step0.ts';
import { OrderService as Step1 } from './order-service.step1.ts';
import { OrderService as Step2 } from './order-service.step2.ts';
import { OrderService as Step3 } from './order-service.step3.ts';

const steps = [Step0, Step1, Step2, Step3];
const only = process.env.STEP;

steps.forEach((Service, i) => {
  if (only === undefined || only === String(i)) characterize(`passo ${i}`, Service);
});
