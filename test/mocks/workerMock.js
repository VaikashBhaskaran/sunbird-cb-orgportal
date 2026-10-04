/**
 * Worker stand-in for `worker-loader!` imports and the pdf.js worker entry point,
 * neither of which jsdom can instantiate.
 */
module.exports = class WorkerMock {
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return false
  }
}
