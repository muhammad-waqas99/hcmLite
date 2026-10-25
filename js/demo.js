(function () {
  "use strict";
  const HCM = window.HCM;
  if (!HCM) return;

  const PASSWORD = "Demo@1234";
  const RESERVED_DOMAIN = "@demo.hcmlite.test";
  const adminId = "demo-admin";
  const employeeSeeds = [
    { id: "demo-emp-saqib", employeeId: "HCM-001", name: "Saqib Ahmed", email: "saqib" + RESERVED_DOMAIN, department: "Engineering", jobTitle: "Software Engineer", monthlySalary: 145000, active: true },
    { id: "demo-emp-waqas", employeeId: "HCM-002", name: "Waqas Ali", email: "waqas" + RESERVED_DOMAIN, department: "People & Culture", jobTitle: "HR Manager", monthlySalary: 165000, active: true },
    { id: "demo-emp-huzaifa", employeeId: "HCM-003", name: "Huzaifa Khan", email: "huzaifa" + RESERVED_DOMAIN, department: "Finance", jobTitle: "Finance Analyst", monthlySalary: 135000, active: true },
    { id: "demo-emp-abdullah", employeeId: "HCM-004", name: "Abdullah Raza", email: "abdullah" + RESERVED_DOMAIN, department: "Engineering", jobTitle: "QA Engineer", monthlySalary: 125000, active: true },
    { id: "demo-emp-rehaan", employeeId: "HCM-005", name: "Rehaan Siddiqui", email: "rehaan" + RESERVED_DOMAIN, department: "Marketing", jobTitle: "Marketing Specialist", monthlySalary: 118000, active: true },
    { id: "demo-emp-sara", employeeId: "HCM-006", name: "Sara Noor", email: "sara" + RESERVED_DOMAIN, department: "People & Culture", jobTitle: "Talent Coordinator", monthlySalary: 108000, active: true }
  ];
  const CREDENTIALS = Object.freeze({
    admin: Object.freeze({ email: "admin" + RESERVED_DOMAIN, password: PASSWORD }),
    employees: Object.freeze(employeeSeeds.map(function (person) { return Object.freeze({ name: person.name.split(" ")[0], email: person.email, password: PASSWORD }); }))
  });

  function localDayOffset(date, offset) {
    const value = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    value.setDate(value.getDate() + offset);
    return value;
  }
  function dateKey(date) { return HCM.localDateKey(date); }
  function workdaysInRange(start, end, policy) {
    const result = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12);
    while (cursor <= end) {
      const key = dateKey(cursor);
      if (HCM.isWorkingDay(key, policy)) result.push(key);
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }
  function nthWorkdayFromToday(n, policy) {
    const cursor = localDayOffset(new Date(), 0);
    let count = 0;
    while (count <= n + 90) {
      cursor.setDate(cursor.getDate() + 1);
      if (HCM.isWorkingDay(dateKey(cursor), policy)) {
        count += 1;
        if (count === n) return dateKey(cursor);
      }
    }
    throw new Error("A valid demo workday could not be created.");
  }
  function atIso(date, hour) {
    const value = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour || 12, 0, 0);
    return value.toISOString();
  }
  function buildDataset() {
    const now = new Date();
    const today = dateKey(now);
    const company = Object.assign({}, HCM.DEFAULT_POLICY, {
      name: "HCM Lite Demo Company",
      email: "hello" + RESERVED_DOMAIN,
      phone: "",
      address: "Demo workspace",
      officeStart: "09:00",
      officeEnd: "17:00",
      gracePeriodMinutes: 10,
      workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      annualLeaveQuota: 20,
      currency: "PKR"
    });
    const users = [{
      id: adminId, employeeId: "", role: "admin", active: true,
      name: "HCM Demo Admin", email: CREDENTIALS.admin.email, password: PASSWORD,
      createdAt: atIso(localDayOffset(now, -120), 10)
    }].concat(employeeSeeds.map(function (seed, index) {
      const join = localDayOffset(now, -(430 + index * 73));
      const created = localDayOffset(now, -(18 - index * 2));
      return {
        id: seed.id, employeeId: seed.employeeId, role: "employee", active: seed.active,
        name: seed.name, email: seed.email, password: PASSWORD,
        department: seed.department, jobTitle: seed.jobTitle, monthlySalary: seed.monthlySalary,
        joiningDate: dateKey(join), createdAt: atIso(created, 10)
      };
    }));
    const start = localDayOffset(now, -55);
    const priorWorkdays = workdaysInRange(start, localDayOffset(now, -1), company);
    const currentMonthWorkdays = priorWorkdays.filter(function (key) { return key.slice(0, 7) === today.slice(0, 7); });
    const paidLeaveDate = currentMonthWorkdays.length > 1 ? currentMonthWorkdays[currentMonthWorkdays.length - 2] : (priorWorkdays[priorWorkdays.length - 3] || priorWorkdays[priorWorkdays.length - 1]);
    const absenceDate = priorWorkdays[priorWorkdays.length - 6] || priorWorkdays[0];
    const rejectedDate = priorWorkdays[priorWorkdays.length - 9] || priorWorkdays[0];
    const attendance = [];
    priorWorkdays.forEach(function (date, dayIndex) {
      employeeSeeds.forEach(function (person, employeeIndex) {
        if (person.id === "demo-emp-waqas" && date === paidLeaveDate) return;
        if (person.id === "demo-emp-abdullah" && date === absenceDate) return;
        let checkIn = "08:56";
        let checkOut = "17:02";
        if ((dayIndex + employeeIndex) % 9 === 3) checkIn = "09:24";
        if ((dayIndex * 2 + employeeIndex) % 13 === 5) { checkIn = "09:02"; checkOut = "12:00"; }
        attendance.push({
          id: "demo-att-" + person.id + "-" + date,
          employeeId: person.id, date: date, checkIn: checkIn, checkOut: checkOut
        });
      });
    });
    const leaves = [
      { id: "demo-leave-approved", employeeId: "demo-emp-waqas", type: "annual", typeLabel: "Annual leave", startDate: paidLeaveDate, endDate: paidLeaveDate, days: 1, reason: "Personal day", status: "approved", appliedAt: atIso(localDayOffset(now, -12)), reviewedAt: atIso(localDayOffset(now, -10)), reviewedBy: adminId },
      { id: "demo-leave-rejected", employeeId: "demo-emp-huzaifa", type: "sick", typeLabel: "Sick leave", startDate: rejectedDate, endDate: rejectedDate, days: 1, reason: "Medical appointment", status: "rejected", appliedAt: atIso(localDayOffset(now, -15)), reviewedAt: atIso(localDayOffset(now, -13)), reviewedBy: adminId },
      { id: "demo-leave-pending-abdullah", employeeId: "demo-emp-abdullah", type: "casual", typeLabel: "Casual leave", startDate: nthWorkdayFromToday(3, company), endDate: nthWorkdayFromToday(3, company), days: 1, reason: "Family commitment", status: "pending", appliedAt: atIso(localDayOffset(now, -1)), reviewedAt: "", reviewedBy: "" },
      { id: "demo-leave-pending-saqib", employeeId: "demo-emp-saqib", type: "annual", typeLabel: "Annual leave", startDate: nthWorkdayFromToday(8, company), endDate: nthWorkdayFromToday(8, company), days: 1, reason: "Personal appointment", status: "pending", appliedAt: atIso(localDayOffset(now, -2)), reviewedAt: "", reviewedBy: "" }
    ];
    return { company: company, users: users, attendance: attendance, leaves: leaves };
  }
  function validate(dataset) {
    if (!dataset || !dataset.company || typeof dataset.company.name !== "string" || !dataset.company.name.trim()) throw new Error("The demo company record is missing or invalid.");
    const users = dataset.users;
    if (!Array.isArray(users) || !Array.isArray(dataset.attendance) || !Array.isArray(dataset.leaves)) throw new Error("Demo records are incomplete.");
    const ids = new Set(users.map(function (user) { return user.id; }));
    const admin = users.find(function (user) { return user.id === adminId && user.role === "admin"; });
    if (!admin || !admin.active) throw new Error("The demo Admin account is missing or inactive.");
    employeeSeeds.forEach(function (person) {
      const user = users.find(function (item) { return item.id === person.id && item.role === "employee"; });
      if (!user || !user.email || !user.password) throw new Error("A required demo employee account is missing or invalid.");
    });
    const attendanceKeys = new Set();
    dataset.attendance.forEach(function (record) {
      if (!ids.has(record.employeeId) || !HCM.parseLocalDate(record.date) || !/^\d{2}:\d{2}$/.test(record.checkIn || "")) throw new Error("A demo attendance record is malformed or points to a missing employee.");
      const key = record.employeeId + "|" + record.date;
      if (attendanceKeys.has(key)) throw new Error("Duplicate demo attendance records were found.");
      attendanceKeys.add(key);
      const recordDate = HCM.parseLocalDate(record.date);
      if (record.date > dateKey(new Date()) || recordDate.getDay() === 0 || recordDate.getDay() === 6) throw new Error("Demo attendance contains a future date or weekend record.");
      if (record.checkOut && record.checkOut <= record.checkIn) throw new Error("A demo checkout must occur after its check-in.");
    });
    dataset.leaves.forEach(function (leave) {
      if (!ids.has(leave.employeeId) || !HCM.parseLocalDate(leave.startDate) || !HCM.parseLocalDate(leave.endDate) || leave.endDate < leave.startDate || !["pending", "approved", "rejected"].includes(leave.status)) throw new Error("A demo leave request is malformed or points to a missing employee.");
      if (!Number.isInteger(Number(leave.days)) || Number(leave.days) < 1) throw new Error("A demo leave request has an invalid working-day count.");
      if (leave.status === "pending" && (leave.reviewedAt || leave.reviewedBy)) throw new Error("A pending demo request cannot include review details.");
      if (leave.status !== "pending" && (!leave.reviewedAt || leave.reviewedBy !== adminId)) throw new Error("A reviewed demo request is missing its reviewer details.");
    });
    return true;
  }
  function readDataset() {
    return { company: HCM.getDemoCompany(), users: HCM.getDemoUsers(), attendance: HCM.getDemoAttendance(), leaves: HCM.getDemoLeaves() };
  }
  function initialize() {
    const marker = HCM.read(HCM.DEMO_KEYS.initialized, null);
    const hasAnyDemoData = [HCM.DEMO_KEYS.company, HCM.DEMO_KEYS.users, HCM.DEMO_KEYS.attendance, HCM.DEMO_KEYS.leaves].some(function (key) { return localStorage.getItem(key) !== null; });
    if (marker) {
      validate(readDataset());
      return readDataset();
    }
    if (hasAnyDemoData) throw new Error("Saved demo data is incomplete. Use Reset Demo Data from demo Admin Settings to restore it.");
    const dataset = buildDataset();
    validate(dataset);
    HCM.replaceDemoData(dataset);
    return dataset;
  }
  function reset() {
    const dataset = buildDataset();
    validate(dataset);
    HCM.replaceDemoData(dataset);
    return dataset;
  }
  function isReservedEmail(email) { return String(email || "").toLowerCase().endsWith(RESERVED_DOMAIN); }

  window.HCMDemo = Object.freeze({ credentials: CREDENTIALS, reservedDomain: RESERVED_DOMAIN, isReservedEmail: isReservedEmail, initialize: initialize, reset: reset, validate: validate });
}());