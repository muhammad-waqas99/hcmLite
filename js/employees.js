(function () {
  "use strict";
  const HCM = window.HCM; const app = window.HCMApp;
  if (!HCM || !app) return;
  const form = document.getElementById("employeeForm");
  const rows = document.getElementById("employeeRows");
  const search = document.getElementById("employeeSearch");
  const statusFilter = document.getElementById("employeeStatusFilter");
  const departmentFilter = document.getElementById("employeeDepartmentFilter");
  const message = document.getElementById("employeeMessage");
  const pageMessage = document.getElementById("employeePageMessage");
  const table = document.querySelector(".employeeTable");
  const modal = document.getElementById("addEmployeeModal");
  const passwordField = document.getElementById("employeePasswordField");
  const passwordInput = document.getElementById("employeePassword");
  const title = document.getElementById("addEmployeeTitle");
  const saveButton = form.querySelector("button[type='submit']");

  function emptyRow(text, hasRecords) {
    const row = app.el("tr"); const cell = app.el("td"); cell.colSpan = 6;
    const state = app.el("div", "emptyState"); state.setAttribute("role", "status");
    const icon = app.el("span", "emptyStateIcon"); icon.setAttribute("aria-hidden", "true"); icon.append(app.el("i", "bi bi-people"));
    state.append(icon, app.el("strong", "", text), app.el("span", "", hasRecords ? "Try another search or adjust the directory filters." : "Add an employee to create an employee sign-in account."));
    if (!hasRecords) {
      const button = app.el("button", "emptyStateAction", "Add employee");
      button.type = "button"; button.setAttribute("popovertarget", "addEmployeeModal"); state.append(button);
    }
    cell.append(state); row.append(cell); return row;
  }
  function departmentKey(value) { const key = String(value || "").trim().toLowerCase(); return key === "people & culture" ? "people" : key; }
  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase();
  }
  function render() {
    try {
      const employees = HCM.getUsers().filter(function (user) { return user.role === "employee"; });
      const query = (search.value || "").trim().toLowerCase();
      const selectedStatus = statusFilter.value; const department = departmentFilter.value;
      const filtered = employees.filter(function (employee) {
        const matchesQuery = !query || [employee.name, employee.employeeId, employee.email, employee.department].some(function (value) { return String(value || "").toLowerCase().includes(query); });
        const matchesStatus = selectedStatus === "all" || (selectedStatus === "active" ? employee.active !== false : employee.active === false);
        return matchesQuery && matchesStatus && (department === "all" || departmentKey(employee.department) === department);
      });
      const activeCount = employees.filter(function (employee) { return employee.active !== false; }).length;
      const inactiveCount = employees.length - activeCount;
      const lead = document.querySelector(".overviewLead strong"); if (lead) lead.textContent = employees.length + (employees.length === 1 ? " employee" : " employees");
      document.querySelectorAll(".overviewMetric").forEach(function (metric) {
        const label = metric.querySelector("span:not(.metricDot)"); const value = metric.querySelector("strong");
        if (!label || !value) return;
        if (label.textContent.trim() === "Active") value.textContent = String(activeCount);
        if (label.textContent.trim() === "Inactive") value.textContent = String(inactiveCount);
      });
      const total = document.querySelector(".directoryTotal"); if (total) total.textContent = filtered.length + (filtered.length === 1 ? " person" : " people");
      const footer = document.querySelector(".directoryFooter span:first-child"); if (footer) footer.textContent = "Showing " + filtered.length + " of " + employees.length + " employees";
      const existingDepartments = new Set(Array.from(departmentFilter.options).map(function (option) { return option.value; }));
      employees.forEach(function (employee) {
        const value = String(employee.department || "").trim(); const key = departmentKey(value);
        if (value && !existingDepartments.has(key)) { const option = document.createElement("option"); option.value = key; option.textContent = value; departmentFilter.append(option); existingDepartments.add(key); }
      });
      rows.replaceChildren();
      if (!filtered.length) rows.append(emptyRow(employees.length ? "No employees match these filters" : "No employees yet", employees.length > 0));
      filtered.forEach(function (employee) {
        const row = app.el("tr"); const identityCell = app.el("td"); identityCell.dataset.label = "Employee"; const identity = app.el("div", "employeeIdentity");
        identity.append(app.el("span", "employeeInitials", initials(employee.name)));
        const nameBlock = app.el("span", "employeeNameBlock"); nameBlock.append(app.el("strong", "", employee.name), app.el("small", "", employee.employeeId || "Employee ID not set"));
        identity.append(nameBlock); identityCell.append(identity);
        const departmentCell = app.el("td", "", employee.department || "—"); departmentCell.dataset.label = "Department";
        const emailCell = app.el("td", "employeeEmailCell", employee.email || "—"); emailCell.dataset.label = "Work email";
        const joinedCell = app.el("td", "", employee.joiningDate ? HCM.formatDate(employee.joiningDate) : "—"); joinedCell.dataset.label = "Joined";
        row.append(identityCell, departmentCell, emailCell, joinedCell);
        const statusCell = app.el("td"); statusCell.dataset.label = "Status"; statusCell.append(app.el("span", "statusBadge " + (employee.active === false ? "statusInactive" : "statusPresent"), employee.active === false ? "Inactive" : "Active")); row.append(statusCell);
        const actions = app.el("td", "employeeRowActions"); actions.dataset.label = "Actions";
        const edit = app.el("button", "employeeStatusToggle", "Edit"); edit.type = "button"; edit.dataset.editId = employee.id; edit.setAttribute("aria-label", "Edit " + employee.name);
        const toggle = app.el("button", "employeeStatusToggle", employee.active === false ? "Reactivate" : "Deactivate"); toggle.type = "button"; toggle.dataset.employeeId = employee.id; toggle.setAttribute("aria-label", (employee.active === false ? "Reactivate " : "Deactivate ") + employee.name);
        actions.append(edit, toggle); row.append(actions); rows.append(row);
      });
      table.classList.toggle("isEmpty", filtered.length === 0);
    } catch (error) { app.showGlobalError(error.message || "Employee records could not be loaded."); }
  }

  function openEdit(employee) {
    form.reset();
    form.dataset.editId = employee.id;
    document.getElementById("employeeName").value = employee.name || "";
    document.getElementById("employeeId").value = employee.employeeId || "";
    document.getElementById("employeeEmail").value = employee.email || "";
    document.getElementById("employeeDepartment").value = employee.department || "";
    document.getElementById("employeeJobTitle").value = employee.jobTitle || "";
    document.getElementById("employeeSalary").value = employee.monthlySalary ?? "";
    document.getElementById("employeeJoiningDate").value = employee.joiningDate || "";
    document.getElementById("employeeStatus").value = employee.active === false ? "inactive" : "active";
    passwordField.hidden = true; passwordInput.required = false; passwordInput.value = "";
    title.textContent = "Edit employee"; saveButton.textContent = "Save changes";
    app.setMessage(message, "", "");
    if (!modal.matches(":popover-open")) modal.showPopover();
  }
  function resetFormMode() {
    form.reset(); delete form.dataset.editId;
    passwordField.hidden = false; passwordInput.required = true;
    title.textContent = "Add employee"; saveButton.textContent = "Save employee";
    app.setMessage(message, "", "");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    app.setMessage(message, "", "");
    try {
      const editingId = form.dataset.editId || "";
      const name = document.getElementById("employeeName").value.trim();
      const employeeId = document.getElementById("employeeId").value.trim();
      const email = document.getElementById("employeeEmail").value.trim().toLowerCase();
      const password = passwordInput.value;
      const salaryValue = document.getElementById("employeeSalary").value.trim();
      const departmentValue = document.getElementById("employeeDepartment").value.trim();
      const users = HCM.getUsers();
      if (window.HCMDemo && window.HCMDemo.isReservedEmail(email)) throw new Error("That email address is reserved for the HCM Lite demo accounts.");
      if (users.some(function (user) { return user.id !== editingId && String(user.email || "").toLowerCase() === email; })) throw new Error("An account with this email already exists.");
      if (users.some(function (user) { return user.id !== editingId && user.role === "employee" && String(user.employeeId || "").toLowerCase() === employeeId.toLowerCase(); })) throw new Error("This employee ID is already in use.");
      if (!editingId && password.length < 8) throw new Error("The initial password must be at least 8 characters.");
      const salary = salaryValue === "" ? null : Number(salaryValue);
      if (salary !== null && (!Number.isFinite(salary) || salary < 0)) throw new Error("Enter a valid monthly salary or leave the field blank.");
      const fields = {
        employeeId: employeeId, name: name, email: email, department: departmentValue,
        jobTitle: document.getElementById("employeeJobTitle").value.trim(),
        joiningDate: document.getElementById("employeeJoiningDate").value || "",
        monthlySalary: salary, active: document.getElementById("employeeStatus").value === "active"
      };
      if (editingId) {
        const employee = users.find(function (user) { return user.id === editingId && user.role === "employee"; });
        if (!employee) throw new Error("Employee record was not found.");
        Object.assign(employee, fields);
        HCM.saveUsers(users);
        app.setMessage(pageMessage, "Employee details updated.", "success");
      } else {
        fields.id = HCM.makeId("emp"); fields.role = "employee"; fields.password = password; fields.createdAt = new Date().toISOString();
        HCM.saveUsers(users.concat(fields));
        app.setMessage(pageMessage, "Employee account created. The employee can sign in with their work email and initial password.", "success");
      }
      form.reset();
      if (modal.matches(":popover-open")) modal.hidePopover();
      render();
    } catch (error) { console.error(error); app.setMessage(message, error.message || "Employee could not be saved.", "error"); }
  });

  rows.addEventListener("click", function (event) {
    const editButton = event.target.closest("[data-edit-id]");
    if (editButton) {
      try {
        const employee = HCM.getUsers().find(function (user) { return user.id === editButton.dataset.editId && user.role === "employee"; });
        if (!employee) throw new Error("Employee record was not found.");
        openEdit(employee);
      } catch (error) { app.showGlobalError(error.message); }
      return;
    }
    const button = event.target.closest("[data-employee-id]");
    if (!button) return;
    try {
      const users = HCM.getUsers(); const employee = users.find(function (user) { return user.id === button.dataset.employeeId && user.role === "employee"; });
      if (!employee) throw new Error("Employee record was not found.");
      employee.active = employee.active === false; HCM.saveUsers(users); render();
    } catch (error) { app.showGlobalError(error.message); }
  });
  modal.addEventListener("toggle", function () {
    if (!modal.matches(":popover-open")) resetFormMode();
  });
  [search, statusFilter, departmentFilter].forEach(function (control) { control.addEventListener("input", render); control.addEventListener("change", render); });
  window.addEventListener("storage", function (event) { if (HCM.isDataStorageKey(event.key)) render(); });
  render();
}());




