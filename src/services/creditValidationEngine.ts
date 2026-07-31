// MARO ERP - Customer & Supplier Credit Validation Engine
import { Customer, Supplier, CreditCheckResult } from '../types/sprint8';
import { CustomerRepository } from '../repositories/customerRepository';
import { SupplierRepository } from '../repositories/supplierRepository';

export class CreditValidationEngine {
  // Validate Customer Credit Limit and Overdue Outstanding Balance
  static validateCustomerCredit(customerId: string, requestedAmount: number): CreditCheckResult {
    const customer = CustomerRepository.getCustomerById(customerId);

    if (!customer) {
      return {
        allowed: true, // Cash customer or generic walk-in
        customerId: customerId || 'CASH_CUSTOMER',
        creditLimit: 0,
        currentBalance: 0,
        requestedAmount,
        projectedBalance: requestedAmount,
        exceededAmount: 0
      };
    }

    const currentBalance = customer.currentBalance || 0;
    const creditLimit = customer.creditLimit || 0;
    const projectedBalance = currentBalance + requestedAmount;

    if (creditLimit > 0 && projectedBalance > creditLimit) {
      const exceededAmount = projectedBalance - creditLimit;
      return {
        allowed: false,
        customerId,
        creditLimit,
        currentBalance,
        requestedAmount,
        projectedBalance,
        exceededAmount,
        reason: `تم تجاوز الائتمان المسموح به للعميل ${customer.name}. الحد المسموح: ${creditLimit.toLocaleString()} ج.م، الرصيد الحالي: ${currentBalance.toLocaleString()} ج.م، القيمة المطلوبة: ${requestedAmount.toLocaleString()} ج.م (التجاوز: ${exceededAmount.toLocaleString()} ج.م)`
      };
    }

    return {
      allowed: true,
      customerId,
      creditLimit,
      currentBalance,
      requestedAmount,
      projectedBalance,
      exceededAmount: 0
    };
  }

  // Validate Supplier Payment Terms
  static validateSupplierCredit(supplierId: string): { allowed: boolean; message?: string } {
    const supplier = SupplierRepository.getSupplierById(supplierId);
    if (!supplier) return { allowed: true };

    if (supplier.status === 'inactive') {
      return {
        allowed: false,
        message: `المورد ${supplier.name} غير نشط حالياً ولا يمكن الشراء منه`
      };
    }

    return { allowed: true };
  }
}
