H5P.Version = (function () {
  /**
   * Make it easy to keep track of version details.
   *
   * @class
   * @namespace H5P
   * @param {String} version
   */
  function Version(version) {

    if (typeof version === 'string') {
      // Name version string (used by content upgrade)
      var versionSplit = version.split('.', 3);
      this.major = parseInt(versionSplit[0], 10);
      this.minor = parseInt(versionSplit[1], 10);
    }
    else {
      // Library objects (used by editor)
      if (version.localMajorVersion !== undefined) {
        this.major = parseInt(version.localMajorVersion, 10);
        this.minor = parseInt(version.localMinorVersion, 10);
      }
      else {
        this.major = parseInt(version.majorVersion, 10);
        this.minor = parseInt(version.minorVersion, 10);
      }
    }

    /**
     * Public. Custom string for this object.
     *
     * @returns {String}
     */
    this.toString = function () {
      return version;
    };
  }

  return Version;
})();
