(function () {
  "use strict";

  const KEYS = Object.freeze({ company: "hcm_company", users: "hcm_users", attendance: "hcm_attendance", leaves: "hcm_leaves", session: "hcm_session" });
  const DEMO_KEYS = Object.freeze({ company: "hcm_demo_company", users: "hcm_demo_users", attendance: "hcm_demo_attendance", leaves: "hcm_demo_leaves", initialized: "hcm_demo_initialized" });
  const DEFAULT_POLICY = Object.freeze({ officeStart: "09:00", officeEnd: "17:00", gracePeriodMinutes: 10, workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"], annualLeaveQuota: 20, currency: "PKR" });

  function read(key, fallback) {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    try { return JSON.parse(value); }
    catch (error) {
      console.error("Invalid LocalStorage value for " + key + ".", error);
      throw new Error("Saved " + key.replace("hcm_", "") + " data is unreadable. Review browser storage before continuing.");
    }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function getSession() { const value = read(KEYS.session, null); return value && typeof value === "object" ? value : null; }
  function getDataMode() { const session = getSession(); return session && session.mode === "demo" ? "demo" : "normal"; }
  function dataKey(name, mode) { return (mode || getDataMode()) === "demo" ? DEMO_KEYS[name] : KEYS[name]; }
  function makeId(prefix) {
    const part = window.crypto && typeof window.crypto.randomUUID === "function" ? window.crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    return prefix + "-" + part;
  }
  function localDateKey(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }
  function parseLocalDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
    const parts = value.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
    return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2] ? date : null;
  }
  function monthParts(monthKey) {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(monthKey || ""));
    if (!match) return null;
    const year = Number(match[1]); const month = Number(match[2]);
    return { year: year, month: month, start: match[1] + "-" + match[2] + "-01", end: localDateKey(new Date(year, month, 0, 12)) };
  }
  function formatDate(value, options) {
    const date = parseLocalDate(value);
    return date ? new Intl.DateTimeFormat(undefined, options || { day: "numeric", month: "short", year: "numeric" }).format(date) : "Not provided";
  }
  function formatTime(value) {
    if (!/^\d{2}:\d{2}$/.test(String(value || ""))) return "—";
    const parts = value.split(":").map(Number);
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, parts[0], parts[1]));
  }
  function getCompany() {
    const company = read(dataKey("company"), null);
    return company && typeof company === "object" ? { ...DEFAULT_POLICY, ...company } : null;
  }
  function records(name, mode, fallback) { const value = read(dataKey(name, mode), fallback); if (!Array.isArray(value)) throw new Error("Saved " + name + " data has an invalid format."); return value; }
  function getUsers() { return records("users", null, []); }
  function getAttendance() { return records("attendance", null, []); }
  function getLeaves() { return records("leaves", null, []); }
  function saveCompany(value) { write(dataKey("company"), value); }
  function saveUsers(value) { write(dataKey("users"), value); }
  function saveAttendance(value) { write(dataKey("attendance"), value); }
  function saveLeaves(value) { write(dataKey("leaves"), value); }
  function getNormalCompany() { const value = read(KEYS.company, null); return value && typeof value === "object" ? { ...DEFAULT_POLICY, ...value } : null; }
  function getNormalUsers() { return records("users", "normal", []); }
  function saveNormalCompany(value) { write(KEYS.company, value); }
  function saveNormalUsers(value) { write(KEYS.users, value); }
  function getDemoCompany() { const value = read(DEMO_KEYS.company, null); return value && typeof value === "object" ? { ...DEFAULT_POLICY, ...value } : null; }
  function getDemoUsers() { return records("users", "demo", []); }
  function getDemoAttendance() { return records("attendance", "demo", []); }
  function getDemoLeaves() { return records("leaves", "demo", []); }
  function replaceDemoData(dataset) {
    if (!dataset || !dataset.company || !Array.isArray(dataset.users) || !Array.isArray(dataset.attendance) || !Array.isArray(dataset.leaves)) throw new Error("Demo data is incomplete and was not saved.");
    write(DEMO_KEYS.company, dataset.company);
    write(DEMO_KEYS.users, dataset.users);
    write(DEMO_KEYS.attendance, dataset.attendance);
    write(DEMO_KEYS.leaves, dataset.leaves);
    write(DEMO_KEYS.initialized, { version: 1, seededAt: new Date().toISOString() });
  }
  function isDemoSession() { return getDataMode() === "demo"; }
  function isDataStorageKey(key) { return !key || [KEYS.session, KEYS.company, KEYS.users, KEYS.attendance, KEYS.leaves, DEMO_KEYS.company, DEMO_KEYS.users, DEMO_KEYS.attendance, DEMO_KEYS.leaves, DEMO_KEYS.initialized].includes(key); }
  function currentUser() {
    const session = getSession();
    if (!session || !session.userId) return null;
    const mode = session.mode === "demo" ? "demo" : "normal";
    const user = records("users", mode, []).find(function (item) { return item.id === session.userId; });
    return user && user.active !== false && ["admin", "employee"].includes(user.role) ? user : null;
  }
  function startSession(user, mode) { write(KEYS.session, { userId: user.id, role: user.role, signedInAt: new Date().toISOString(), mode: mode === "demo" ? "demo" : "normal" }); }
  function clearSession() { localStorage.removeItem(KEYS.session); }
  function redirectForRole(role) { window.location.replace(role === "admin" ? "admin.html" : "employee.html"); }
  function guard(requiredRole) {
    let user;
    try { user = currentUser(); }
    catch (error) {
      console.error(error);
      const notice = document.createElement("p");
      notice.className = "appDataError";
      notice.setAttribute("role", "alert");
      notice.textContent = error.message || "Saved application data could not be read.";
      document.body.prepend(notice);
      return null;
    }
    if (!user) { clearSession(); window.location.replace("signIn.html"); return null; }
    if (requiredRole && user.role !== requiredRole) { redirectForRole(user.role); return null; }
    return user;
  }
  function weekdayKey(date) { return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()]; }
  function isWorkingDay(key, policy) {
    const date = parseLocalDate(key);
    const days = policy && Array.isArray(policy.workingDays) ? policy.workingDays : DEFAULT_POLICY.workingDays;
    return Boolean(date && days.includes(weekdayKey(date)));
  }
  function workingDaysBetween(startKey, endKey, policy) {
    const start = parseLocalDate(startKey); const end = parseLocalDate(endKey);
    if (!start || !end || start > end) return 0;
    let count = 0; const cursor = new Date(start);
    while (cursor <= end) { if (isWorkingDay(localDateKey(cursor), policy)) count += 1; cursor.setDate(cursor.getDate() + 1); }
    return count;
  }
  function attendanceStatus(record, policy) {
    if (!record || !record.checkIn) return "absent";
    const start = String(policy.officeStart || "09:00").split(":").map(Number);
    const grace = Number(policy.gracePeriodMinutes) || 0;
    const checkIn = record.checkIn.split(":").map(Number);
    const late = checkIn[0] * 60 + checkIn[1] > start[0] * 60 + start[1] + grace;
    if (record.checkOut) {
      const end = String(policy.officeEnd || "17:00").split(":").map(Number);
      const scheduled = Math.max(1, end[0] * 60 + end[1] - start[0] * 60 - start[1]);
      const checkOut = record.checkOut.split(":").map(Number);
      if (checkOut[0] * 60 + checkOut[1] - checkIn[0] * 60 - checkIn[1] < scheduled / 2) return "half-day";
    }
    return late ? "late" : "present";
  }
  function leaveStatusSummary(leaves) {
    const source = Array.isArray(leaves) ? leaves : getLeaves();
    return source.reduce(function (summary, leave) {
      if (leave && Object.prototype.hasOwnProperty.call(summary, leave.status)) summary[leave.status] += 1;
      return summary;
    }, { pending: 0, approved: 0, rejected: 0 });
  }
  function attendanceSummary(dateKey, nowValue) {
    const key = dateKey || localDateKey(new Date());
    const date = parseLocalDate(key);
    const now = nowValue instanceof Date ? nowValue : new Date();
    const company = getCompany() || DEFAULT_POLICY;
    const empty = { date: key, isWorkingDay: false, isClosed: false, eligibleCount: 0, onTime: 0, late: 0, halfDay: 0, onLeave: 0, absent: 0, unreported: 0, recordCount: 0, hasEvidence: false };
    if (!date || key > localDateKey(now) || !isWorkingDay(key, company)) return empty;
    const employees = getUsers().filter(function (user) {
      return user && user.role === "employee" && user.active !== false && (!user.joiningDate || user.joiningDate <= key);
    });
    const eligible = new Map(employees.map(function (user) { return [user.id, user]; }));
    const attendance = new Map();
    getAttendance().forEach(function (record) {
      if (record && record.date === key && eligible.has(record.employeeId) && record.checkIn && !attendance.has(record.employeeId)) attendance.set(record.employeeId, record);
    });
    const approvedLeave = new Set();
    getLeaves().forEach(function (leave) {
      if (leave && leave.status === "approved" && leave.startDate <= key && leave.endDate >= key && eligible.has(leave.employeeId)) approvedLeave.add(leave.employeeId);
    });
    const end = String(company.officeEnd || DEFAULT_POLICY.officeEnd).split(":").map(Number);
    const today = localDateKey(now);
    const isClosed = key < today || (now.getHours() * 60 + now.getMinutes() >= end[0] * 60 + end[1]);
    const counts = { onTime: 0, late: 0, halfDay: 0, onLeave: 0 };
    attendance.forEach(function (record) {
      const status = attendanceStatus(record, company);
      if (status === "late") counts.late += 1;
      else if (status === "half-day") counts.halfDay += 1;
      else counts.onTime += 1;
    });
    employees.forEach(function (employee) {
      if (!attendance.has(employee.id) && approvedLeave.has(employee.id)) counts.onLeave += 1;
    });
    const hasEvidence = attendance.size > 0 || counts.onLeave > 0;
    const absent = isClosed && hasEvidence ? Math.max(0, employees.length - attendance.size - counts.onLeave) : 0;
    return { date: key, isWorkingDay: true, isClosed: isClosed, eligibleCount: employees.length, onTime: counts.onTime, late: counts.late, halfDay: counts.halfDay, onLeave: counts.onLeave, absent: absent, unreported: Math.max(0, employees.length - attendance.size - counts.onLeave - absent), recordCount: attendance.size, hasEvidence: hasEvidence };
  }
  function attendanceTrend(records, employees, policy, limit, endDate) {
    const actualToday = localDateKey(new Date());
    const requestedEnd = endDate || actualToday;
    const today = requestedEnd > actualToday ? actualToday : requestedEnd;
    const maxDays = Math.max(1, Number(limit) || 14);
    const employeeMap = new Map((employees || []).filter(function (user) { return user && user.id && user.role === "employee" && user.active !== false; }).map(function (user) { return [user.id, user]; }));
    const validDays = new Set(); const dates = [];
    const cursor = parseLocalDate(today);
    let scanned = 0;
    while (cursor && dates.length < maxDays && scanned < maxDays * 7) {
      const key = localDateKey(cursor);
      if (isWorkingDay(key, policy || DEFAULT_POLICY)) { dates.unshift(key); validDays.add(key); }
      cursor.setDate(cursor.getDate() - 1); scanned += 1;
    }
    const byDate = new Map();
    (Array.isArray(records) ? records : []).forEach(function (record) {
      if (!record || !record.checkIn || !validDays.has(record.date) || !employeeMap.has(record.employeeId)) return;
      const employee = employeeMap.get(record.employeeId);
      if (employee.joiningDate && employee.joiningDate > record.date) return;
      if (!byDate.has(record.date)) byDate.set(record.date, new Map());
      const day = byDate.get(record.date);
      if (!day.has(record.employeeId)) day.set(record.employeeId, record);
    });
    return dates.filter(function (key) { return byDate.has(key); }).map(function (key) {
      const counts = { onTime: 0, late: 0, halfDay: 0 };
      byDate.get(key).forEach(function (record) {
        const status = attendanceStatus(record, policy || DEFAULT_POLICY);
        if (status === "late") counts.late += 1;
        else if (status === "half-day") counts.halfDay += 1;
        else counts.onTime += 1;
      });
      return { date: key, onTime: counts.onTime, late: counts.late, halfDay: counts.halfDay };
    });
  }
  function durationMinutes(record) {
    if (!record || !record.checkIn || !record.checkOut) return null;
    const inParts = record.checkIn.split(":").map(Number); const outParts = record.checkOut.split(":").map(Number);
    const duration = outParts[0] * 60 + outParts[1] - inParts[0] * 60 - inParts[1];
    return duration >= 0 ? duration : null;
  }
  function formatDuration(minutes) { return minutes === null || minutes === undefined ? "In progress" : Math.floor(minutes / 60) + "h " + (minutes % 60) + "m"; }
  function annualLeaveSummary(employeeId) {
    const company = getCompany() || DEFAULT_POLICY;
    const leaves = getLeaves().filter(function (leave) { return leave.employeeId === employeeId && leave.type === "annual"; });
    const approvedDays = leaves.filter(function (leave) { return leave.status === "approved"; }).reduce(function (sum, leave) { return sum + Number(leave.days || 0); }, 0);
    const pendingDays = leaves.filter(function (leave) { return leave.status === "pending"; }).reduce(function (sum, leave) { return sum + Number(leave.days || 0); }, 0);
    const quota = Math.max(0, Number(company.annualLeaveQuota === undefined ? DEFAULT_POLICY.annualLeaveQuota : company.annualLeaveQuota));
    return { quota: quota, approvedDays: approvedDays, pendingDays: pendingDays, remaining: Math.max(0, quota - approvedDays) };
  }
  function calculatePayroll(employee, monthKey) {
    const period = monthParts(monthKey); const company = getCompany();
    if (!period) return { valid: false, reason: "Choose a valid payroll month." };
    if (!company) return { valid: false, reason: "Company settings are not available." };
    const currentMonth = localDateKey(new Date()).slice(0, 7);
    if (monthKey > currentMonth) return { valid: false, reason: "Future payroll periods cannot be calculated." };
    if (monthKey < currentMonth) return { valid: false, reason: "Historical salary snapshots are not stored, so only the current period can be estimated." };
    if (!Number.isFinite(Number(employee.monthlySalary)) || Number(employee.monthlySalary) <= 0) return { valid: false, reason: "A monthly salary has not been configured for this employee." };
    if (!parseLocalDate(employee.joiningDate)) return { valid: false, reason: "A joining date is required to calculate the eligible payroll period." };
    const today = localDateKey(new Date()); const cutoff = today < period.end ? today : period.end;
    const employmentStart = parseLocalDate(employee.joiningDate) && employee.joiningDate > period.start ? employee.joiningDate : period.start;
    const eligibleDays = workingDaysBetween(employmentStart, cutoff, company);
    const records = getAttendance().filter(function (record) { return record.employeeId === employee.id && record.date >= employmentStart && record.date <= cutoff; });
    if (records.length === 0) return { valid: false, reason: "No attendance records are available for this period, so a net estimate cannot be calculated." };
    const leaves = getLeaves().filter(function (leave) { return leave.employeeId === employee.id && leave.status === "approved" && leave.startDate <= cutoff && leave.endDate >= employmentStart; });
    const approvedLeaveDates = new Set();
    leaves.forEach(function (leave) {
      const first = leave.startDate < employmentStart ? employmentStart : leave.startDate;
      const last = leave.endDate > cutoff ? cutoff : leave.endDate;
      const cursor = parseLocalDate(first); const end = parseLocalDate(last);
      while (cursor && end && cursor <= end) { const key = localDateKey(cursor); if (isWorkingDay(key, company)) approvedLeaveDates.add(key); cursor.setDate(cursor.getDate() + 1); }
    });
    const recordsByDate = new Map(records.map(function (record) { return [record.date, record]; }));
    let attendedDays = 0; let halfDays = 0; let approvedLeaveDays = 0; let absentDays = 0;
    const cursor = parseLocalDate(employmentStart); const lastDay = parseLocalDate(cutoff);
    while (cursor && lastDay && cursor <= lastDay) {
      const key = localDateKey(cursor);
      if (isWorkingDay(key, company)) {
        const record = recordsByDate.get(key);
        if (record && record.checkIn) { attendedDays += 1; if (attendanceStatus(record, company) === "half-day") halfDays += 1; }
        else if (approvedLeaveDates.has(key)) approvedLeaveDays += 1;
        else absentDays += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    const monthlySalary = Number(employee.monthlySalary); const fullMonthWorkdays = workingDaysBetween(period.start, period.end, company);
    if (!fullMonthWorkdays) return { valid: false, reason: "No working days are configured for this period." };
    const perDay = monthlySalary / fullMonthWorkdays; const deduction = perDay * (absentDays + halfDays * 0.5);
    return { valid: true, currentPeriodEstimate: true, period: period, cutoff: cutoff, eligibleDays: eligibleDays, fullMonthWorkdays: fullMonthWorkdays, attendedDays: attendedDays, halfDays: halfDays, absentDays: absentDays, approvedLeaveDays: approvedLeaveDays, monthlySalary: monthlySalary, perDay: perDay, deduction: deduction, net: Math.max(0, monthlySalary - deduction), currency: company.currency || "PKR" };
  }
  function formatMoney(amount, currency) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "PKR", maximumFractionDigits: 2 }).format(Number(amount) || 0); }
    catch (error) { return (currency || "PKR") + " " + (Number(amount) || 0).toLocaleString(); }
  }

  window.HCM = Object.freeze({ KEYS: KEYS, DEMO_KEYS: DEMO_KEYS, DEFAULT_POLICY: DEFAULT_POLICY, makeId: makeId, read: read, write: write, localDateKey: localDateKey, parseLocalDate: parseLocalDate, monthParts: monthParts, formatDate: formatDate, formatTime: formatTime, formatMoney: formatMoney, formatDuration: formatDuration, durationMinutes: durationMinutes, getCompany: getCompany, getUsers: getUsers, getAttendance: getAttendance, getLeaves: getLeaves, saveCompany: saveCompany, saveUsers: saveUsers, saveAttendance: saveAttendance, saveLeaves: saveLeaves, getNormalCompany: getNormalCompany, getNormalUsers: getNormalUsers, saveNormalCompany: saveNormalCompany, saveNormalUsers: saveNormalUsers, getDemoCompany: getDemoCompany, getDemoUsers: getDemoUsers, getDemoAttendance: getDemoAttendance, getDemoLeaves: getDemoLeaves, replaceDemoData: replaceDemoData, getDataMode: getDataMode, isDemoSession: isDemoSession, isDataStorageKey: isDataStorageKey, getSession: getSession, currentUser: currentUser, startSession: startSession, clearSession: clearSession, guard: guard, redirectForRole: redirectForRole, isWorkingDay: isWorkingDay, workingDaysBetween: workingDaysBetween, attendanceStatus: attendanceStatus, attendanceSummary: attendanceSummary, attendanceTrend: attendanceTrend, leaveStatusSummary: leaveStatusSummary, annualLeaveSummary: annualLeaveSummary, calculatePayroll: calculatePayroll });
}());







