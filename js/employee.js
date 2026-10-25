(function () {
  "use strict";
  const HCM = window.HCM; const app = window.HCMApp;
  if (!HCM || !app) return;
  const user = app.user; const message = document.getElementById("attendanceMessage");
  const leaveMessage = document.getElementById("leaveMessage");
  const checkInButton = document.getElementById("checkInButton"); const checkOutButton = document.getElementById("checkOutButton");
  const leaveForm = document.getElementById("leaveForm"); const today = HCM.localDateKey(new Date());
  const typeLabels = { annual: "Annual leave", casual: "Casual leave", sick: "Sick leave" };

  function badge(status) {
    const map = { present: "statusPresent", late: "statusLate", "half-day": "statusHalfDay", pending: "statusPending", approved: "statusApproved", rejected: "statusRejected" };
    const label = status === "half-day" ? "Half day" : status.charAt(0).toUpperCase() + status.slice(1);
    return app.el("span", "statusBadge " + (map[status] || "statusAbsent"), label);
  }
  function emptyRow(colspan, title, detail) {
    const row = app.el("tr"); const cell = app.el("td"); cell.colSpan = colspan;
    const state = app.el("div", "emptyState emptyStateCompact"); state.setAttribute("role", "status"); state.append(app.el("strong", "", title), app.el("span", "", detail));
    cell.append(state); row.append(cell); return row;
  }
  function renderCharts(attendance, summary, company) {
    if (!window.HCMCharts) return;
    const trend = HCM.attendanceTrend(attendance, [user], company, 14);
    const colors = { blue: "#2563EB", green: "#15803D", amber: "#D97706", grid: "#E2E8F0", muted: "#64748B" };
    const trendConfig = trend.length >= 2 ? { type: "line", data: { labels: trend.map(function (point) { return HCM.formatDate(point.date, { month: "short", day: "numeric" }); }), datasets: [
      { label: "On time", data: trend.map(function (point) { return point.onTime; }), borderColor: colors.green, backgroundColor: colors.green, tension: 0.3, pointRadius: 3, borderWidth: 2 },
      { label: "Late", data: trend.map(function (point) { return point.late; }), borderColor: colors.amber, backgroundColor: colors.amber, tension: 0.3, pointRadius: 3, borderWidth: 2 },
      { label: "Half day", data: trend.map(function (point) { return point.halfDay; }), borderColor: colors.blue, backgroundColor: colors.blue, tension: 0.3, pointRadius: 3, borderWidth: 2 }
    ] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, interaction: { intersect: false, mode: "index" }, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 14, color: colors.muted, font: { family: "Inter, sans-serif", size: 10 } } } }, scales: { x: { grid: { display: false }, ticks: { color: colors.muted, maxRotation: 0, autoSkip: true } }, y: { beginAtZero: true, ticks: { precision: 0, color: colors.muted }, grid: { color: colors.grid } } } } } : null;
    window.HCMCharts.render("employeeAttendanceTrend", trendConfig, trend.map(function (point) { return HCM.formatDate(point.date) + ": " + point.onTime + " on time, " + point.late + " late, " + point.halfDay + " half day"; }).join("; "), "At least two workdays with your recorded check-ins are needed to show a trend.");

    const applied = Math.min(summary.quota, summary.approvedDays);
    const balanceConfig = summary.quota > 0 ? { type: "doughnut", data: { labels: ["Remaining", "Approved"], datasets: [{ data: [summary.remaining, applied], backgroundColor: [colors.blue, "#CBD5E1"], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "70%", animation: { duration: 0 }, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 12, color: colors.muted, font: { family: "Inter, sans-serif", size: 10 } } } } } } : null;
    const balanceLabel = "Annual leave balance: " + summary.remaining + " days remaining, " + summary.approvedDays + " days approved, " + summary.pendingDays + " days pending. Pending days do not reduce the balance.";
    window.HCMCharts.render("employeeLeaveBalanceChart", balanceConfig, balanceLabel, "No annual leave quota is configured.");
  }
  function render() {
    try {
      const company = HCM.getCompany() || HCM.DEFAULT_POLICY;
      const attendance = HCM.getAttendance().filter(function (record) { return record.employeeId === user.id; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
      const leaves = HCM.getLeaves().filter(function (leave) { return leave.employeeId === user.id; }).sort(function (a, b) { return String(b.appliedAt || "").localeCompare(String(a.appliedAt || "")); });
      const todayRecord = attendance.find(function (record) { return record.date === today; });
      const workday = HCM.isWorkingDay(today, company);
      const approvedLeaveToday = leaves.some(function (leave) { return leave.status === "approved" && leave.startDate <= today && leave.endDate >= today; });
      const statusText = !workday ? "Not scheduled today" : approvedLeaveToday && !todayRecord ? "On approved leave" : !todayRecord ? "Not checked in" : todayRecord.checkOut ? "Checked out" : "Checked in";
      document.getElementById("attendanceState").textContent = statusText;
      document.getElementById("attendanceStateCopy").textContent = statusText;
      document.getElementById("attendanceCheckIn").textContent = todayRecord ? HCM.formatTime(todayRecord.checkIn) : "—";
      document.getElementById("attendanceCheckOut").textContent = todayRecord && todayRecord.checkOut ? HCM.formatTime(todayRecord.checkOut) : "—";
      document.getElementById("attendanceDuration").textContent = todayRecord ? HCM.formatDuration(HCM.durationMinutes(todayRecord)) : "—";
      const canStart = workday && !todayRecord && !approvedLeaveToday;
      const canEnd = workday && todayRecord && !todayRecord.checkOut;
      checkInButton.disabled = !canStart; checkOutButton.disabled = !canEnd;
      if (!workday) app.setMessage(message, "Your company schedule does not include today.", "");
      else if (approvedLeaveToday && !todayRecord) app.setMessage(message, "You have approved leave today. Attendance actions are unavailable.", "");
      else if (todayRecord && todayRecord.checkOut) app.setMessage(message, "Today's attendance has been checked out.", "");
      else app.setMessage(message, "", "");

      const summary = HCM.annualLeaveSummary(user.id);
      renderCharts(attendance, summary, company);
      document.getElementById("leaveBalanceRemaining").textContent = String(summary.remaining);
      document.getElementById("leaveBalanceRemainingPanel").textContent = String(summary.remaining);
      document.getElementById("leaveBalanceQuota").textContent = String(summary.quota);
      document.getElementById("leaveBalanceApproved").textContent = String(summary.approvedDays);
      document.getElementById("leaveBalancePending").textContent = String(summary.pendingDays);
      document.getElementById("pendingLeaveCount").textContent = String(leaves.filter(function (leave) { return leave.status === "pending"; }).length);
      const salary = Number(user.monthlySalary);
      document.getElementById("salarySummary").textContent = Number.isFinite(salary) && salary > 0 ? HCM.formatMoney(salary, company.currency) : "Not configured";
      document.getElementById("employeeWelcome").textContent = user.name;
      document.getElementById("employeeWelcomeDate").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

      const attendanceBody = document.getElementById("myAttendanceRows"); attendanceBody.replaceChildren();
      attendance.slice(0, 8).forEach(function (record) {
        const row = app.el("tr");
        const dateCell = app.el("td", "", HCM.formatDate(record.date)); dateCell.dataset.label = "Date";
        const inCell = app.el("td", "", HCM.formatTime(record.checkIn)); inCell.dataset.label = "Check-in";
        const outCell = app.el("td", "", HCM.formatTime(record.checkOut)); outCell.dataset.label = "Check-out";
        const state = app.el("td"); state.dataset.label = "Status"; state.append(badge(HCM.attendanceStatus(record, company)));
        const durationCell = app.el("td", "", HCM.formatDuration(HCM.durationMinutes(record))); durationCell.dataset.label = "Worked";
        row.append(dateCell, inCell, outCell, state, durationCell); attendanceBody.append(row);
      });
      if (!attendance.length) attendanceBody.append(emptyRow(5, "No attendance records yet", "Your check-in and check-out history will appear here."));

      const leaveBody = document.getElementById("myLeaveRows"); leaveBody.replaceChildren();
      leaves.slice(0, 6).forEach(function (leave) {
        const row = app.el("tr");
        const typeCell = app.el("td", "", typeLabels[leave.type] || leave.type); typeCell.dataset.label = "Leave type";
        const datesCell = app.el("td", "", HCM.formatDate(leave.startDate) + " – " + HCM.formatDate(leave.endDate)); datesCell.dataset.label = "Dates";
        const daysCell = app.el("td", "", String(leave.days || 0)); daysCell.dataset.label = "Working days";
        const state = app.el("td"); state.dataset.label = "Status"; state.append(badge(leave.status));
        row.append(typeCell, datesCell, daysCell, state); leaveBody.append(row);
      });
      if (!leaves.length) leaveBody.append(emptyRow(4, "No leave requests yet", "Submit a request using the form on this page."));
      document.getElementById("profileName").textContent = user.name;
      document.getElementById("profileEmail").textContent = user.email || "—";
      document.getElementById("profileDepartment").textContent = user.department || "—";
      document.getElementById("profileJobTitle").textContent = user.jobTitle || "—";
      document.getElementById("profileEmployeeId").textContent = user.employeeId || "—";
      document.getElementById("profileJoiningDate").textContent = user.joiningDate ? HCM.formatDate(user.joiningDate) : "—";
    } catch (error) { app.showGlobalError(error.message || "Employee information could not be loaded."); }
  }

  checkInButton.addEventListener("click", function () {
    try {
      const company = HCM.getCompany() || HCM.DEFAULT_POLICY;
      if (!user.active || !HCM.isWorkingDay(today, company)) throw new Error("Attendance is not available for today.");
      const approvedLeave = HCM.getLeaves().some(function (leave) { return leave.employeeId === user.id && leave.status === "approved" && leave.startDate <= today && leave.endDate >= today; });
      if (approvedLeave) throw new Error("You have approved leave today, so check-in is unavailable.");
      const records = HCM.getAttendance();
      if (records.some(function (record) { return record.employeeId === user.id && record.date === today; })) throw new Error("You have already checked in today.");
      const now = new Date(); const time = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      records.push({ id: HCM.makeId("att"), employeeId: user.id, date: today, checkIn: time, checkOut: "" });
      HCM.saveAttendance(records); app.setMessage(message, "Check-in recorded at " + HCM.formatTime(time) + ".", "success"); render();
    } catch (error) { app.setMessage(message, error.message, "error"); }
  });
  checkOutButton.addEventListener("click", function () {
    try {
      const records = HCM.getAttendance(); const record = records.find(function (item) { return item.employeeId === user.id && item.date === today; });
      if (!record || !record.checkIn) throw new Error("Check in before checking out.");
      if (record.checkOut) throw new Error("You have already checked out today.");
      const now = new Date(); const time = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      if (time <= record.checkIn) throw new Error("Check-out time must be later than check-in.");
      record.checkOut = time; HCM.saveAttendance(records); app.setMessage(message, "Check-out recorded at " + HCM.formatTime(time) + ".", "success"); render();
    } catch (error) { app.setMessage(message, error.message, "error"); }
  });

  leaveForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!leaveForm.reportValidity()) return;
    try {
      if (!user.active || HCM.currentUser().id !== user.id) throw new Error("Your active employee account could not be verified.");
      const type = document.getElementById("leaveType").value;
      const startDate = document.getElementById("leaveStart").value;
      const endDate = document.getElementById("leaveEnd").value;
      const todayKey = HCM.localDateKey(new Date());
      if (!HCM.parseLocalDate(startDate) || !HCM.parseLocalDate(endDate) || startDate < todayKey || endDate < startDate) throw new Error("Choose valid dates on or after today.");
      const company = HCM.getCompany() || HCM.DEFAULT_POLICY;
      const days = HCM.workingDaysBetween(startDate, endDate, company);
      if (!days) throw new Error("The selected date range does not contain any company working days.");
      const leaves = HCM.getLeaves();
      const overlap = leaves.some(function (leave) {
        return leave.employeeId === user.id && ["pending", "approved"].includes(leave.status) && leave.startDate <= endDate && leave.endDate >= startDate;
      });
      if (overlap) throw new Error("This date range overlaps an existing pending or approved request.");
      leaves.push({ id: HCM.makeId("leave"), employeeId: user.id, type: type, typeLabel: typeLabels[type], startDate: startDate, endDate: endDate, days: days, reason: document.getElementById("leaveReason").value.trim(), status: "pending", appliedAt: new Date().toISOString() });
      HCM.saveLeaves(leaves); leaveForm.reset(); app.setMessage(leaveMessage, "Leave request submitted for administrator review.", "success"); render();
    } catch (error) { app.setMessage(leaveMessage, error.message || "Leave request could not be submitted.", "error"); }
  });

  const startInput = document.getElementById("leaveStart"); const endInput = document.getElementById("leaveEnd");
  startInput.min = today; endInput.min = today;
  startInput.addEventListener("change", function () { endInput.min = startInput.value || today; });
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








