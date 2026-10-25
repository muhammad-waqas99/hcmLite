(function () {
  "use strict";
  const HCM = window.HCM; const app = window.HCMApp;
  if (!HCM || !app) return;
  const rows = document.getElementById("leaveRequestRows");
  const table = document.querySelector(".requestTable");
  const search = document.getElementById("leaveSearch");
  const statusFilter = document.getElementById("leaveStatusFilter");
  const typeFilter = document.getElementById("leaveTypeFilter");
  const reviewList = document.getElementById("reviewRequests");
  const outList = document.getElementById("leaveOutToday");
  const labels = { annual: "Annual leave", casual: "Casual leave", sick: "Sick leave" };

  function badge(status) {
    const classes = { pending: "statusPending", approved: "statusApproved", rejected: "statusRejected" };
    return app.el("span", "statusBadge " + (classes[status] || "statusPending"), status.charAt(0).toUpperCase() + status.slice(1));
  }
  function emptyRow(text) {
    const row = app.el("tr"); const cell = app.el("td"); cell.colSpan = 7;
    const empty = app.el("div", "emptyState"); empty.setAttribute("role", "status");
    const icon = app.el("span", "emptyStateIcon"); icon.setAttribute("aria-hidden", "true"); icon.append(app.el("i", "bi bi-calendar2-x"));
    empty.append(icon, app.el("strong", "", text), app.el("span", "", "Requests from employee accounts will appear here."));
    cell.append(empty); row.append(cell); return row;
  }
  function showSummaryEmpty(container, iconName, title, detail) {
    container.replaceChildren();
    const state = app.el("div", "emptyState emptyStateCompact"); state.setAttribute("role", "status");
    const icon = app.el("span", "emptyStateIcon"); icon.setAttribute("aria-hidden", "true"); icon.append(app.el("i", "bi " + iconName));
    state.append(icon, app.el("strong", "", title), app.el("span", "", detail)); container.append(state);
  }
  function summaryList(container, leaves, employees, emptyTitle, emptyDetail) {
    container.replaceChildren();
    if (!leaves.length) { showSummaryEmpty(container, "bi-inbox", emptyTitle, emptyDetail); return; }
    const list = app.el("div", "pendingLeaveList");
    leaves.slice(0, 5).forEach(function (leave) {
      const employee = employees.find(function (user) { return user.id === leave.employeeId; });
      if (!employee) return;
      const item = app.el("div", "pendingLeaveItem");
      item.append(app.el("strong", "", employee.name), app.el("span", "", (labels[leave.type] || leave.type) + (leave.days ? " · " + leave.days + " working days" : "")), app.el("small", "", HCM.formatDate(leave.startDate) + " – " + HCM.formatDate(leave.endDate)));
      list.append(item);
    });
    if (!list.children.length) showSummaryEmpty(container, "bi-inbox", emptyTitle, emptyDetail);
    else container.append(list);
  }
  function render() {
    try {
      const users = HCM.getUsers(); const employees = users.filter(function (user) { return user.role === "employee"; });
      const leaves = HCM.getLeaves(); const today = HCM.localDateKey(new Date());
      const statuses = HCM.leaveStatusSummary(leaves);
      const pending = leaves.filter(function (leave) { return leave.status === "pending"; });
      const approved = leaves.filter(function (leave) { return leave.status === "approved"; });
      const rejected = leaves.filter(function (leave) { return leave.status === "rejected"; });
      const outTodayRequests = approved.filter(function (leave) { return leave.startDate <= today && leave.endDate >= today; });
      const outByEmployee = new Map();
      outTodayRequests.forEach(function (leave) { if (!outByEmployee.has(leave.employeeId)) outByEmployee.set(leave.employeeId, leave); });
      const values = [statuses.pending, statuses.approved, statuses.rejected, outByEmployee.size];
      document.querySelectorAll(".leaveStats .leaveStatValue").forEach(function (node, index) { node.textContent = String(values[index] || 0); });
      document.querySelectorAll(".leaveStats .leaveStatFoot").forEach(function (node, index) {
        const notes = [
          pending.length ? "Awaiting administrator decision" : "No pending requests",
          approved.length ? "Approved requests on record" : "No approved requests",
          rejected.length ? "Rejected requests on record" : "No rejected requests",
          outByEmployee.size ? "On approved leave today" : "No approved leave today"
        ];
        if (node.lastChild) node.lastChild.textContent = notes[index] || "";
      });
      const reviewCount = document.querySelector(".reviewPanel .panelCount"); if (reviewCount) reviewCount.textContent = String(pending.length);
      const todayLabel = document.querySelector(".outTodayPanel .todayDate");
      if (todayLabel) todayLabel.textContent = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date());
      summaryList(reviewList, pending, employees, "No leave requests to review", "New employee requests will appear here.");
      summaryList(outList, Array.from(outByEmployee.values()), employees, "No one is marked out today", "Approved leave for today will appear here.");

      const query = (search.value || "").trim().toLowerCase();
      const selectedStatus = statusFilter.value; const selectedType = typeFilter.value;
      const filtered = leaves.filter(function (leave) {
        const employee = employees.find(function (user) { return user.id === leave.employeeId; });
        const matchesQuery = !query || [employee && employee.name, employee && employee.employeeId].some(function (value) { return String(value || "").toLowerCase().includes(query); });
        return matchesQuery && (selectedStatus === "all" || leave.status === selectedStatus) && (selectedType === "all" || leave.type === selectedType);
      }).sort(function (a, b) { return String(b.appliedAt || "").localeCompare(String(a.appliedAt || "")); });

      rows.replaceChildren();
      filtered.forEach(function (leave) {
        const employee = employees.find(function (user) { return user.id === leave.employeeId; });
        const row = app.el("tr"); const person = app.el("td"); person.dataset.label = "Employee";
        person.append(app.el("strong", "leaveEmployeeName", employee ? employee.name : "Employee record unavailable"), app.el("small", "leaveEmployeeId", employee ? employee.employeeId : "Record needs review"));
        const typeCell = app.el("td"); typeCell.dataset.label = "Leave type"; typeCell.append(app.el("span", "", labels[leave.type] || leave.type)); if (leave.reason) typeCell.append(app.el("small", "leaveReason", leave.reason));
        const datesCell = app.el("td", "leaveDatesCell", HCM.formatDate(leave.startDate) + " – " + HCM.formatDate(leave.endDate)); datesCell.dataset.label = "Dates";
        const daysCell = app.el("td", "", String(leave.days || 0)); daysCell.dataset.label = "Working days";
        const appliedCell = app.el("td", "", leave.appliedAt ? HCM.formatDate(leave.appliedAt.slice(0, 10)) : "—"); appliedCell.dataset.label = "Applied";
        row.append(person, typeCell, datesCell, daysCell, appliedCell);
        const statusCell = app.el("td"); statusCell.dataset.label = "Status"; statusCell.append(badge(leave.status)); row.append(statusCell);
        const actions = app.el("td", "leaveActionCell"); actions.dataset.label = "Actions";
        if (leave.status === "pending") {
          const approve = app.el("button", "leaveDecisionButton approveButton", "Approve"); approve.type = "button"; approve.dataset.leaveId = leave.id; approve.dataset.decision = "approved";
          const reject = app.el("button", "leaveDecisionButton rejectButton", "Reject"); reject.type = "button"; reject.dataset.leaveId = leave.id; reject.dataset.decision = "rejected";
          actions.append(approve, reject);
        } else actions.textContent = "—";
        row.append(actions); rows.append(row);
      });
      if (!filtered.length) rows.append(emptyRow(leaves.length ? "No requests match these filters" : "No leave requests yet"));
      table.classList.toggle("isEmpty", filtered.length === 0);
      const footer = document.querySelector(".tableFooter span:first-child"); if (footer) footer.textContent = "Showing " + filtered.length + " of " + leaves.length + " requests";
    } catch (error) { app.showGlobalError(error.message || "Leave records could not be loaded."); }
  }

  rows.addEventListener("click", function (event) {
    const button = event.target.closest("[data-decision]");
    if (!button) return;
    try {
      const leaves = HCM.getLeaves(); const leave = leaves.find(function (item) { return item.id === button.dataset.leaveId; });
      if (!leave || leave.status !== "pending") throw new Error("This request has already been reviewed or no longer exists.");
      if (button.dataset.decision === "approved") {
        const company = HCM.getCompany() || HCM.DEFAULT_POLICY;
        const recalculatedDays = HCM.workingDaysBetween(leave.startDate, leave.endDate, company);
        if (!recalculatedDays) throw new Error("The request contains no working days under the current company schedule.");
        leave.days = recalculatedDays;
      }
      leave.status = button.dataset.decision; leave.reviewedAt = new Date().toISOString(); leave.reviewedBy = app.user.id;
      HCM.saveLeaves(leaves); render();
    } catch (error) { app.showGlobalError(error.message); }
  });
  [search, statusFilter, typeFilter].forEach(function (control) { control.addEventListener("input", render); control.addEventListener("change", render); });
  window.addEventListener("storage", function (event) { if (HCM.isDataStorageKey(event.key)) render(); });
  render();
}());


