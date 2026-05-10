import { parentPort } from 'worker_threads';

// Worker thread stub — ready for business logic (e.g. file hashing, sync ops)
parentPort?.on('message', (msg) => {
  parentPort?.postMessage({ status: 'ok', echo: msg });
});
