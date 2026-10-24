const authForms = document.querySelectorAll(".authForm");
const passwordToggles = document.querySelectorAll("[data-password-toggle]");

authForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
});

passwordToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const passwordInput = document.getElementById(toggle.dataset.passwordToggle);
    const shouldShowPassword = passwordInput.type === "password";

    passwordInput.type = shouldShowPassword ? "text" : "password";
    toggle.textContent = shouldShowPassword ? "Hide" : "Show";
    toggle.setAttribute("aria-label", shouldShowPassword ? "Hide password" : "Show password");
  });
});