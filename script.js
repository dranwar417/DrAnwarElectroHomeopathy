const API_URL =
  "https://script.google.com/macros/s/AKfycbzK5SmE9BUS5g45x_ecfAdUOPMtJnjkRVJ5FO6Vdy7Z4xLLZC1db64DnlRQVvSHCgYb5w/exec?key=mySecret123&sheet=Patients";

let data = [];
let nextSrNo = 1;
const VISIBLE_COLS = [0, 1, 2, 3, 4];
// ===============================
// 🔗 CASE → GOOGLE SHEET FIELD MAP
// ===============================
const CASE_TO_SHEET_MAP = {
  1: "patientName", // Name column
  2: "age", // Age column
  3: "address", // Address column
};

const addRowBtn = document.getElementById("addRow");
const addRowBtnText = addRowBtn.innerText;

const loadingEl = document.getElementById("loading");

function showLoading(msg = "Loading…") {
  loadingEl.textContent = msg;
  loadingEl.classList.remove("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}

function setBusy(state) {
  document.querySelectorAll("button").forEach((b) => (b.disabled = state));
}


showLoading("Fetching patients…");

fetch(API_URL)
  .then((res) => res.json())
  .then((json) => {
    data = json;
    nextSrNo = Math.max(...data.slice(1).map((r) => Number(r[0]) || 0)) + 1;

    render(data);
    createForm(data[0]);
  })
  .catch(() => {
    showToast("Failed to load data", "error");
  })
  .finally(() => {
    hideLoading();
  });

function render(rows) {
  const thead = document.querySelector("thead");
  const tbody = document.querySelector("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (!rows || !rows[0]) return;

  const hr = document.createElement("tr");
  VISIBLE_COLS.forEach((i) => {
    const th = document.createElement("th");
    th.textContent = rows[0][i];
    hr.appendChild(th);
  });
  thead.appendChild(hr);

  rows.slice(1).forEach((row) => {
    const tr = document.createElement("tr");
    VISIBLE_COLS.forEach((i) => {
      const td = document.createElement("td");
      td.textContent = row[i] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function createForm(headers) {
  const form = document.getElementById("form");
  form.innerHTML = "";

  headers.forEach((h, i) => {
    if (i === 0) return;

    const input = document.createElement("input");
    input.placeholder = h;
    input.dataset.col = i;
    form.appendChild(input);
  });

  // 🔥 AUTO-FILL FROM CASE FORM
  fillGoogleFormFromCase();
}

// ===============================
// 📥 FILL GOOGLE FORM FROM CASE FORM
// ===============================
function fillGoogleFormFromCase() {
  const inputs = document.querySelectorAll("#form input");

  inputs.forEach((input) => {
    const colIndex = Number(input.dataset.col);
    const caseFieldId = CASE_TO_SHEET_MAP[colIndex];

    if (!caseFieldId) return;

    const caseEl = document.getElementById(caseFieldId);
    if (caseEl && caseEl.value.trim()) {
      input.value = caseEl.value;
    }
  });
}
// ===============================
// 🔄 LIVE SYNC CASE → GOOGLE FORM
// ===============================
Object.values(CASE_TO_SHEET_MAP).forEach((fieldId) => {
  const el = document.getElementById(fieldId);
  if (!el) return;

  el.addEventListener("input", fillGoogleFormFromCase);
});

addRowBtn.addEventListener("click", () => {
  if (addRowBtn.disabled) return;

  const inputs = document.querySelectorAll("#form input");

  const hasValue = [...inputs].some((i) => i.value.trim());
  if (!hasValue) {
    showToast("Please enter at least one field", "info");
    return;
  }

  const newRow = [];
  newRow[0] = nextSrNo; // increment only after success

  inputs.forEach((i) => {
    newRow[i.dataset.col] = i.value;
    i.value = "";
  });

  // 🔒 BUTTON STATE
  addRowBtn.disabled = true;
  addRowBtn.innerText = "Adding…";

  showLoading("Saving patient…");

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(newRow),
  })
    .then(() => {
      nextSrNo++;
      data.push(newRow);
      render(data);
      showToast("Patient saved", "success");
    })
    .catch(() => {
      showToast("Save failed", "error");
    })
    .finally(() => {
      hideLoading();
      addRowBtn.disabled = false;
      addRowBtn.innerText = addRowBtnText;
    });
});

// 🔍 SEARCH: exact → startsWith → contains (NO OTHERS)
document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) return render(data);

  const rows = data.slice(1);

  const exact = [];
  const starts = [];
  const contains = [];

  rows.forEach((row) => {
    const cells = row.map((c) => String(c || "").toLowerCase());

    if (cells.some((c) => c === q)) {
      exact.push(row);
    } else if (cells.some((c) => c.startsWith(q))) {
      starts.push(row);
    } else if (cells.some((c) => c.includes(q))) {
      contains.push(row);
    }
  });

  render([data[0], ...exact, ...starts, ...contains]);
});

// ===============================
// 📌 DOM ELEMENTS
// ===============================
const patientName = document.getElementById("patientName");
const age = document.getElementById("age");
const gender = document.getElementById("gender");
const address = document.getElementById("address");

const chiefComplaint = document.getElementById("chiefComplaint");
const duration = document.getElementById("duration");
const pqrs = document.getElementById("pqrs");

const medicalHistory = document.getElementById("medicalHistory");
const allergies = document.getElementById("allergies");
const familyHistory = document.getElementById("familyHistory");

const toast = document.getElementById("toast");

// ===============================
// 🧾 FIELD LIST (LOCAL AUTOSAVE)
// ===============================
const fields = [
  "patientName",
  "age",
  "gender",
  "address",
  "chiefComplaint",
  "duration",
  "pqrs",
  "causation",
  "aggravation",
  "amelioration",
  "timeModalities",
  "hunger",
  "appetite",
  "thirst",
  "desires",
  "aversions",
  "sleep",
  "dreams",
  "thermal",
  "perspiration",
  "urine",
  "stool",
  "mental",
  "medicalHistory",
  "allergies",
  "familyHistory",
  "provisional",
];

// ===============================
// 🛠 HELPERS
// ===============================
function line(label, value) {
  if (!value || !value.trim()) return "";
  return `${label}: ${value}\n`;
}

function showToast(msg, type = "info") {
  toast.innerText = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => (toast.className = "toast"), 2500);
}

// ===============================
// 🧠 BUILD CASE TEXT
// ===============================
function buildCaseText() {
  let text = "🩺 CASE TAKING FORM\n\n";

  let s = "";
  s += line("Name", patientName.value);
  s += line("Age", age.value);
  s += line("Gender", gender.value);
  if (s) text += "I. Patient Information\n" + s + "\n";

  s = "";
  s += line("Chief Complaint", chiefComplaint.value);
  s += line("Duration", duration.value);
  s += line("PQRS", pqrs.value);
  if (s) text += "II. Chief Complaint & Symptoms\n" + s + "\n";

  s = "";
  s += line("Causation", causation.value);
  s += line("Aggravation", aggravation.value);
  s += line("Amelioration", amelioration.value);
  s += line("Time Modalities", timeModalities.value);
  if (s) text += "III. Causation & Modalities\n" + s + "\n";

  s = "";
  s += line("Hunger", hunger.value);
  s += line("Appetite", appetite.value);
  s += line("Thirst", thirst.value);
  s += line("Desires", desires.value);
  s += line("Aversions", aversions.value);
  s += line("Sleep", sleep.value);
  s += line("Dreams", dreams.value);
  if (s) text += "IV. Physical Generals\n" + s + "\n";

  if (thermal.value.trim())
    text += "V. Thermal State\n" + thermal.value + "\n\n";

  s = "";
  s += line("Perspiration", perspiration.value);
  s += line("Urine", urine.value);
  s += line("Stool", stool.value);
  if (s) text += "VI. Eliminations\n" + s + "\n";

  if (mental.value.trim())
    text += "VII. Mental Generals\n" + mental.value + "\n\n";

  s = "";
  s += line("Medical History", medicalHistory.value);
  s += line("Allergies", allergies.value);
  if (s) text += "VIII. Medical History\n" + s + "\n";

  if (familyHistory.value.trim())
    text += "IX. Family History\n" + familyHistory.value + "\n\n";

  if (provisional.value.trim())
    text += "X. Provisional Assessment\n" + provisional.value + "\n\n";

  return text.trim();
}

// ===============================
// 📋 COPY FOR CHATGPT
// ===============================
function copyCase(btn) {
  navigator.clipboard.writeText(buildCaseText());
  showToast("Case copied for ChatGPT", "success");

  const originalText = btn.innerText;
  btn.innerText = "✅ COPIED";

  setTimeout(() => {
    btn.innerText = originalText;
  }, 1500);
}

// ===============================
// 💾 LOCAL STORAGE AUTOSAVE
// ===============================
fields.forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("input", () => {
    localStorage.setItem("case_" + id, el.value);
  });
});

window.addEventListener("load", () => {
  fields.forEach((id) => {
    const el = document.getElementById(id);
    const saved = localStorage.getItem("case_" + id);
    if (el && saved !== null) el.value = saved;
  });
});

// ===============================
// 🧹
 CLEAR FORM
// ===============================
function clearForm() {
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
    localStorage.removeItem("case_" + id);
  });
  showToast("Form cleared", "info");
}

document.getElementById("clearGoogleForm").addEventListener("click", () => {
  document.querySelectorAll("#form input").forEach((i) => (i.value = ""));
  showToast("Google Sheet form cleared", "info");
});
