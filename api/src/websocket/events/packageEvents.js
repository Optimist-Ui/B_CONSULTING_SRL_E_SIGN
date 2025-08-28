class PackageEventEmitter {
  constructor({ socketManager }) {
    this.socketManager = socketManager;
  }

  /**
   * Emits the complete, transformed, ready-to-use document object to the frontend.
   * @param {string} ownerId - The ID of the initiator (owner) to notify.
   * @param {object} updatedDocument - The full Document object, already transformed for the UI.
   */
  emitPackageUpdated(ownerId, updatedDocument) {
    this.socketManager.emitPackageUpdate(ownerId, {
      type: "PACKAGE_UPDATED",
      // Nest the full document here. This matches what the frontend expects.
      updatedDocument: updatedDocument,
    });
  }
}

module.exports = PackageEventEmitter;