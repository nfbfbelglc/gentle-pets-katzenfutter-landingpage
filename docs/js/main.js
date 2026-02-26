// ===== Gentle Pets Landingpage =====
// JS: Formular-Validierung + (simulierter) POST-JSON-Flow + Statuscodes + UI-Feedback
//     Smooth Scroll + Active Nav + A11y-Fokus

function prefersReducedMotion() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function smoothScrollTo(target) {
  if (!target) return;
  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  target.scrollIntoView({ behavior, block: "start" });
}

function focusFirstFocusable(container) {
  if (!container) return;

  const focusable = container.querySelector(
    "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
  );

  if (focusable) focusable.focus({ preventScroll: true });
}

function setActiveNavLink(hash) {
  const links = document.querySelectorAll(".nav-link");
  links.forEach((l) => {
    l.classList.remove("is-active");
    l.removeAttribute("aria-current");
  });

  if (!hash) return;
  const active = document.querySelector(`.nav-link[href='${hash}']`);
  if (active) {
    active.classList.add("is-active");
    active.setAttribute("aria-current", "page");
  }
}

// ===== UI: Form Alert (wird via JS in das Formular eingebaut) =====
function ensureFormAlert(form) {
  if (!form) return null;

  let alertEl = form.querySelector(".form-alert");
  if (alertEl) return alertEl;

  alertEl = document.createElement("div");
  alertEl.className = "form-alert";
  alertEl.setAttribute("role", "alert");
  alertEl.setAttribute("aria-live", "polite");

  alertEl.innerHTML = `
    <div class="form-alert__icon" aria-hidden="true">!</div>
    <div class="form-alert__content">
      <div class="form-alert__title">Hinweis</div>
      <div class="form-alert__text"></div>
    </div>
  `;

  // Alert an den Anfang des Formulars setzen
  form.prepend(alertEl);
  return alertEl;
}

function showFormAlert(form, { type = "error", title, text } = {}) {
  const alertEl = ensureFormAlert(form);
  if (!alertEl) return;

  alertEl.classList.remove("form-alert--error", "form-alert--success");
  alertEl.classList.add(
    type === "success" ? "form-alert--success" : "form-alert--error",
  );
  alertEl.classList.add("is-visible");

  const titleEl = alertEl.querySelector(".form-alert__title");
  const textEl = alertEl.querySelector(".form-alert__text");

  if (titleEl)
    titleEl.textContent = title || (type === "success" ? "Erfolg" : "Fehler");
  if (textEl) textEl.textContent = text || "";

  // Fokus auf Alert, damit Screenreader es sicher ansagt
  alertEl.setAttribute("tabindex", "-1");
  alertEl.focus({ preventScroll: true });

  // Optional: Scroll zum Alert
  setTimeout(() => smoothScrollTo(alertEl), 50);
}

function hideFormAlert(form) {
  const alertEl = form?.querySelector(".form-alert");
  if (!alertEl) return;
  alertEl.classList.remove(
    "is-visible",
    "form-alert--error",
    "form-alert--success",
  );
}

// ===== (Simulierter) Server Request mit Statuscodes =====
// Liefert: { status: 200|400|500, json: {...} }
async function simulatedServerPost(url, payload) {
  // Simulierte Latenz
  await new Promise((resolve) => setTimeout(resolve, 700));

  // Beispiel: einfache serverseitige Plausibilitätsprüfung
  const emailLooksOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(payload?.email || "").trim(),
  );
  const nameOk = String(payload?.name || "").trim().length >= 2;

  if (!nameOk || !emailLooksOk) {
    return {
      status: 400,
      json: {
        message: "Bad Request: Bitte überprüfen Sie Name und E-Mail.",
      },
    };
  }

  // Optional: seltene 500er Fehler simulieren
  const random = Math.random();
  if (random < 0.08) {
    return {
      status: 500,
      json: {
        message: "Internal Server Error: Bitte versuchen Sie es später erneut.",
      },
    };
  }

  return {
    status: 200,
    json: {
      message: "OK",
      leadId: `lead_${Date.now()}`,
    },
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM =====
  const form = document.getElementById("probierpaket-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const futterwahlInput = document.getElementById("futterwahl");
  const aboInput = document.getElementById("abo");

  const formWrapper = document.getElementById("form-wrapper");
  const successMessage = document.getElementById("success-message");

  const ctaHeroBtn = document.getElementById("cta-hero");

  const successName = document.getElementById("success-name");
  const successEmail = document.getElementById("success-email");
  const successProduct = document.getElementById("success-product");

  const uspsGrid = document.getElementById("usps-grid");
  const testimonialsGrid = document.getElementById("testimonials-grid");

  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterEmail = document.getElementById("newsletter-email");
  const newsletterEmailError = document.getElementById(
    "newsletter-email-error",
  );
  const newsletterConsent = document.getElementById("newsletter-consent");
  const newsletterSuccess = document.getElementById("newsletter-success");

  // ===== DATA (dynamisches Rendering) =====
  const USPS = [
    {
      icon: "✓",
      title: "Ausgewogene Rezeptur",
      text: "Für Alltag, Spiel und Kuschelmodus – ohne unnötige Füllstoffe.",
    },
    {
      icon: "🔬",
      title: "Transparente Zutaten",
      text: "Du siehst, was drin ist und warum – klar und verständlich.",
    },
    {
      icon: "🥣",
      title: "Passende Sorten",
      text: "Trocken oder Nass: du entscheidest – ideal auch für sensible Katzen.",
    },
    {
      icon: "📦",
      title: "Praktisch im Abo",
      text: "Nie wieder leer: monatlich liefern lassen, jederzeit pausieren.",
    },
    {
      icon: "💬",
      title: "Liebevoller Support",
      text: "Fragen? Wir helfen beim Einstieg und bei der Umstellung.",
    },
  ];

  const TESTIMONIALS = [
    {
      text: "Endlich ein Futter, bei dem ich nicht rätseln muss, was drin ist.",
      name: "Mara",
      meta: "2 Katzen",
    },
    {
      text: "Probierpaket war top – und der Wechsel ging easy.",
      name: "Tom",
      meta: "Katzenhalter",
    },
    {
      text: "Für unseren sensiblen Kater: super verträglich und er frisst es gern.",
      name: "Nina",
      meta: "sensible Katze",
    },
  ];

  function renderUSPs() {
    if (!uspsGrid) return;

    uspsGrid.innerHTML = USPS.map(
      (u) => `
      <article class="usp-card" role="listitem">
        <div class="usp-icon" aria-hidden="true">${u.icon}</div>
        <h3 class="usp-title">${u.title}</h3>
        <p class="usp-description">${u.text}</p>
      </article>
    `,
    ).join("");
  }

  function renderTestimonials() {
    if (!testimonialsGrid) return;

    testimonialsGrid.innerHTML = TESTIMONIALS.map(
      (t) => `
      <figure class="testimonial-card">
        <blockquote class="testimonial-text">„${t.text}“</blockquote>
        <figcaption class="testimonial-author">
          <span class="testimonial-name">${t.name}</span>
          <span class="testimonial-cat">${t.meta}</span>
        </figcaption>
      </figure>
    `,
    ).join("");
  }

  renderUSPs();
  renderTestimonials();

  // ===== VALIDIERUNGSREGELN (Client) =====
  const validationRules = {
    name: {
      validate: (value) => value.trim() !== "",
      error: "Bitte geben Sie Ihren Namen ein.",
    },
    email: {
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value.trim());
      },
      error: "Bitte prüfen Sie Ihre E-Mail-Adresse auf Tippfehler.",
    },
    futterwahl: {
      validate: (value) => value !== "",
      error: "Bitte wählen Sie eine Futterart für Ihr Probierpaket.",
    },
  };

  function showError(input, errorElement, message) {
    if (!input || !errorElement) return;
    input.setAttribute("aria-invalid", "true");
    errorElement.textContent = message;
    errorElement.style.display = "flex";
    input.classList.add("error");
  }

  function clearError(input, errorElement) {
    if (!input || !errorElement) return;
    input.setAttribute("aria-invalid", "false");
    errorElement.textContent = "";
    errorElement.style.display = "none";
    input.classList.remove("error");
  }

  function validateField(fieldName) {
    const input = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}-error`);
    const rule = validationRules[fieldName];

    if (!input || !errorElement || !rule) return true;

    if (!rule.validate(input.value)) {
      showError(input, errorElement, rule.error);
      return false;
    }

    clearError(input, errorElement);
    return true;
  }

  function validateForm() {
    const isNameValid = validateField("name");
    const isEmailValid = validateField("email");
    const isFutterwahlValid = validateField("futterwahl");
    return isNameValid && isEmailValid && isFutterwahlValid;
  }

  // Live-Validierung
  nameInput?.addEventListener("input", () => {
    hideFormAlert(form);
    if (nameInput.getAttribute("aria-invalid") === "true")
      validateField("name");
  });

  emailInput?.addEventListener("input", () => {
    hideFormAlert(form);
    if (emailInput.getAttribute("aria-invalid") === "true")
      validateField("email");
  });

  futterwahlInput?.addEventListener("change", () => {
    hideFormAlert(form);
    if (futterwahlInput.getAttribute("aria-invalid") === "true")
      validateField("futterwahl");
  });

  // ===== FORM SUBMIT (POST JSON, simuliert) =====
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormAlert(form);

    if (!validateForm()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent || "";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Wird verarbeitet...";
    }

    // Payload als JSON (keine Daten in URL)
    const payload = {
      name: nameInput?.value || "",
      email: emailInput?.value || "",
      futterwahl: futterwahlInput?.value || "",
      abo: Boolean(aboInput?.checked),
    };

    try {
      // Simulierte POST-Anfrage
      const response = await simulatedServerPost("/api/probierpaket", payload);

      if (response.status === 200) {
        showSuccessMessage(payload);
        form.reset();
      } else if (response.status === 400) {
        showFormAlert(form, {
          type: "error",
          title: "Eingabe prüfen",
          text: response.json?.message || "Bitte prüfen Sie Ihre Angaben.",
        });
      } else {
        showFormAlert(form, {
          type: "error",
          title: "Technischer Fehler",
          text:
            response.json?.message ||
            "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
        });
      }

      console.log("POST /api/probierpaket (simuliert)", {
        payload,
        status: response.status,
        response: response.json,
      });
    } catch (error) {
      console.error("Fehler beim Absenden:", error);
      showFormAlert(form, {
        type: "error",
        title: "Netzwerkfehler",
        text: "Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
      });
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });

  // ===== SUCCESS UI =====
  function showSuccessMessage(payload) {
    const produktNamen = {
      trocken: "Trockenfutter-Probierpaket",
      nass: "Nassfutter Variety Paket",
      mix: "Mix-Probierpaket",
    };

    if (successName) successName.textContent = payload?.name || "";
    if (successEmail) successEmail.textContent = payload?.email || "";
    if (successProduct) {
      successProduct.textContent = produktNamen[payload?.futterwahl] || "";
    }

    if (formWrapper) formWrapper.style.display = "none";
    if (successMessage) successMessage.classList.remove("hidden");

    if (successMessage) {
      successMessage.setAttribute("tabindex", "-1");
      successMessage.focus({ preventScroll: true });

      // Squash & Stretch Animation (Animationsprinzip sichtbar)
      const icon = successMessage.querySelector(".success-icon");
      if (icon) {
        icon.classList.remove("is-animated");
        void icon.offsetWidth; // reflow trigger
        icon.classList.add("is-animated");
      }
    }

    setTimeout(() => smoothScrollTo(successMessage), 100);
  }

  // ===== CTA HERO -> Formular =====
  ctaHeroBtn?.addEventListener("click", () => {
    const formSection = document.getElementById("probierpaket");
    smoothScrollTo(formSection || form);

    setTimeout(
      () => {
        nameInput?.focus({ preventScroll: true });
      },
      prefersReducedMotion() ? 0 : 450,
    );
  });

  // ===== Smooth Scroll für interne Hash-Links =====
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      smoothScrollTo(target);

      history.pushState(null, "", href);
      setActiveNavLink(href);

      // Fokus nur dort setzen, wo es UX-seitig sinnvoll ist (Formular)
      if (target.id === "probierpaket") {
        setTimeout(
          () => focusFirstFocusable(target),
          prefersReducedMotion() ? 0 : 300,
        );
      }
    });
  });

  // ===== Active Nav on Scroll (IntersectionObserver) =====
  const sectionIds = [
    "#vorteile",
    "#transparenz",
    "#journey",
    "#stimmen",
    "#beratung",
    "#probierpaket",
  ];
  const sections = sectionIds
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        // Nimm die Section mit höchster Intersection-Ratio
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveNavLink(`#${visible.target.id}`);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65],
      },
    );

    sections.forEach((s) => observer.observe(s));
  }

  // ===== Initial active link =====
  if (window.location.hash) setActiveNavLink(window.location.hash);

  // ===== A11y Shortcut: Alt+S -> Formular =====
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      const formSection = document.getElementById("probierpaket");
      smoothScrollTo(formSection || form);
      setTimeout(
        () => nameInput?.focus({ preventScroll: true }),
        prefersReducedMotion() ? 0 : 300,
      );
    }
  });

  // ===== Logging (optional) =====
  console.log("Gentle Pets Landingpage geladen ✓");
});
