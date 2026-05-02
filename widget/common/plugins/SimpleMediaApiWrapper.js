/**
 * SimpleMediaApiWrapper — Promise-based wrapper for widgetbuilder.mediadataprovider.
 *
 * SDK gap: only getSongName and getArtist are available.
 * Playback status, album art, and app name are NOT exposed by the SDK.
 *
 * Usage:
 *   const mediaApi = new SimpleMediaApiWrapper(window.plugins.Mediadataprovider, 5000);
 *   const title = await mediaApi.getSongName();
 */
class SimpleMediaApiWrapper extends IcueWidgetApiWrapper {
  constructor(plugin, timeoutMs = 5000) {
    super(plugin, timeoutMs);
  }

  /** @returns {Promise<string>} current song/track name */
  getSongName() { return this._request('getSongName'); }

  /** @returns {Promise<string>} current artist name */
  getArtist()   { return this._request('getArtist'); }
}
