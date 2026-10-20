/**
 * Client-Side PDF Generation for:
 * 1. Planner Report (Grouped by domain, human-readable, date range)
 * 2. Expense Financial Statement (Executive summary dashboard + bank-statement style ledger)
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Domain, Transaction, ExpenseCategory, PaymentMethod } from '../types';
import { formatCurrency } from './date';

interface AutoTableDoc extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

/**
 * Generate human-readable Planner PDF report.
 */
export function exportPlannerPdf(
  domains: Domain[],
  fromDate: string,
  toDate: string,
  todayStr: string,
  userName: string = 'User'
): void {
  const doc = new jsPDF() as AutoTableDoc;
  const hasRange = Boolean(fromDate || toDate);

  const inRange = (dateStr: string | null | undefined): boolean => {
    if (!hasRange) return true;
    if (!dateStr) return false;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  };

  const byDomain: Record<string, Array<[string, string, string, string, string]>> = {};

  domains.forEach(domain => {
    const rows: Array<[string, string, string, string, string]> = [];
    domain.tasks.forEach(task => {
      const hasSubs = task.subtasks.length > 0;
      if (!hasSubs) {
        if (inRange(task.deadline)) {
          rows.push([
            task.name,
            'Task',
            task.priority.toUpperCase(),
            task.status === 'done' ? 'DONE' : 'OPEN',
            task.deadline || '—'
          ]);
        }
        return;
      }

      const matchingSubs = task.subtasks.filter(s => inRange(s.deadline));
      if (matchingSubs.length === 0) return;

      rows.push([
        task.name,
        'Task',
        task.priority.toUpperCase(),
        task.status === 'done' ? 'DONE' : 'OPEN',
        task.deadline || '—'
      ]);

      matchingSubs.forEach(sub => {
        rows.push([
          '   ↳ ' + sub.name,
          'Subtask',
          sub.priority.toUpperCase(),
          sub.done ? 'DONE' : 'OPEN',
          sub.deadline || '—'
        ]);
      });
    });

    if (rows.length > 0) {
      byDomain[domain.name] = rows;
    }
  });

  const rangeLabel = hasRange ? `${fromDate || 'Earliest'} to ${toDate || 'Latest'}` : 'All active & scheduled items';

  // Header band
  doc.setFillColor(31, 58, 82); // --navy
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MONTHLY PLANNER — REPORT', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Prepared for: ${userName}`, 200, 15, { align: 'right' });

  // Meta block
  doc.setTextColor(90, 100, 110);
  doc.setFontSize(10);
  doc.text(`Date Range: ${rangeLabel}`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

  let y = 46;
  const domainNames = Object.keys(byDomain);

  if (domainNames.length === 0) {
    doc.setTextColor(150, 50, 50);
    doc.setFontSize(11);
    doc.text('No tasks or subtasks match this date range.', 14, y);
  } else {
    domainNames.forEach(domName => {
      autoTable(doc, {
        startY: y,
        head: [[domName, 'Type', 'Priority', 'Status', 'Deadline']],
        body: byDomain[domName],
        theme: 'striped',
        headStyles: {
          fillColor: [31, 58, 82],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3.5,
          textColor: [16, 32, 43],
        },
        alternateRowStyles: {
          fillColor: [248, 246, 240],
        },
        margin: { left: 14, right: 14 },
      });

      y = (doc.lastAutoTable?.finalY ?? y) + 10;
    });
  }

  // Footer page numbers
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`Monthly Planner App • Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`planner-report-${todayStr || 'export'}.pdf`);
}

/**
 * Generate client-facing Expense Statement PDF (Executive summary + Bank statement ledger).
 */
export function exportExpensePdf(
  transactions: Transaction[],
  categories: ExpenseCategory[],
  paymentMethods: PaymentMethod[],
  fromDate: string,
  toDate: string,
  currencySymbol: string = '₹',
  currencyCode: string = 'INR',
  profileName: string = 'Account Holder'
): void {
  const doc = new jsPDF() as AutoTableDoc;

  // Filter transactions
  const filtered = transactions.filter(t => {
    if (fromDate && t.date < fromDate) return false;
    if (toDate && t.date > toDate) return false;
    return true;
  });

  // Sort chronologically
  filtered.sort((a, b) => a.date.localeCompare(b.date));

  // Compute summary figures
  let totalIncome = 0;
  let totalExpense = 0;
  const categorySpent: Record<string, number> = {};
  const methodSpent: Record<string, number> = {};

  filtered.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      categorySpent[t.category_id] = (categorySpent[t.category_id] || 0) + t.amount;
      methodSpent[t.payment_method_id] = (methodSpent[t.payment_method_id] || 0) + t.amount;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const methodMap = new Map(paymentMethods.map(m => [m.id, m.name]));

  // Header Banner
  doc.setFillColor(31, 58, 82); // Navy
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FINANCIAL STATEMENT & EXPENDITURE REPORT', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Account / Client: ${profileName}`, 14, 21);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 196, 21, { align: 'right' });

  // Period bar
  doc.setFillColor(241, 238, 230); // Warm paper-2
  doc.rect(14, 34, 182, 10, 'F');
  doc.setTextColor(31, 58, 82);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const periodText = `STATEMENT PERIOD: ${fromDate || 'Beginning'} TO ${toDate || 'Current Date'}`;
  doc.text(periodText, 18, 40.5);

  // 3 KPI Cards
  const cardWidth = 58;
  const cardHeight = 22;
  const cardY = 48;

  // Total Income
  doc.setFillColor(240, 248, 244);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(42, 127, 115); // Teal
  doc.setFontSize(8);
  doc.text('TOTAL INCOME', 18, cardY + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`+${formatCurrency(totalIncome, currencyCode, currencySymbol)}`, 18, cardY + 16);

  // Total Expense
  doc.setFillColor(254, 243, 242);
  doc.roundedRect(76, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(196, 51, 30); // Red
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL EXPENDITURE', 80, cardY + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`-${formatCurrency(totalExpense, currencyCode, currencySymbol)}`, 80, cardY + 16);

  // Net Balance
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(138, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(31, 58, 82);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('NET SAVINGS / BALANCE', 142, cardY + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const netSign = netSavings >= 0 ? '+' : '';
  doc.text(`${netSign}${formatCurrency(netSavings, currencyCode, currencySymbol)}`, 142, cardY + 16);

  // Category Breakdown Table
  let currentY = 76;
  doc.setFontSize(11);
  doc.setTextColor(31, 58, 82);
  doc.setFont('helvetica', 'bold');
  doc.text('Category-wise Expenditure Summary', 14, currentY);

  const catRows: Array<[string, string, string]> = Object.entries(categorySpent)
    .sort((a, b) => b[1] - a[1])
    .map(([catId, spent]) => {
      const share = totalExpense > 0 ? ((spent / totalExpense) * 100).toFixed(1) + '%' : '0%';
      return [catMap.get(catId) || 'Other', formatCurrency(spent, currencyCode, currencySymbol), share];
    });

  if (catRows.length === 0) {
    catRows.push(['No expenses recorded in this period', '—', '—']);
  }

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Category', 'Amount Spent', 'Share %']],
    body: catRows,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 238, 230],
      textColor: [31, 58, 82],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 8.5, cellPadding: 2.8 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc.lastAutoTable?.finalY ?? currentY) + 10;

  // Payment Method Breakdown
  doc.setFontSize(11);
  doc.setTextColor(31, 58, 82);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method Distribution', 14, currentY);

  const methodRows: Array<[string, string, string]> = Object.entries(methodSpent)
    .sort((a, b) => b[1] - a[1])
    .map(([methodId, spent]) => {
      const share = totalExpense > 0 ? ((spent / totalExpense) * 100).toFixed(1) + '%' : '0%';
      return [methodMap.get(methodId) || 'Default', formatCurrency(spent, currencyCode, currencySymbol), share];
    });

  if (methodRows.length === 0) {
    methodRows.push(['No transactions recorded', '—', '—']);
  }

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Payment Method', 'Total Debited', 'Share %']],
    body: methodRows,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 238, 230],
      textColor: [31, 58, 82],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 8.5, cellPadding: 2.8 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc.lastAutoTable?.finalY ?? currentY) + 12;

  // Page 2 / Bank Statement Table
  doc.addPage();
  doc.setFillColor(31, 58, 82);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION LEDGER & RUNNING BALANCE', 14, 12);

  // Bank Statement Table
  let runningBalance = 0;
  const ledgerRows: Array<[string, string, string, string, string, string]> = [];

  // Opening balance row
  ledgerRows.push(['—', 'OPENING BALANCE', '—', '—', '—', formatCurrency(0, currencyCode, currencySymbol)]);

  filtered.forEach(t => {
    const isDebit = t.type === 'expense';
    const debit = isDebit ? formatCurrency(t.amount, currencyCode, currencySymbol) : '—';
    const credit = !isDebit ? formatCurrency(t.amount, currencyCode, currencySymbol) : '—';

    if (isDebit) {
      runningBalance -= t.amount;
    } else {
      runningBalance += t.amount;
    }

    const catName = catMap.get(t.category_id) || 'General';
    const desc = t.note ? `${catName} (${t.note})` : catName;
    const method = methodMap.get(t.payment_method_id) || 'Cash';

    ledgerRows.push([
      t.date,
      desc,
      method,
      debit,
      credit,
      formatCurrency(runningBalance, currencyCode, currencySymbol)
    ]);
  });

  // Closing balance row
  ledgerRows.push([
    '—',
    'CLOSING BALANCE (PERIOD NET)',
    '—',
    formatCurrency(totalExpense, currencyCode, currencySymbol),
    formatCurrency(totalIncome, currencyCode, currencySymbol),
    formatCurrency(runningBalance, currencyCode, currencySymbol)
  ]);

  autoTable(doc, {
    startY: 26,
    head: [['Date', 'Description / Category', 'Method', 'Debit (-)', 'Credit (+)', 'Balance']],
    body: ledgerRows,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 58, 82],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [16, 32, 43],
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 54 },
      2: { cellWidth: 24 },
      3: { halign: 'right', textColor: [196, 51, 30] },
      4: { halign: 'right', textColor: [42, 127, 115] },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [251, 250, 247],
    },
    margin: { left: 14, right: 14 },
  });

  // Add Page Numbers
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`Monthly Planner Financial Statement • Page ${i} of ${totalPages}`, 105, 290, { align: 'center' });
  }

  doc.save(`financial-statement-${fromDate || 'period'}-to-${toDate || 'latest'}.pdf`);
}
