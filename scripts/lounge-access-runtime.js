// Loaded before the existing immutable client; no scene/client rebuild needed.
(() => {
  const assetOrigin = new URL(document.currentScript.src).origin;
  const nativeFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    if (url.origin === assetOrigin) init = Object.assign({}, init, { credentials: 'include' });
    return nativeFetch.call(this, input, init);
  };
  const open = XMLHttpRequest.prototype.open;
  const NativeWorker = window.Worker;
  window.Worker = class LoungeWorker extends NativeWorker {
    constructor(url, options) {
      const parsed = new URL(url, location.href);
      if (parsed.origin === assetOrigin) url = location.origin + '/_lounge/assets' + parsed.pathname + parsed.search;
      super(url, options);
    }
  };
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    const result = open.call(this, method, url, ...rest);
    if (new URL(url, location.href).origin === assetOrigin) this.withCredentials = true;
    return result;
  };
})();
