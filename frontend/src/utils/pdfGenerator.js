// frontend/src/utils/pdfGenerator.js

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Add header to PDF
const addHeader = (doc, title) => {
  // Add bank logo/name
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Bank Lending System", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(title, 105, 30, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
};

// Add footer to PDF
const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      `Generated on ${new Date().toLocaleString("en-IN")}`,
      105,
      pageHeight - 5,
      { align: "center" }
    );
  }
};

// ==================== 1. LOAN AGREEMENT ====================
export const generateLoanAgreement = (loanData, userData) => {
  const doc = new jsPDF();
  
  addHeader(doc, "Loan Agreement");
  
  let yPos = 50;
  
  // Agreement Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("LOAN AGREEMENT", 105, yPos, { align: "center" });
  yPos += 15;
  
  // Agreement Date
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${formatDate(new Date())}`, 20, yPos);
  yPos += 10;
  
  // Parties
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BETWEEN:", 20, yPos);
  yPos += 8;
  
  doc.setFont("helvetica", "normal");
  doc.text("The Lender: Bank Lending System", 20, yPos);
  yPos += 6;
  doc.text("Address: 123 Banking Street, Financial District", 20, yPos);
  yPos += 10;
  
  doc.setFont("helvetica", "bold");
  doc.text("AND:", 20, yPos);
  yPos += 8;
  
  doc.setFont("helvetica", "normal");
  doc.text(`The Borrower: ${userData.name}`, 20, yPos);
  yPos += 6;
  doc.text(`Customer ID: ${userData.customer_id}`, 20, yPos);
  yPos += 6;
  doc.text(`Email: ${userData.email}`, 20, yPos);
  yPos += 15;
  
  // Loan Details Box
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.5);
  doc.rect(20, yPos, 170, 50);
  
  doc.setFillColor(102, 126, 234);
  doc.rect(20, yPos, 170, 8, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("LOAN DETAILS", 105, yPos + 5.5, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  yPos += 15;
  
  doc.text(`Loan ID: ${loanData.loan_id}`, 25, yPos);
  yPos += 7;
  doc.text(`Principal Amount: ${formatCurrency(loanData.principal_amount)}`, 25, yPos);
  yPos += 7;
  doc.text(`Interest Rate: 7% per annum`, 25, yPos);
  yPos += 7;
  doc.text(`Loan Period: ${loanData.loan_period_years} years`, 25, yPos);
  yPos += 7;
  doc.text(`Monthly EMI: ${formatCurrency(loanData.monthly_emi)}`, 25, yPos);
  yPos += 7;
  doc.text(`Total Amount Payable: ${formatCurrency(loanData.total_amount)}`, 25, yPos);
  yPos += 15;
  
  // Terms and Conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TERMS AND CONDITIONS:", 20, yPos);
  yPos += 8;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const terms = [
    "1. The Borrower agrees to repay the loan in monthly installments (EMI) as specified.",
    "2. The interest rate is fixed at 7% per annum for the entire loan period.",
    "3. Payments must be made on or before the due date each month.",
    "4. Late payments may incur additional charges and affect credit score.",
    "5. The Borrower may prepay the loan in full or part, subject to prepayment charges.",
    "6. The Lender reserves the right to take legal action in case of default.",
    "7. This agreement is governed by the laws of India.",
  ];
  
  terms.forEach((term) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    const lines = doc.splitTextToSize(term, 170);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 5 + 3;
  });
  
  yPos += 10;
  
  // Signatures
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont("helvetica", "bold");
  doc.text("SIGNATURES:", 20, yPos);
  yPos += 15;
  
  doc.setFont("helvetica", "normal");
  doc.line(20, yPos, 80, yPos);
  doc.line(130, yPos, 190, yPos);
  yPos += 5;
  doc.text("Borrower's Signature", 20, yPos);
  doc.text("Lender's Signature", 130, yPos);
  yPos += 3;
  doc.setFontSize(9);
  doc.text(`${userData.name}`, 20, yPos);
  doc.text("Bank Lending System", 130, yPos);
  
  addFooter(doc);
  doc.save(`Loan_Agreement_${loanData.loan_id}.pdf`);
};

// ==================== 2. PAYMENT RECEIPT ====================
export const generatePaymentReceipt = (paymentData, loanData, userData) => {
  const doc = new jsPDF();
  
  addHeader(doc, "Payment Receipt");
  
  let yPos = 50;
  
  // Receipt Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", 105, yPos, { align: "center" });
  yPos += 5;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 128, 0);
  doc.text("✓ Payment Successful", 105, yPos, { align: "center" });
  doc.setTextColor(0, 0, 0);
  yPos += 15;
  
  // Transaction Details Box
  doc.setDrawColor(40, 167, 69);
  doc.setLineWidth(0.5);
  doc.rect(20, yPos, 170, 70);
  
  doc.setFillColor(40, 167, 69);
  doc.rect(20, yPos, 170, 8, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TRANSACTION DETAILS", 105, yPos + 5.5, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  yPos += 15;
  
  doc.text(`Transaction ID:`, 25, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(`${paymentData.transaction_id}`, 80, yPos);
  yPos += 8;
  
  doc.setFont("helvetica", "normal");
  doc.text(`Date & Time:`, 25, yPos);
  doc.text(`${formatDate(paymentData.date || new Date())}`, 80, yPos);
  yPos += 8;
  
  doc.text(`Payment Type:`, 25, yPos);
  doc.text(`${paymentData.type}`, 80, yPos);
  yPos += 8;
  
  doc.text(`Amount Paid:`, 25, yPos);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 128, 0);
  doc.text(`${formatCurrency(paymentData.amount)}`, 80, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  yPos += 8;
  
  doc.text(`Loan ID:`, 25, yPos);
  doc.text(`${paymentData.loan_id}`, 80, yPos);
  yPos += 8;
  
  doc.text(`Remaining Balance:`, 25, yPos);
  doc.text(`${formatCurrency(paymentData.remaining_balance)}`, 80, yPos);
  yPos += 8;
  
  doc.text(`EMIs Remaining:`, 25, yPos);
  doc.text(`${paymentData.emis_left}`, 80, yPos);
  yPos += 20;
  
  // Customer Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("CUSTOMER DETAILS:", 20, yPos);
  yPos += 8;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Name: ${userData.name}`, 20, yPos);
  yPos += 7;
  doc.text(`Customer ID: ${userData.customer_id}`, 20, yPos);
  yPos += 7;
  doc.text(`Email: ${userData.email}`, 20, yPos);
  yPos += 20;
  
  // Thank you message
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPos, 170, 25, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for your payment!", 105, yPos + 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "This is a computer-generated receipt and does not require a signature.",
    105,
    yPos + 18,
    { align: "center" }
  );
  
  addFooter(doc);
  doc.save(`Payment_Receipt_${paymentData.transaction_id}.pdf`);
};

// ==================== 3. LOAN STATEMENT ====================
export const generateLoanStatement = (loanData, transactions, userData) => {
  try {
    const doc = new jsPDF();
    
    addHeader(doc, "Loan Statement");
    
    let yPos = 50;
    
    // Statement Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LOAN ACCOUNT STATEMENT", 105, yPos, { align: "center" });
    yPos += 5;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Statement Period: ${formatDate(loanData.created_at || new Date())} to ${formatDate(new Date())}`, 105, yPos, { align: "center" });
    yPos += 15;
    
    // Customer Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ACCOUNT HOLDER:", 20, yPos);
    yPos += 7;
    
    doc.setFont("helvetica", "normal");
    doc.text(`${userData.name}`, 20, yPos);
    yPos += 5;
    doc.text(`Customer ID: ${userData.customer_id}`, 20, yPos);
    yPos += 5;
    doc.text(`Loan ID: ${loanData.loan_id}`, 20, yPos);
    yPos += 15;
    
    // Loan Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("LOAN SUMMARY:", 20, yPos);
    yPos += 8;
    
    const summaryData = [
      ["Principal Amount", formatCurrency(loanData.principal_amount || loanData.principal || 0)],
      ["Interest Rate", "7% per annum"],
      ["Loan Period", `${loanData.loan_period_years || "N/A"} years`],
      ["Monthly EMI", formatCurrency(loanData.monthly_emi || 0)],
      ["Total Amount Payable", formatCurrency(loanData.total_amount || 0)],
      ["Amount Paid", formatCurrency(loanData.total_paid || loanData.amount_paid || 0)],
      ["Balance Amount", formatCurrency(loanData.balance_amount || loanData.remaining_balance || 0)],
      ["EMIs Remaining", `${loanData.emis_left || loanData.remaining_emis || 0}`],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [["Description", "Amount"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [102, 126, 234], fontSize: 11, fontStyle: "bold" },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 70, halign: "right" },
      },
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Transaction History
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TRANSACTION HISTORY:", 20, yPos);
    yPos += 8;
    
    if (transactions && transactions.length > 0) {
      const transactionData = transactions.map((txn) => [
        formatDate(txn.date || txn.payment_date || txn.created_at),
        txn.transaction_id ? txn.transaction_id.substring(0, 15) + "..." : "N/A",
        txn.type || txn.payment_type || "EMI",
        formatCurrency(txn.amount || 0),
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [["Date", "Transaction ID", "Type", "Amount"]],
        body: transactionData,
        theme: "striped",
        headStyles: { fillColor: [102, 126, 234], fontSize: 10, fontStyle: "bold" },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 40, halign: "right" },
        },
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No transactions found.", 20, yPos);
    }
    
    addFooter(doc);
    doc.save(`Loan_Statement_${loanData.loan_id}.pdf`);
    
    console.log("PDF generated successfully!");
  } catch (error) {
    console.error("Error in generateLoanStatement:", error);
    alert("Failed to generate PDF. Check console for details.");
  }
};

// ==================== 4. AMORTIZATION SCHEDULE ====================
export const generateAmortizationSchedule = (loanData, userData) => {
  try {
    const doc = new jsPDF();
    
    addHeader(doc, "Amortization Schedule");
    
    let yPos = 50;
    
    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LOAN AMORTIZATION SCHEDULE", 105, yPos, { align: "center" });
    yPos += 15;
    
    // Loan Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Loan ID: ${loanData.loan_id}`, 20, yPos);
    doc.text(`Customer: ${userData.name}`, 120, yPos);
    yPos += 5;
    doc.text(`Principal: ${formatCurrency(loanData.principal_amount || 0)}`, 20, yPos);
    doc.text(`Rate: 7% p.a.`, 120, yPos);
    yPos += 5;
    doc.text(`Period: ${loanData.loan_period_years || 0} years`, 20, yPos);
    doc.text(`EMI: ${formatCurrency(loanData.monthly_emi || 0)}`, 120, yPos);
    yPos += 15;
    
    // Validation
    const principal = parseFloat(loanData.principal_amount) || 0;
    const monthlyEmi = parseFloat(loanData.monthly_emi) || 0;
    const years = parseInt(loanData.loan_period_years) || 0;
    
    if (principal === 0 || monthlyEmi === 0 || years === 0) {
      doc.setFontSize(12);
      doc.setTextColor(220, 53, 69);
      doc.text("Error: Invalid loan data. Cannot generate amortization schedule.", 105, yPos, { align: "center" });
      doc.setTextColor(0, 0, 0);
      addFooter(doc);
      doc.save(`Amortization_Schedule_${loanData.loan_id}.pdf`);
      return;
    }
    
    // Calculate amortization schedule
    const monthlyRate = 0.07 / 12;
    let balance = principal;
    const scheduleData = [];
    const totalMonths = years * 12;
    
    for (let month = 1; month <= totalMonths; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = monthlyEmi - interest;
      balance = Math.max(balance - principalPayment, 0);
      
      scheduleData.push([
        month,
        formatCurrency(monthlyEmi),
        formatCurrency(principalPayment),
        formatCurrency(interest),
        formatCurrency(balance),
      ]);
      
      if (balance === 0) break;
    }
    
    // Add table
    autoTable(doc, {
      startY: yPos,
      head: [["Month", "EMI", "Principal", "Interest", "Balance"]],
      body: scheduleData,
      theme: "grid",
      headStyles: { fillColor: [102, 126, 234], fontSize: 9, fontStyle: "bold" },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: 35, halign: "right" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
      },
      margin: { left: 20, right: 20 },
    });
    
    addFooter(doc);
    doc.save(`Amortization_Schedule_${loanData.loan_id}.pdf`);
    
    console.log("PDF generated successfully!");
  } catch (error) {
    console.error("Error in generateAmortizationSchedule:", error);
    alert("Failed to generate PDF. Check console for details.");
  }
};

// ==================== 5. MONTHLY STATEMENT ====================
export const generateMonthlyStatement = (monthData, userData) => {
  const doc = new jsPDF();
  
  addHeader(doc, "Monthly Statement");
  
  let yPos = 50;
  
  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("MONTHLY ACCOUNT STATEMENT", 105, yPos, { align: "center" });
  yPos += 5;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Statement Month: ${monthData.month}`, 105, yPos, { align: "center" });
  yPos += 15;
  
  // Customer details
  doc.text(`Account Holder: ${userData.name}`, 20, yPos);
  yPos += 5;
  doc.text(`Customer ID: ${userData.customer_id}`, 20, yPos);
  yPos += 15;
  
  // Summary
  const summaryData = [
    ["Total Active Loans", `${monthData.activeLoans}`],
    ["Total Payments Made", `${monthData.paymentsCount}`],
    ["Total Amount Paid", formatCurrency(monthData.totalPaid)],
    ["Outstanding Balance", formatCurrency(monthData.outstandingBalance)],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [["Description", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [102, 126, 234] },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: "right" },
    },
  });
  
  addFooter(doc);
  doc.save(`Monthly_Statement_${monthData.month}.pdf`);
};