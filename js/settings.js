(function () {
  "use strict";
  const HCM = window.HCM; const app = window.HCMApp;
  const form = document.getElementById("settingsForm");
  if (!HCM || !app || !form) return;
  const message = document.getElementById("settingsMessage");
  const preview = document.getElementById("lateRulePreview");

  function updatePreview() {
    const start = document.getElementById("officeStart").value;
    const grace = Number(document.getElementById("gracePeriodMinutes").value || 0);
    if (!start) return;
    const parts = start.split(":").map(Number); const date = new Date(2000, 0, 1, parts[0], parts[1] + grace);
    preview.textContent = "Employees are marked late after " + new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date) + ".";
  }
  try {
    const company = HCM.getCompany();
    if (company) {
      document.getElementById("companyName").value = company.name || "";
      document.getElementById("companyEmail").value = company.email || "";
      document.getElementById("companyPhone").value = company.phone || "";
      document.getElementById("companyAddress").value = company.address || "";
      document.getElementById("officeStart").value = company.officeStart || HCM.DEFAULT_POLICY.officeStart;
      document.getElementById("officeEnd").value = company.officeEnd || HCM.DEFAULT_POLICY.officeEnd;
      document.getElementById("gracePeriodMinutes").value = company.gracePeriodMinutes ?? HCM.DEFAULT_POLICY.gracePeriodMinutes;
      document.querySelectorAll("[name='workingDays']").forEach(function (box) { box.checked = company.workingDays.includes(box.value); });
      let quota = document.getElementById("annualLeaveQuota");
      if (!quota) {
        const target = document.querySelector(".settingsHoursGrid");
        const field = document.createElement("div"); field.className = "settingsField";
        const label = document.createElement("label"); label.htmlFor = "annualLeaveQuota"; label.textContent = "Annual leave quota";
        quota = document.createElement("input"); quota.id = "annualLeaveQuota"; quota.name = "annualLeaveQuota"; quota.type = "number"; quota.min = "0"; quota.max = "365"; quota.step = "1"; quota.required = true;
        field.append(label, quota); target.insertBefore(field, target.querySelector("fieldset"));
      }
      quota.value = company.annualLeaveQuota ?? HCM.DEFAULT_POLICY.annualLeaveQuota;
      let currency = document.getElementById("companyCurrency");
      if (!currency) {
        const field = document.createElement("div"); field.className = "settingsField";
        const label = document.createElement("label"); label.htmlFor = "companyCurrency"; label.textContent = "Payroll currency";
        currency = document.createElement("select"); currency.id = "companyCurrency"; currency.name = "currency";
        [["PKR","Pakistani rupee (PKR)"],["USD","US dollar (USD)"],["GBP","British pound (GBP)"],["EUR","Euro (EUR)"],["AED","UAE dirham (AED)"],["INR","Indian rupee (INR)"]].forEach(function (entry) { const option = document.createElement("option"); option.value = entry[0]; option.textContent = entry[1]; currency.append(option); });
        field.append(label, currency); document.querySelector(".settingsFormGrid").append(field);
      }
      currency.value = company.currency || HCM.DEFAULT_POLICY.currency;
    }
    updatePreview();
  } catch (error) { app.showGlobalError(error.message || "Company settings could not be loaded."); }

  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const workingDays = Array.from(document.querySelectorAll("[name='workingDays']:checked")).map(function (box) { return box.value; });
    if (!workingDays.length) { app.setMessage(message, "Select at least one working day.", "error"); return; }
    try {
      const previous = HCM.getCompany() || {};
      const data = Object.assign({}, previous, {
        name: document.getElementById("companyName").value.trim(),
        email: document.getElementById("companyEmail").value.trim(),
        phone: document.getElementById("companyPhone").value.trim(),
        address: document.getElementById("companyAddress").value.trim(),
        officeStart: document.getElementById("officeStart").value,
        officeEnd: document.getElementById("officeEnd").value,
        gracePeriodMinutes: Number(document.getElementById("gracePeriodMinutes").value),
        workingDays: workingDays,
        annualLeaveQuota: Number(document.getElementById("annualLeaveQuota").value),
        currency: document.getElementById("companyCurrency").value
      });
      if (data.officeEnd <= data.officeStart) throw new Error("Office end time must be after office start time.");
      HCM.saveCompany(data);
      app.setMessage(message, "Company settings saved.", "success");
      updatePreview();
    } catch (error) { console.error(error); app.setMessage(message, error.message || "Settings could not be saved.", "error"); }
  });

  const resetCard = document.getElementById("demoResetCard");
  const resetButton = document.getElementById("resetDemoData");
  if (resetCard && resetButton && HCM.isDemoSession()) resetCard.hidden = false;
  if (resetButton) resetButton.addEventListener("click", function () {
    if (!HCM.isDemoSession() || !window.HCMDemo) { resetCard.hidden = true; return; }
    if (!window.confirm("Restore the original demo employees, attendance, leave requests, and settings?")) return;
    resetButton.disabled = true;
    try {
      window.HCMDemo.reset();
      const company = HCM.getCompany();
      document.getElementById("companyName").value = company.name || "";
      document.getElementById("companyEmail").value = company.email || "";
      document.getElementById("companyPhone").value = company.phone || "";
      document.getElementById("companyAddress").value = company.address || "";
      document.getElementById("officeStart").value = company.officeStart;
      document.getElementById("officeEnd").value = company.officeEnd;
      document.getElementById("gracePeriodMinutes").value = company.gracePeriodMinutes;
      document.getElementById("annualLeaveQuota").value = company.annualLeaveQuota;
      document.getElementById("companyCurrency").value = company.currency;
      document.querySelectorAll("[name='workingDays']").forEach(function (box) { box.checked = company.workingDays.includes(box.value); });
      updatePreview();
      app.setMessage(message, "Demo sample data has been restored.", "success");
    } catch (error) {
      console.error(error);
      app.setMessage(message, error.message || "Demo data could not be reset.", "error");
    } finally { resetButton.disabled = false; }
  });
}());

