# HCM Lite

A lightweight Human Capital Management prototype for small teams. HCM Lite brings employee management, attendance, leave requests, and basic payroll estimates into one simple interface.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=222)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384?logo=chart.js&logoColor=white)
![LocalStorage](https://img.shields.io/badge/Storage-LocalStorage-64748B)

## Hackathon Project

HCM Lite was built as a hackathon project to demonstrate a straightforward HR workflow for small teams. It provides separate Admin and Employee experiences, with connected employee, attendance, leave, and payroll-estimate views.

## Features

### Admin Workspace

- Dashboard totals for employees, today's recorded attendance, applicable absences, and pending leave requests.
- Attendance mix, recent attendance trend, and leave request status charts.
- Employee directory with add/edit, search, department and account-status filters, and activation controls.
- Leave register with pending, approved, and rejected requests. Decisions update the records shown to employees.
- Company settings for working days, office hours, grace period, annual leave quota, and currency.
- Demo-only reset option.

### Employee Workspace

- Personal dashboard with attendance and leave information.
- Check-in and check-out controls with duplicate, date, workday, and approved-leave checks.
- Leave applications with working-day calculation and overlap checks.
- Personal attendance history and attendance trend chart.
- Annual leave balance chart; pending requests are shown separately and do not reduce the approved balance.
- Current-period payroll estimate with a printable payslip and browser Save as PDF support.

### Interface

- Shared authenticated sidebar and topbar, with a navigation drawer on small screens.
- Responsive layouts for desktop, tablet, and mobile.
- Wide tables switch to labeled record cards on mobile instead of relying on horizontal table scrolling.
- Form labels, visible focus styles, validation messages, and empty states.

## Explore the Demo

On the **Sign In** page, select **Explore Demo** to open the Admin workspace. The demo uses fictional records stored separately from the normal workspace.

All demo accounts use this password:

```text
Demo@1234
```

| Role | Name | Email |
|---|---|---|
| Admin | HCM Demo Admin | `admin@demo.hcmlite.test` |
| Employee | Saqib Ahmed | `saqib@demo.hcmlite.test` |
| Employee | Waqas Ali | `waqas@demo.hcmlite.test` |
| Employee | Huzaifa Khan | `huzaifa@demo.hcmlite.test` |
| Employee | Abdullah Raza | `abdullah@demo.hcmlite.test` |
| Employee | Rehaan Siddiqui | `rehaan@demo.hcmlite.test` |
| Employee | Sara Noor | `sara@demo.hcmlite.test` |

The sample dataset includes six employees, attendance history generated relative to the current date, and pending, approved, and rejected leave requests. Newly created employees do not receive invented historical attendance or leave records.

To restore the sample dataset, sign in as the demo Admin and choose **Settings → Reset Demo Data**. This resets demo records; normal workspace data is stored separately.

These credentials are for demonstration only.

## Run Locally

HCM Lite uses HTML, CSS, and vanilla JavaScript. No package installation or build step is required.

1. Download or clone the project.
2. Open the project folder.
3. Open `index.html` in your browser.
4. Choose **Explore Demo** or select **Create a company** to set up a normal workspace.

If the browser does not load scripts correctly when opening the file directly, open the project in VS Code and run `index.html` with the Live Server extension. Using a consistent local address also helps keep the application's pages on the same browser origin for LocalStorage.

The first-run form creates the company and initial Admin account. Employee accounts are created by an Admin; there is no public employee registration.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Entry page with links to setup and sign-in |
| `pages/createAccount.html` | Initial company and Admin setup |
| `pages/signIn.html` | Admin/Employee login and Explore Demo |
| `pages/admin.html` | Admin dashboard and analytics |
| `pages/employees.html` | Employee directory and account management |
| `pages/leaves.html` | Leave requests and Admin review actions |
| `pages/settings.html` | Company policies and demo reset |
| `pages/employee.html` | Employee dashboard and personal records |
| `pages/payslip.html` | Current-period payroll estimate and print view |

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Browser LocalStorage
- [Chart.js](https://www.chartjs.org/) for dashboard charts
- Bootstrap Icons 1.11.3 and Inter loaded from existing CDNs

Chart.js, Bootstrap Icons, and Inter require an internet connection when loaded from their CDNs.

## Project Structure

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

## Data and Business Rules

The normal workspace uses these LocalStorage keys:

- `hcm_company`
- `hcm_users`
- `hcm_attendance`
- `hcm_leaves`
- `hcm_session`

Demo company, users, attendance, leaves, and seed state use separate `hcm_demo_*` keys. The session records the active mode, and the storage helpers select the corresponding dataset.

Default company settings are Monday–Friday, 09:00–17:00, a 10-minute grace period, 20 annual leave days, and PKR. Admins can change the supported company settings.

- Late status is based on check-in time and the configured grace period.
- A completed shift shorter than half of the configured workday is classified as a half day.
- Attendance summaries exclude future dates and non-working days from absence counts. Missing check-ins are only reported as absent where the app's configured workday and record-evidence rules support that conclusion.
- Leave requests use working-day counting and validate date order, overlap, and available quota.
- Pending annual leave is shown separately and does not reduce the approved balance. Approved annual leave reduces the balance; rejected leave does not.
- Payroll is an estimate for the current period using scheduled workdays and saved attendance.
