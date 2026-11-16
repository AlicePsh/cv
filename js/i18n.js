const LANG_KEY = "portfolio-lang";

const CV_FILES = {
  ru: "Алиса Падерова - Senior Product Designer CV.pdf",
  en: "Alisa Paderova - Senior Product Designer CV.pdf",
};

function currentLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function cvHref(lang) {
  const file = CV_FILES[lang === "en" ? "en" : "ru"];
  const folder = /\/cases\//.test(location.pathname) ? "../assets/" : "assets/";
  return folder + encodeURIComponent(file);
}

function updateCvLink(lang) {
  const cvLink = document.querySelector("#download-cv");
  if (!cvLink) return;

  const next = lang === "en" ? "en" : "ru";
  cvLink.href = cvHref(next);
  cvLink.setAttribute("download", CV_FILES[next]);
  cvLink.removeAttribute("aria-disabled");
}

function applyLanguage(lang) {
  const next = lang === "en" ? "en" : "ru";
  document.documentElement.lang = next;

  document.querySelectorAll("[data-en]").forEach((el) => {
    if (!el.dataset.ru) el.dataset.ru = el.textContent;
    const value = next === "en" ? el.dataset.en : el.dataset.ru;
    el.textContent = value;
    el.hidden = value.trim() === "";
  });

  document.querySelectorAll("[data-src-en]").forEach((img) => {
    img.src = next === "en" ? img.dataset.srcEn : img.dataset.srcRu;
    const alt = next === "en" ? img.dataset.altEn : img.dataset.altRu;
    if (alt) img.alt = alt;
  });

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    const selected = btn.dataset.langBtn === next;
    btn.classList.toggle("is-current", selected);
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  const title = document.querySelector("title");
  if (title && title.dataset.en) {
    if (!title.dataset.ru) title.dataset.ru = title.textContent;
    document.title = next === "en" ? title.dataset.en : title.dataset.ru;
  }

  updateCvLink(next);

  try {
    localStorage.setItem(LANG_KEY, next);
  } catch (error) {
    /* Private mode can block storage; the page still switches. */
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lang-btn]");
  if (!button) return;
  applyLanguage(button.dataset.langBtn);
});

let stored = "ru";
try {
  stored = localStorage.getItem(LANG_KEY) || "ru";
} catch (error) {
  stored = "ru";
}
applyLanguage(stored === "en" ? "en" : "ru");
