"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacTestModule = void 0;
const common_1 = require("@nestjs/common");
const rbac_test_controller_1 = require("../controllers/rbac-test.controller");
const permissions_service_1 = require("../services/permissions.service");
let RbacTestModule = class RbacTestModule {
};
exports.RbacTestModule = RbacTestModule;
exports.RbacTestModule = RbacTestModule = __decorate([
    (0, common_1.Module)({
        controllers: [rbac_test_controller_1.RbacTestController],
        providers: [permissions_service_1.PermissionsService],
    })
], RbacTestModule);
//# sourceMappingURL=rbac-test.module.js.map