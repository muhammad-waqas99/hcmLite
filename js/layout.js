(function () {
  "use strict";
  const HCM = window.HCM;
  const pageRole = document.body.dataset.appRole;
  if (!HCM || !pageRole) return;
  const user = HCM.guard(pageRole);
  if (!user) return;

  function initials(name) {
    return String(name || "User").trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase() || "U";
  }
  document.querySelectorAll(".profileText strong").forEach(function (node) { node.textContent = user.name; });
  if (HCM.isDemoSession()) {
    const demoBadge = document.createElement("span");
    demoBadge.className = "demoModeBadge";
    demoBadge.textContent = "Demo";
    demoBadge.setAttribute("title", "Changes are saved in the separate demo workspace.");
    const right = document.querySelector(".topbarRight");
    if (right) right.prepend(demoBadge);
  }
  document.querySelectorAll(".profileText span").forEach(function (node) { node.textContent = user.role === "admin" ? "Administrator" : (user.jobTitle || "Employee"); });
  document.querySelectorAll(".topbarRole").forEach(function (node) { node.textContent = user.name; });
  document.querySelectorAll(".profileAvatar").forEach(function (node) { node.textContent = initials(user.name); });
  document.querySelectorAll("[data-current-date]").forEach(function (node) {
    node.textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date());
  });

  const currentFile = location.pathname.split("/").pop() || "";
  document.querySelectorAll(".sidebarNav a.navItem").forEach(function (link) {
    const target = (link.getAttribute("href") || "").split("#")[0];
    const active = target === currentFile;
    link.classList.toggle("isActive", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const topbarRight = document.querySelector(".topbarRight");
  if (topbarRight && !topbarRight.querySelector("[data-logout]")) {
    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "logoutButton";
    logout.dataset.logout = "";
    logout.setAttribute("aria-label", "Sign out");
    const icon = document.createElement("i");
    icon.className = "bi bi-box-arrow-right";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = "Sign out";
    logout.append(icon, label);
    topbarRight.append(logout);
  }
  document.querySelectorAll("[data-logout]").forEach(function (button) {
    button.addEventListener("click", function () {
      HCM.clearSession();
      location.replace("signIn.html");
    });
  });

  window.addEventListener("storage", function (event) {
    if (!["hcm_session", "hcm_users", "hcm_demo_users"].includes(event.key)) return;
    const latest = HCM.currentUser();
    if (!latest) { HCM.clearSession(); location.replace("signIn.html"); return; }
    if (latest.role !== pageRole) { HCM.redirectForRole(latest.role); return; }
    Object.assign(user, latest);
    document.querySelectorAll(".profileText strong, .topbarRole").forEach(function (node) { node.textContent = user.name; });
    document.querySelectorAll(".profileText span").forEach(function (node) { node.textContent = user.role === "admin" ? "Administrator" : (user.jobTitle || "Employee"); });
    document.querySelectorAll(".profileAvatar").forEach(function (node) { node.textContent = initials(user.name); });
  });
  const sidebar = document.getElementById("sidebar");
  document.querySelectorAll(".menuButton").forEach(function (button) {
    if (!sidebar) return;
    button.addEventListener("click", function () {
      button.setAttribute("aria-expanded", String(sidebar.matches(":popover-open")));
    });
  });
  if (sidebar) {
    sidebar.addEventListener("toggle", function () {
      document.querySelectorAll(".menuButton").forEach(function (button) {
        button.setAttribute("aria-expanded", String(sidebar.matches(":popover-open")));
      });
    });
    sidebar.querySelectorAll("a.navItem").forEach(function (link) {
      link.addEventListener("click", function () {
        if (sidebar.matches(":popover-open")) sidebar.hidePopover();
      });
    });
  }

  window.HCMApp = Object.freeze({
    user: user,
    el: function (tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    },
    setMessage: function (node, message, kind) {
      if (!node) return;
      node.textContent = message || "";
      node.classList.toggle("isError", kind === "error");
      node.classList.toggle("isSuccess", kind === "success");
    },
    showGlobalError: function (message) {
      let notice = document.getElementById("appDataError");
      if (!notice) {
        notice = document.createElement("p");
        notice.id = "appDataError";
        notice.className = "appDataError";
        notice.setAttribute("role", "alert");
        const main = document.querySelector("main");
        if (main) main.prepend(notice);
        else document.body.prepend(notice);
      }
      notice.textContent = message;
    }
  });
}());



