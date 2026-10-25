(function () {
  "use strict";
  const HCM = window.HCM; const app = window.HCMApp;
  if (!HCM || !app) return;
  const user = app.user; const periodInput = document.getElementById("payslipPeriod");
  const documentNode = document.getElementById("payslipDocument"); const empty = document.getElementById("payslipEmpty");
  const message = document.getElementById("payslipMessage"); const printButton = document.getElementById("printPayslip");
  const currentMonth = HCM.localDateKey(new Date()).slice(0, 7);
  periodInput.value = currentMonth; periodInput.max = currentMonth;

  function setText(id, value) { const node = document.getElementById(id); if (node) node.textContent = value || "—"; }
  function row(description, calculation, amount, negative) {
    const tr = app.el("tr");
    const descriptionCell = app.el("td", "", description); descriptionCell.dataset.label = "Description";
    const calculationCell = app.el("td", "", calculation); calculationCell.dataset.label = "Calculation";
    const amountCell = app.el("td", negative ? "amountNegative" : "amountValue", amount); amountCell.dataset.label = "Amount";
    tr.append(descriptionCell, calculationCell, amountCell); return tr;
  }
  function render() {
    documentNode.hidden = true; empty.hidden = false; delete document.body.dataset.printReady; printButton.disabled = true;
    try {
      const result = HCM.calculatePayroll(user, periodInput.value);
      if (!result.valid) {
        document.getElementById("payslipEmptyTitle").textContent = "Payslip estimate unavailable";
        document.getElementById("payslipEmptyText").textContent = result.reason;
        app.setMessage(message, result.reason, "error");
        return;
      }
      const company = HCM.getCompany() || {};
      setText("payslipCompanyName", company.name || "Company name not configured");
      const companyDetails = [company.email, company.phone, company.address].filter(Boolean).join(" · ");
      setText("payslipCompanyDetails", companyDetails);
      setText("payEmployeeName", user.name);
      setText("payEmployeeId", user.employeeId);
      setText("payEmployeeEmail", user.email);
      setText("payEmployeeDepartment", user.department);
      setText("payEmployeeJobTitle", user.jobTitle);
      setText("payEmployeeJoiningDate", user.joiningDate ? HCM.formatDate(user.joiningDate) : "");
      const periodName = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(result.period.year, result.period.month - 1, 1, 12));
      setText("payslipTitle", periodName + " payslip estimate");
      setText("payslipPeriodLabel", periodName);
      setText("payslipPeriodCard", periodName);
      setText("payslipCutoff", HCM.formatDate(result.cutoff));
      setText("payEligibleDays", String(result.eligibleDays));
      setText("payAttendedDays", String(result.attendedDays));
      setText("payHalfDays", String(result.halfDays));
      setText("payAbsentDays", String(result.absentDays));
      setText("payApprovedLeaveDays", String(result.approvedLeaveDays));

      const fullDeduction = result.perDay * result.absentDays;
      const halfDeduction = result.perDay * result.halfDays * 0.5;
      const breakdown = document.getElementById("payslipRows");
      breakdown.replaceChildren(
        row("Monthly base salary", "Monthly salary on employee record", HCM.formatMoney(result.monthlySalary, result.currency), false),
        row("Daily rate", HCM.formatMoney(result.monthlySalary, result.currency) + " ÷ " + result.fullMonthWorkdays + " scheduled workdays", HCM.formatMoney(result.perDay, result.currency), false),
        row("Full-day absence deduction", result.absentDays + " absent workdays × daily rate", "− " + HCM.formatMoney(fullDeduction, result.currency), true),
        row("Half-day deduction", result.halfDays + " half days × 0.5 × daily rate", "− " + HCM.formatMoney(halfDeduction, result.currency), true),
        row("Approved leave deduction", result.approvedLeaveDays + " approved working days treated as excused under the current policy", HCM.formatMoney(0, result.currency), false)
      );
      setText("payslipNet", HCM.formatMoney(result.net, result.currency));
      documentNode.hidden = false; empty.hidden = true; document.body.dataset.printReady = "true"; printButton.disabled = false;
      app.setMessage(message, "Estimate uses attendance through " + HCM.formatDate(result.cutoff) + ".", "success");
    } catch (error) {
      console.error(error);
      document.getElementById("payslipEmptyTitle").textContent = "Payslip data could not be read";
      document.getElementById("payslipEmptyText").textContent = error.message || "Review the saved employee and attendance records.";
      app.setMessage(message, error.message || "Payslip data could not be read.", "error");
    }
  }

  periodInput.addEventListener("change", render);
  printButton.addEventListener("click", function () { if (!printButton.disabled && !documentNode.hidden) window.print(); });
  window.addEventListener("storage", function (event) {
    if (HCM.isDataStorageKey(event.key)) {
      const latest = HCM.currentUser();
      if (!latest || latest.role !== "employee") { HCM.clearSession(); location.replace("signIn.html"); return; }
      Object.assign(user, latest);
      render();
    }
  });
  render();
}());




