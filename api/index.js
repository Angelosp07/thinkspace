import worker from '../worker/index.js';

export default {
  fetch(request) {
    return worker.fetch(request, process.env);
  },
};
