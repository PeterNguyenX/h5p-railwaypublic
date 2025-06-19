"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaissezFairePermissionSystem = void 0;
/**
 * A permission system that allows everything to every user.
 */
class LaissezFairePermissionSystem {
    async checkForUserData(_actingUser, _permission, _contentId, _affectedUserId) {
        return true;
    }
    async checkForGeneralAction(_actingUser, _permission) {
        return true;
    }
    async checkForContent(_user, _permission, _contentId) {
        return true;
    }
    async checkForTemporaryFile(_user, _permission, _filename) {
        return true;
    }
}
exports.LaissezFairePermissionSystem = LaissezFairePermissionSystem;
//# sourceMappingURL=LaissezFairePermissionSystem.js.map