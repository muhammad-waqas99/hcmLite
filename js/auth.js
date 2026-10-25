(function () {
  "use strict";
  const HCM = window.HCM;
  const forms = document.querySelectorAll(".authForm");
  const toggles = document.querySelectorAll("[data-password-toggle]");

  function messageFor(form) {
    let node = form.querySelector(".authMessage");
    if (!node) {
      node = document.createElement("p");
      node.className = "authMessage";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      form.append(node);
    }
    return node;
  }

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      const input = document.getElementById(toggle.dataset.passwordToggle);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.textContent = show ? "Hide" : "Show";
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });


  document.querySelectorAll("[data-demo-login]").forEach(function (button) {
    button.addEventListener("click", function () {
      const form = button.closest(".authContent") && button.closest(".authContent").querySelector(".authForm");
      const message = form ? messageFor(form) : null;
      if (!window.HCMDemo) { if (message) message.textContent = "Demo sign-in is unavailable. Reload the page and try again."; return; }
      button.disabled = true;
      if (message) { message.textContent = ""; message.className = "authMessage"; }
      try {
        window.HCMDemo.initialize();
        const admin = HCM.getDemoUsers().find(function (record) { return record.id === "demo-admin" && record.role === "admin"; });
        if (!admin || admin.active === false) throw new Error("Demo Admin account could not be verified.");
        HCM.startSession(admin, "demo");
        HCM.redirectForRole("admin");
      } catch (error) {
        console.error(error);
        if (message) { message.textContent = error.message || "Demo mode could not be opened."; message.classList.add("isError"); }
        button.disabled = false;
      }
    });
  });
  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const message = messageFor(form);
      message.textContent = "";
      message.className = "authMessage";

      try {
        if (form.id === "setupForm") {
          if (HCM.getNormalCompany() || HCM.getNormalUsers().length) {
            throw new Error("A company workspace already exists in this browser. Sign in with its administrator account.");
          }
          const companyName = document.getElementById("companyName").value.trim();
          const name = document.getElementById("adminName").value.trim();
          const email = document.getElementById("adminEmail").value.trim().toLowerCase();
          const password = document.getElementById("adminPassword").value;
          if (!companyName || !name || !email || password.length < 8) throw new Error("Enter the required company and administrator details. Passwords need at least 8 characters.");
          if (window.HCMDemo && window.HCMDemo.isReservedEmail(email)) throw new Error("That email address is reserved for the HCM Lite demo accounts.");
          const company = Object.assign({}, HCM.DEFAULT_POLICY, { name: companyName, email: "", phone: "", address: "" });
          const admin = { id: HCM.makeId("usr"), employeeId: "", role: "admin", active: true, name: name, email: email, password: password };
          HCM.saveNormalCompany(company);
          HCM.saveNormalUsers([admin]);
          HCM.startSession(admin, "normal");
          location.replace("admin.html");
          return;
        }

        if (form.id === "loginForm") {
          const email = document.getElementById("loginEmail").value.trim().toLowerCase();
          const password = document.getElementById("loginPassword").value;
          let user;
          let mode = "normal";
          if (window.HCMDemo && window.HCMDemo.isReservedEmail(email)) {
            window.HCMDemo.initialize();
            user = HCM.getDemoUsers().find(function (record) { return String(record.email || "").toLowerCase() === email && record.password === password; });
            mode = "demo";
          } else {
            user = HCM.getNormalUsers().find(function (record) { return String(record.email || "").toLowerCase() === email && record.password === password; });
          }
          if (!user) throw new Error("Email or password is incorrect.");
          if (user.active === false) throw new Error("This account is inactive. Contact your company administrator.");
          HCM.startSession(user, mode);
          HCM.redirectForRole(user.role);
        }
      } catch (error) {
        console.error(error);
        message.textContent = error.message || "The request could not be completed.";
        message.classList.add("isError");
      }
    });
  });
}());

