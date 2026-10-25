(function () {
  "use strict";
  const HCM = window.HCM; const app = window.HCMApp;
  if (!HCM || !app) return;
  const today = HCM.localDateKey(new Date());

  function badge(status) {
    const className = status === "half-day" ? "statusHalfDay" : status === "late" ? "statusLate" : status === "absent" ? "statusAbsent" : "statusPresent";
    const label = status === "half-day" ? "Half day" : status.charAt(0).toUpperCase() + status.slice(1);
    return app.el("span", "statusBadge " + className, label);
  }
  function empty(container, iconName, title, detail) {
    const state = app.el("div", "emptyState emptyStateCompact"); state.setAttribute("role", "status");
    const icon = app.el("span", "emptyStateIcon"); icon.setAttribute("aria-hidden", "true"); icon.append(app.el("i", "bi " + iconName));
    state.append(icon, app.el("strong", "", title), app.el("span", "", detail)); container.replaceChildren(state);
  }
  function renderCharts(active, company, daily, leaves) {
    if (!window.HCMCharts) return;
    const colors = { blue: "#2563EB", green: "#15803D", amber: "#D97706", red: "#DC2626", violet: "#7C3AED", grid: "#E2E8F0", muted: "#64748B" };
    const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: "66%", animation: { duration: 0 }, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 16, color: colors.muted, font: { family: "Inter, sans-serif", size: 11 } } } } };
    const dailyValues = [daily.onTime, daily.late, daily.halfDay, daily.onLeave, daily.absent];
    const dailyLabels = ["On time", "Late", "Half day", "On leave", "Absent"];
    const dailyColors = [colors.green, colors.amber, colors.violet, colors.blue, colors.red];
    const dailyMessage = !daily.isWorkingDay ? "No scheduled attendance for this date." : !daily.hasEvidence ? "No attendance or approved leave has been recorded for this date." : "No attendance counts are available.";
    const dailyConfig = daily.hasEvidence && dailyValues.reduce(function (sum, value) { return sum + value; }, 0) > 0 ? { type: "doughnut", data: { labels: dailyLabels, datasets: [{ data: dailyValues, backgroundColor: dailyColors, borderWidth: 0, hoverOffset: 4 }] }, options: doughnutOptions } : null;
    window.HCMCharts.render("adminAttendanceChart", dailyConfig, dailyLabels.map(function (label, index) { return label + ": " + dailyValues[index]; }).join(", "), dailyMessage);

    const leaveCounts = HCM.leaveStatusSummary(leaves);
    const leaveValues = [leaveCounts.pending, leaveCounts.approved, leaveCounts.rejected];
    const leaveLabels = ["Pending", "Approved", "Rejected"];
    const leaveColors = [colors.amber, colors.green, colors.red];
    const leaveConfig = leaveValues.some(function (value) { return value > 0; }) ? { type: "doughnut", data: { labels: leaveLabels, datasets: [{ data: leaveValues, backgroundColor: leaveColors, borderWidth: 0, hoverOffset: 4 }] }, options: doughnutOptions } : null;
    window.HCMCharts.render("adminLeaveChart", leaveConfig, leaveLabels.map(function (label, index) { return label + ": " + leaveValues[index]; }).join(", "), "No leave requests have been recorded yet.");

    const trend = HCM.attendanceTrend(HCM.getAttendance(), active, company, 14);
    const trendConfig = trend.length >= 2 ? { type: "line", data: { labels: trend.map(function (point) { return HCM.formatDate(point.date, { month: "short", day: "numeric" }); }), datasets: [
      { label: "On time", data: trend.map(function (point) { return point.onTime; }), borderColor: colors.green, backgroundColor: colors.green, tension: 0.3, pointRadius: 3, borderWidth: 2 },
      { label: "Late", data: trend.map(function (point) { return point.late; }), borderColor: colors.amber, backgroundColor: colors.amber, tension: 0.3, pointRadius: 3, borderWidth: 2 },
      { label: "Half day", data: trend.map(function (point) { return point.halfDay; }), borderColor: colors.violet, backgroundColor: colors.violet, tension: 0.3, pointRadius: 3, borderWidth: 2 }
    ] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, interaction: { intersect: false, mode: "index" }, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 16, color: colors.muted, font: { family: "Inter, sans-serif", size: 11 } } } }, scales: { x: { grid: { display: false }, ticks: { color: colors.muted, maxRotation: 0, autoSkip: true } }, y: { beginAtZero: true, ticks: { precision: 0, color: colors.muted }, grid: { color: colors.grid } } } } } : null;
    window.HCMCharts.render("adminAttendanceTrend", trendConfig, trend.map(function (point) { return HCM.formatDate(point.date) + ": " + point.onTime + " on time, " + point.late + " late, " + point.halfDay + " half day"; }).join("; "), "At least two workdays with recorded check-ins are needed to show a trend.");
  }
  function render() {
    try {
      const users = HCM.getUsers();
      const employees = users.filter(function (user) { return user.role === "employee"; });
      const active = employees.filter(function (user) { return user.active !== false && (!user.joiningDate || user.joiningDate <= today); });
      const activeIds = new Set(active.map(function (user) { return user.id; }));
      const company = HCM.getCompany() || HCM.DEFAULT_POLICY;
      const daily = HCM.attendanceSummary(today);
      const attendance = HCM.getAttendance().filter(function (record) { return record.date === today && activeIds.has(record.employeeId); });
      const leaves = HCM.getLeaves();
      const leaveStatuses = HCM.leaveStatusSummary(leaves);
      const pending = leaves.filter(function (leave) { return leave.status === "pending"; });
      const approvedToday = leaves.filter(function (leave) { return leave.status === "approved" && leave.startDate <= today && leave.endDate >= today && activeIds.has(leave.employeeId); });
      const outByEmployee = new Map();
      approvedToday.forEach(function (leave) { if (!outByEmployee.has(leave.employeeId)) outByEmployee.set(leave.employeeId, leave); });

      const stats = document.querySelectorAll(".dashboardStats .dashboardStat");
      const values = [employees.length, daily.recordCount, daily.absent, leaveStatuses.pending];
      const notes = [active.length + " active · " + (employees.length - active.length) + " inactive", daily.hasEvidence ? daily.late + " late check-ins" : "No attendance recorded yet", daily.onLeave + " on approved leave", pending.length ? "Needs administrator review" : "No requests to review"];
      stats.forEach(function (card, index) {
        const value = card.querySelector(".statContent strong"); const note = card.querySelector(".statContent small");
        if (value) value.textContent = String(values[index]);
        if (note) note.textContent = notes[index];
      });

      const counts = { "on time": daily.onTime, late: daily.late, "on leave": daily.onLeave, "half day": daily.halfDay, absent: daily.absent };
      document.querySelectorAll(".attendanceBreakdown .attendanceMetric").forEach(function (metric) {
        const label = metric.querySelector(".attendanceMetricLabel"); const value = metric.querySelector("strong");
        if (label && value) value.textContent = String(counts[label.textContent.trim().toLowerCase()] || 0);
      });
      renderCharts(active, company, daily, leaves);
      const dateChip = document.querySelector(".dateChip");
      if (dateChip) dateChip.textContent = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date());

      const attendanceHeading = document.querySelector(".attendanceTableHeading span");
      if (attendanceHeading) attendanceHeading.textContent = "Latest saved records";
      const table = document.querySelector(".dashboardTable"); const body = table && table.querySelector("tbody");
      const recent = HCM.getAttendance().filter(function (record) { return record.checkIn && activeIds.has(record.employeeId); }).slice().sort(function (a, b) { return b.date.localeCompare(a.date) || b.checkIn.localeCompare(a.checkIn); }).slice(0, 5);
      if (body) {
        body.replaceChildren();
        recent.forEach(function (record) {
          const person = employees.find(function (employee) { return employee.id === record.employeeId; }); if (!person) return;
          const row = app.el("tr");
          const dateCell = app.el("td", "", HCM.formatDate(record.date)); dateCell.dataset.label = "Date";
          const employeeCell = app.el("td", "", person.name); employeeCell.dataset.label = "Employee";
          const checkInCell = app.el("td", "", HCM.formatTime(record.checkIn)); checkInCell.dataset.label = "Check-in";
          const checkOutCell = app.el("td", "", HCM.formatTime(record.checkOut)); checkOutCell.dataset.label = "Check-out";
          const workedCell = app.el("td", "", HCM.formatDuration(HCM.durationMinutes(record))); workedCell.dataset.label = "Worked";
          const statusCell = app.el("td"); statusCell.dataset.label = "Status"; statusCell.append(badge(HCM.attendanceStatus(record, company)));
          row.append(dateCell, employeeCell, checkInCell, checkOutCell, workedCell, statusCell); body.append(row);
        });
        if (!body.children.length) {
          const row = app.el("tr"); const cell = app.el("td"); cell.colSpan = 6;
          const state = app.el("div", "emptyState emptyStateCompact"); state.setAttribute("role", "status");
          state.append(app.el("strong", "", "No attendance records yet"), app.el("span", "", "Employee check-ins will appear here when recorded."));
          cell.append(state); row.append(cell); body.append(row);
        }
        table.classList.toggle("isEmpty", !recent.length);
      }

      const team = document.querySelector(".teamSnapshot");
      if (team) {
        const departments = new Map();
        employees.forEach(function (employee) { const name = employee.department || "Unassigned"; departments.set(name, (departments.get(name) || 0) + 1); });
        team.replaceChildren();
        if (!employees.length) empty(team, "bi-people", "No employees to show", "Department totals will appear after employees are added.");
        else Array.from(departments.entries()).sort(function (a, b) { return a[0].localeCompare(b[0]); }).forEach(function (entry) {
          const row = app.el("div", "snapshotRow"); row.append(app.el("span", "", entry[0]), app.el("strong", "", String(entry[1]))); team.append(row);
        });
      }

      const pendingContainer = document.getElementById("dashboardPending");
      const pendingCount = document.querySelector(".pendingCount"); if (pendingCount) pendingCount.textContent = String(pending.length);
      if (pendingContainer) {
        pendingContainer.replaceChildren();
        if (!pending.length) empty(pendingContainer, "bi-inbox", "No requests to review", "New leave requests will appear here.");
        else {
          const list = app.el("div", "compactRecordList");
          pending.slice(0, 4).forEach(function (leave) {
            const person = employees.find(function (employee) { return employee.id === leave.employeeId; }); if (!person) return;
            const item = app.el("div", "compactRecord"); item.append(app.el("strong", "", person.name), app.el("span", "", (leave.typeLabel || leave.type + " leave") + " · " + HCM.formatDate(leave.startDate))); list.append(item);
          });
          pendingContainer.append(list);
        }
      }
      const outContainer = document.getElementById("dashboardOutToday");
      const outCount = document.querySelector(".outTodayCount"); if (outCount) outCount.textContent = outByEmployee.size + (outByEmployee.size === 1 ? " person" : " people");
      if (outContainer) {
        outContainer.replaceChildren();
        if (!outByEmployee.size) empty(outContainer, "bi-calendar2-check", "No approved leave today", "Team availability will appear here.");
        else {
          const list = app.el("div", "compactRecordList");
          outByEmployee.forEach(function (leave, employeeId) {
            const person = employees.find(function (employee) { return employee.id === employeeId; }); if (!person) return;
            const item = app.el("div", "compactRecord"); item.append(app.el("strong", "", person.name), app.el("span", "", leave.typeLabel || leave.type + " leave")); list.append(item);
          });
          outContainer.append(list);
        }
      }
    } catch (error) { app.showGlobalError(error.message || "Dashboard data could not be loaded."); }
  }
  window.addEventListener("storage", function (event) {
    if (HCM.isDataStorageKey(event.key)) render();
  });
  render();
}());



