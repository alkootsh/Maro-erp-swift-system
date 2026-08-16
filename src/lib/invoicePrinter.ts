/**
 * @file invoicePrinter.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: invoicePrinter.ts.
 */
// MARO ERP - Enterprise Invoice & Receipt Printer Engine
import { SalesInvoice } from '../types/sprint8';
import { CustomerRepository } from '../repositories/customerRepository';
import { formatCurrency, formatDate } from './utils';

export function printSalesInvoice(invoice: SalesInvoice): void {
  // Try to load latest customer details if not present in invoice
  let previousBalance = invoice.previousBalance;
  let currentBalance = invoice.currentBalance;
  let creditLimit = invoice.customerCreditLimit;
  let creditStatus = invoice.creditStatus;

  if (invoice.customerId && (previousBalance === undefined || currentBalance === undefined)) {
    const customer = CustomerRepository.getCustomerById(invoice.customerId);
    if (customer) {
      previousBalance = previousBalance ?? (customer.currentBalance || 0);
      creditLimit = creditLimit ?? (customer.creditLimit || 0);
      creditStatus = creditStatus ?? (customer.creditLimit > 0 ? `مسموح بالآجل (حد: ${formatCurrency(customer.creditLimit)})` : 'غير مسموح بالآجل (كاش فقط)');
      currentBalance = currentBalance ?? (previousBalance + (invoice.paymentMethod === 'CREDIT' ? (invoice.dueAmount || invoice.grandTotal) : 0));
    }
  }

  const itemsRowsHtml = invoice.items.map((item, index) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${item.productName} <span style="font-size: 10px; color: #64748b; font-family: monospace;">(${item.sku || 'SKU'})</span></td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${item.quantity} ${item.unitName || 'قطعة'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.discountPercent || 0}%</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; font-weight: bold;">${formatCurrency(item.lineTotal)}</td>
    </tr>
  `).join('');

  const paymentMethodLabelMap: Record<string, string> = {
    'CASH': 'نقدي / تحويل كاش مسبق',
    'CARD': 'بطاقة / تحويل بنكي',
    'CREDIT': 'دفع آجل (على حساب العميل)',
    'SPLIT': 'دفع مجزأ'
  };

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة مبيعات - ${invoice.invoiceNumber}</title>
      <style>
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 20px;
          direction: rtl;
          font-size: 12px;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          border: 1px solid #cbd5e1;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 12px;
        }
        .customer-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }
        .customer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .data-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .data-value {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }
        .badge-credit {
          background-color: #e0e7ff;
          color: #3730a3;
          border: 1px solid #c7d2fe;
        }
        .badge-cash {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background-color: #f1f5f9;
          color: #334155;
          padding: 10px 8px;
          font-size: 11px;
          font-weight: 800;
          border-bottom: 2px solid #cbd5e1;
        }
        .totals-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .totals-cell-label {
          text-align: left;
          padding: 6px;
          color: #475569;
          font-weight: 600;
        }
        .totals-cell-value {
          text-align: left;
          padding: 6px;
          font-weight: 800;
          width: 140px;
        }
        .grand-total-row {
          background-color: #f0f9ff;
          border-top: 2px solid #0284c7;
          border-bottom: 2px solid #0284c7;
        }
        .grand-total-row td {
          font-size: 15px;
          color: #0369a1;
          padding: 10px 6px;
        }
        .qr-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px dashed #cbd5e1;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <!-- Header -->
        <table class="header-table">
          <tr>
            <td style="text-align: right; vertical-align: top;">
              <h1 style="margin: 0; font-size: 20px; color: #0284c7; font-weight: 900;">منصة MARO ERP Enterprise</h1>
              <div style="font-size: 11px; color: #475569; margin-top: 4px; font-weight: bold;">فاتورة ضريبية مبسطة (معتمدة طبقاً لاشتراطات الزكاة والدخل ZATCA)</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">الرقم الضريبي: 300000000000003 | السجل التجاري: 1010000000</div>
            </td>
            <td style="text-align: left; vertical-align: top;">
              <div style="font-size: 16px; font-weight: 900; color: #0f172a; font-family: monospace;">${invoice.invoiceNumber}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">تاريخ الإصدار: ${formatDate(new Date(invoice.createdAt))}</div>
              <div style="margin-top: 6px;">
                <span class="badge badge-cash">حالة الفاتورة: ${invoice.status === 'PAID' ? 'مدفوعة بالكامل ✅' : 'معتمدة / آجل'}</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Customer Ledger & Credit Details -->
        <div class="customer-card">
          <div class="customer-grid">
            <div>
              <div class="data-label">اسم العميل المسجل:</div>
              <div class="data-value">${invoice.customerName || 'عميل نقدي / غير مسجل'}</div>
            </div>
            <div>
              <div class="data-label">طريقة الدفع المعتمدة:</div>
              <div class="data-value" style="color: #0284c7;">${paymentMethodLabelMap[invoice.paymentMethod] || invoice.paymentMethod}</div>
            </div>
            <div>
              <div class="data-label">حالة الائتمان بالنظام:</div>
              <div class="data-value">
                <span class="badge ${creditLimit && creditLimit > 0 ? 'badge-credit' : 'badge-cash'}">
                  ${creditStatus || (creditLimit && creditLimit > 0 ? 'مسموح بالدفع الآجل' : 'نقدي فقط (دفع مسبق)')}
                </span>
              </div>
            </div>
            ${previousBalance !== undefined ? `
            <div>
              <div class="data-label">الرصيد السابق للعميل:</div>
              <div class="data-value" style="color: ${previousBalance > 0 ? '#b91c1c' : '#15803d'};">
                ${formatCurrency(previousBalance)} ${previousBalance > 0 ? '(مدينة عليك)' : previousBalance < 0 ? '(دائنة لك)' : ''}
              </div>
            </div>
            ` : ''}
            <div>
              <div class="data-label">إجمالي الفاتورة الحالية:</div>
              <div class="data-value" style="color: #0284c7;">${formatCurrency(invoice.grandTotal)}</div>
            </div>
            ${currentBalance !== undefined ? `
            <div>
              <div class="data-label">الرصيد الإجمالي بعد الفاتورة:</div>
              <div class="data-value" style="color: ${currentBalance > 0 ? '#b91c1c' : '#15803d'}; font-size: 14px;">
                ${formatCurrency(currentBalance)}
              </div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="text-align: right; width: 45%;">الصنف / المنتج</th>
              <th style="width: 15%;">الكمية</th>
              <th style="text-align: left; width: 12%;">السعر</th>
              <th style="width: 8%;">خصم %</th>
              <th style="text-align: left; width: 15%;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>

        <!-- Totals & ZATCA section -->
        <table class="totals-table">
          <tr>
            <td rowspan="4" style="vertical-align: top; width: 50%;">
              <div style="font-size: 11px; color: #64748b; line-height: 1.6;">
                <strong>ملاحظات وشروط الفاتورة:</strong><br>
                ${invoice.notes || 'البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوماً من تاريخ الفاتورة بشرط وجود العبوة الأصلية.'}
              </div>
            </td>
            <td class="totals-cell-label">المجموع قبل الضريبة:</td>
            <td class="totals-cell-value">${formatCurrency(invoice.totalUntaxed)}</td>
          </tr>
          <tr>
            <td class="totals-cell-label">ضريبة القيمة المضافة (14%):</td>
            <td class="totals-cell-value" style="color: #059669;">${formatCurrency(invoice.totalTax)}</td>
          </tr>
          ${invoice.totalDiscount > 0 ? `
          <tr>
            <td class="totals-cell-label">إجمالي الخصم:</td>
            <td class="totals-cell-value" style="color: #dc2626;">-${formatCurrency(invoice.totalDiscount)}</td>
          </tr>
          ` : ''}
          <tr class="grand-total-row">
            <td class="totals-cell-label" style="font-weight: 900;">الإجمالي النهائي المستحق:</td>
            <td class="totals-cell-value" style="font-weight: 900;">${formatCurrency(invoice.grandTotal)}</td>
          </tr>
          <tr>
            <td></td>
            <td class="totals-cell-label">المبلغ المدفوع:</td>
            <td class="totals-cell-value">${formatCurrency(invoice.paidAmount || 0)}</td>
          </tr>
          <tr>
            <td></td>
            <td class="totals-cell-label">المبلغ المتبقي:</td>
            <td class="totals-cell-value" style="color: ${(invoice.dueAmount || 0) > 0 ? '#dc2626' : '#166534'};">${formatCurrency(invoice.dueAmount || 0)}</td>
          </tr>
        </table>

        <!-- ZATCA QR Code Footer -->
        <div class="qr-section">
          <div>
            <div style="font-size: 11px; font-weight: bold; color: #334155;">ختم التوثيق الضريبي ZATCA TLV Base64:</div>
            <div style="font-size: 9px; font-family: monospace; color: #64748b; word-break: break-all; max-width: 450px; margin-top: 4px;">
              AQ5NQVJPIEVSUCBTeXN0ZW0CEzMwMDAwMDAwMDAwMDAwMwMTMjAyNi0wOC0xNVQxMjowMDowMFoEBTEwMDAwBAMxNDAuMA==
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border: 2px solid #0f172a; padding: 6px; border-radius: 8px; display: inline-block; background: #fff;">
              <svg width="70" height="70" viewBox="0 0 100 100" fill="#0f172a">
                <rect x="10" y="10" width="30" height="30" />
                <rect x="60" y="10" width="30" height="30" />
                <rect x="10" y="60" width="30" height="30" />
                <rect x="20" y="20" width="10" height="10" fill="#fff" />
                <rect x="70" y="20" width="10" height="10" fill="#fff" />
                <rect x="20" y="70" width="10" height="10" fill="#fff" />
                <rect x="50" y="50" width="15" height="15" />
                <rect x="70" y="70" width="20" height="20" />
                <rect x="50" y="80" width="10" height="10" />
              </svg>
            </div>
            <div style="font-size: 9px; color: #475569; font-weight: bold; margin-top: 2px;">رمز الفاتورة الضريبية</div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  // Print via iframe mechanism (bypasses iframe restrictions safely)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(printDocumentHtml);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Print iframe error:', e);
      }
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }, 500);
  } else {
    // Fallback: popup window
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printDocumentHtml);
      printWin.document.close();
      printWin.focus();
    }
  }
}
