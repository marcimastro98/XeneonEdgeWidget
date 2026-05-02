/**
 * IcueWidgetApiWrapper — base async-request bridge for iCUE Qt plugins.
 *
 * Qt WebChannel exposes plugin methods with (requestId, ...args) signatures.
 * The plugin emits asyncResponse(requestId, value) when the call completes.
 * This wrapper converts that pattern into standard Promises.
 */
class IcueWidgetApiWrapper {
  /**
   * @param {object} plugin   - window.plugins.Xxx instance
   * @param {number} timeoutMs - max wait per request (default 5000)
   */
  constructor(plugin, timeoutMs = 5000) {
    this._plugin    = plugin;
    this._timeout   = timeoutMs;
    this._pending   = new Map(); // requestId → { resolve, reject, timer }
    this._nextId    = 0;

    if (plugin && plugin.asyncResponse && typeof plugin.asyncResponse.connect === 'function') {
      plugin.asyncResponse.connect((id, value) => {
        const entry = this._pending.get(id);
        if (!entry) return;
        this._pending.delete(id);
        clearTimeout(entry.timer);
        entry.resolve(value);
      });
    }
  }

  /**
   * Sends a request and returns a Promise that resolves with the async response.
   * @param {string} method  - plugin method name
   * @param  {...any} args   - extra arguments after requestId
   */
  _request(method, ...args) {
    return new Promise((resolve, reject) => {
      const id    = this._nextId++;
      const timer = setTimeout(() => {
        this._pending.delete(id);
        reject(new Error(`IcueWidgetApiWrapper: timeout on ${method}(${id})`));
      }, this._timeout);

      this._pending.set(id, { resolve, reject, timer });

      try {
        this._plugin[method](id, ...args);
      } catch (err) {
        clearTimeout(timer);
        this._pending.delete(id);
        reject(err);
      }
    });
  }
}
