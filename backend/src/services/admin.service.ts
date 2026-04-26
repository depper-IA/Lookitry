/**
 * AdminService â Facade de compatibilidad.
 *
 * Esta clase ya NO contiene la lógica directa de negocio.
 * Delega a los sub-servicios especializados ubicados en `./admin/`.
 *
 * Sub-servicios disponibles:
 *  - AuthAdminService   â `./admin/auth.admin.service.ts`
 *  - BrandAdminService  â `./admin/brand.admin.service.ts`
 *  - StatsAdminService  â `./admin/stats.admin.service.ts`
 *  - PaymentAdminService â `./admin/payment.admin.service.ts`
 *  - OperationalAdminService â `./admin/operational.admin.service.ts`
 *
 * Mantener esta clase permite que `admin.controller.ts` no requiera
 * cambios inmediatos en sus importaciones.
 */

import { AuthAdminService, Admin } from './admin/auth.admin.service';
import { BrandAdminService, BrandWithStats } from './admin/brand.admin.service';
import { StatsAdminService } from './admin/stats.admin.service';
import { PaymentAdminService } from './admin/payment.admin.service';
import { OperationalAdminService } from './admin/operational.admin.service';

// Re-exportar tipos para compatibilidad con el controlador
export type { Admin, BrandWithStats };

export class AdminService {
  private auth = new AuthAdminService();
  private brands = new BrandAdminService();
  private stats = new StatsAdminService();
  private payments = new PaymentAdminService();
  private ops = new OperationalAdminService();

  // ââ Auth & Admin Management ââââââââââââââââââââââââââââââââââ
  getAdminByEmail(email: string) { return this.auth.getAdminByEmail(email); }
  getAdminById(adminId: string) { return this.auth.getAdminById(adminId); }
  getAdminByGoogleId(googleId: string) { return this.auth.getAdminByGoogleId(googleId); }
  updateAdminGoogleId(adminId: string, googleId: string) { return this.auth.updateAdminGoogleId(adminId, googleId); }
  verifyPassword(plain: string, hashed: string) { return this.auth.verifyPassword(plain, hashed); }
  listAdmins() { return this.auth.listAdmins(); }
  createAdmin(data: Parameters<AuthAdminService['createAdmin']>[0]) { return this.auth.createAdmin(data); }
  updateAdminPermissions(adminId: string, permissions: string[]) { return this.auth.updateAdminPermissions(adminId, permissions); }
  deleteAdmin(adminId: string, requestingAdminId: string) { return this.auth.deleteAdmin(adminId, requestingAdminId); }
  changeAdminPassword(adminId: string, newPassword: string) { return this.auth.changeAdminPassword(adminId, newPassword); }
  resetAdminPassword(adminId: string) { return this.auth.resetAdminPassword(adminId); }
  changeOwnPassword(adminId: string, currentPassword: string, newPassword: string) { return this.auth.changeOwnPassword(adminId, currentPassword, newPassword); }
  requestPasswordResetGetToken(email: string) { return this.auth.requestPasswordResetGetToken(email); }
  resetPasswordWithToken(token: string, newPassword: string) { return this.auth.resetPasswordWithToken(token, newPassword); }

  // ââ Brands âââââââââââââââââââââââââââââââââââââââââââââââââââ
  getAllBrandsWithStats() { return this.brands.getAllBrandsWithStats(); }
  changeBrandPlan(brandId: string, newPlan: 'BASIC' | 'PRO') { return this.brands.changeBrandPlan(brandId, newPlan); }
  deleteBrand(brandId: string) { return this.brands.deleteBrand(brandId); }
  resetBrand(brandId: string) { return this.brands.resetBrand(brandId); }
  deleteInactiveProduct(brandId: string, productId: string) { return this.brands.deleteInactiveProduct(brandId, productId); }
  getBrandProducts(brandId: string) { return this.brands.getBrandProducts(brandId); }
  createBrand(data: Parameters<BrandAdminService['createBrand']>[0]) { return this.brands.createBrand(data); }
  getTrialBrands() { return this.brands.getTrialBrands(); }
  getBrandFull(brandId: string) { return this.brands.getBrandFull(brandId); }
  getBrandsForDropdown(options: { limit?: number; search?: string }) { return this.brands.getBrandsForDropdown(options); }
  activateBrandPlan(brandId: string, options: Parameters<PaymentAdminService['activateBrandPlan']>[1]) { return this.payments.activateBrandPlan(brandId, options); }

  // ââ Stats ââââââââââââââââââââââââââââââââââââââââââââââââââââ
  getGlobalStats() { return this.stats.getGlobalStats(); }
  getConversionStats() { return this.stats.getConversionStats(); }
  getEconomics() { return this.stats.getEconomics(); }
  getRiskData() { return this.stats.getRiskData(); }

  // ââ Payments âââââââââââââââââââââââââââââââââââââââââââââââââ
  getPayments(filters: Parameters<PaymentAdminService['getPayments']>[0]) { return this.payments.getPayments(filters); }

  // ââ Operations âââââââââââââââââââââââââââââââââââââââââââââââ
  getMissionControl() { return this.ops.getMissionControl(); }
  getAdminMeta() { return this.ops.getAdminMeta(); }
  getAuditLog(filters: Parameters<OperationalAdminService['getAuditLog']>[0]) { return this.ops.getAuditLog(filters); }
}
