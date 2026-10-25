# HCM Lite

A lightweight Human Capital Management prototype for small teams. Admins manage employee accounts, review leave requests, and configure company policy. Employees record attendance, request time off, review their own profile, and view a current-period payroll estimate.

## What is included

### Admin workspace
- Dashboard totals for employees, today's recorded attendance, evidence-based absences, and pending leave.
- Attendance mix and recent trend charts, plus leave request status analytics.
- Employee directory with add/edit, search, department and account-status filters, and activation controls.
- Leave register with pending, approved, and rejected requests. Decisions update the same browser record used by employees.
- Company settings for working days, hours, grace period, annual leave quota, and currency.
- Demo-only reset action.

### Employee workspace
- Personal attendance and leave history with mobile-friendly record cards.
- Check-in and check-out controls with duplicate, date, workday, and approved-leave checks.
- Leave application with working-day counting and overlap checks.
- A private attendance trend and annual leave balance chart. Only the signed-in employee's records are used; pending requests are shown separately and do not reduce the approved balance.
- Current-period payroll estimate with print and Save as PDF support.

### Responsive and accessible UI
- Shared authenticated sidebar and topbar with a small-screen navigation drawer.
- Responsive layouts for narrow phones, tablets, and desktop screens.
- Wide tables switch to labeled record cards on mobile; the pages do not rely on horizontal table scrolling.
- Semantic page landmarks, visible focus styles, labeled controls, and chart text alternatives/empty states.

## Explore the demo

From **Sign in**, choose **Explore Demo** to open the Admin workspace. Demo records are fictional and stored separately from normal workspace data.

All demo accounts use password `Demo@1234`.

| Role | Name | Email |
| --- | --- | --- |
| Admin | HCM Demo Admin | `admin@demo.hcmlite.test` |
| Employee | Saqib Ahmed | `saqib@demo.hcmlite.test` |
| Employee | Waqas Ali | `waqas@demo.hcmlite.test` |
| Employee | Huzaifa Khan | `huzaifa@demo.hcmlite.test` |
| Employee | Abdullah Raza | `abdullah@demo.hcmlite.test` |
| Employee | Rehaan Siddiqui | `rehaan@demo.hcmlite.test` |
| Employee | Sara Noor | `sara@demo.hcmlite.test` |

Demo data contains six employees, several weeks of scheduled attendance, and leave examples in each review state. Attendance history is generated relative to the current date. New employees do not receive made-up attendance or leave history. Use **Settings → Reset Demo Data** as the demo Admin to restore seeded examples; this only changes `hcm_demo_*` keys.

## Run locally

Serve the project over HTTP so all pages use the same browser origin and LocalStorage. With Python installed, run this from the project folder:

```powershell
py -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/). A local development server such as VS Code Live Server also works. Keep the same browser and local address to retain records.

Choose **Create a company** for a normal workspace. The first-run form creates the company and Admin account. Employee accounts are created by an Admin; there is no public employee registration.

## Technology and project structure

- HTML5, CSS3, vanilla JavaScript, and browser LocalStorage.
- Bootstrap Icons 1.11.3 and Inter are loaded from their existing CDNs.
- Chart.js 4.5.1 is loaded from jsDelivr on the Admin and Employee dashboards. These visualizations use the active normal or demo dataset, update when saved records change, and show an empty state when there is insufficient data.
- No server, database, or JavaScript framework is included. External font, icon, and chart assets require an internet connection.

```text
hcm-lite/
├── index.html
├── pages/
│   ├── admin.html
│   ├── employees.html
│   ├── leaves.html
│   ├── settings.html
│   ├── employee.html
│   ├── payslip.html
│   ├── signIn.html
│   └── createAccount.html
├── css/
│   ├── style.css
│   ├── components.css
│   ├── layout.css
│   ├── responsive.css
│   ├── mobile-tables.css
│   ├── charts.css
│   └── page-specific stylesheets
├── js/
│   ├── storage.js
│   ├── demo.js
│   ├── layout.js
│   ├── charts.js
│   └── page-specific scripts
└── assets/
    └── team.jpg
```

## Data model and business rules

Normal workspace keys are `hcm_company`, `hcm_users`, `hcm_attendance`, `hcm_leaves`, and `hcm_session`. Demo company, users, attendance, leaves, and seed marker use separate `hcm_demo_*` keys; the session records which mode is active. Storage helpers in `js/storage.js` select the active dataset.

Defaults are Monday through Friday, 09:00–17:00, a 10-minute grace period, 20 annual leave days, and PKR. Admins can change these company settings. Late status is derived from check-in time. A completed shift shorter than half of the configured workday is classified as half day.

The Admin attendance summary ignores future dates and non-working days. Absences are inferred only after the configured workday ends and when that date has attendance or approved-leave evidence; otherwise missing check-ins remain unreported. Attendance charts count actual saved check-ins, approved leave, and evidence-based absence. Trend charts include only recorded workdays and are omitted until at least two dates have check-ins.

Pending annual leave does not reduce the employee balance. Approved annual leave reduces it; the leave balance chart shows approved days and remaining days, with pending days listed separately. Payroll is a current-month estimate using scheduled workdays and saved attendance. Historical salary/policy snapshots, holidays, tax, benefits, approval, and payment confirmation are not part of this prototype.

## Security and limitations

This is a browser-only hackathon prototype, not a production HR system. LocalStorage can be read or altered by anyone with access to the browser profile. Passwords use the existing client-side model and are not hashed. Do not store confidential employee data here. Real deployment needs a backend, secure authentication, authorization, encrypted transport, audit logs, and backups.

No project screenshots or external branding assets are included. The demo dataset is fictional and should be treated only as a demonstration.

## Quality checks

The delivery audit checks JavaScript syntax, local page references and form labels, storage and role behavior, demo-data isolation/reset, attendance and leave rules, mobile table-card styles, and archive contents. Browser-based visual review across device emulations should still be performed when a browser test session is available.