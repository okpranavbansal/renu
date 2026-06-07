let currentTab = "diet";
let manifest = null;
let dietData = null;
let reportsData = {};

async function init() {
  try {
    // Attempt to load manifest (optional for basic usage)
    try {
      const manifestRes = await fetch("data/manifest.json");
      manifest = await manifestRes.json();
    } catch (e) {
      manifest = { reports: [] };
    }

    // Attempt to load diet data
    try {
      const dietRes = await fetch("data/diet.json");
      dietData = await dietRes.json();
    } catch (e) {
      dietData = null;
    }

    // Initialize Theme
    const savedTheme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    applyTheme(savedTheme);

    setupEventListeners();
    
    if (!dietData) {
      document.getElementById("content-area").innerHTML = `
        <div style="text-align: center; padding: 50px 20px;">
          <h2>Welcome to Lumina</h2>
          <p style="color: var(--slate); max-width: 500px; margin: 10px auto;">
            The dashboard is ready, but we cannot find your medical data. Please drop your medical notes or lab reports into the <strong>/raw/</strong> folder and ask your IDE's AI to ingest them.
          </p>
        </div>
      `;
      return;
    }

    render();
  } catch (err) {
    console.error("Initialization failed:", err);
    document.getElementById("content-area").innerHTML = "Failed to load dashboard.";
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggleBtnText = theme === "dark" ? "Light Mode" : "Dark Mode";
  const toggleBtnIcon = theme === "dark" ? "☀️" : "🌙";

  const sidebarBtn = document.getElementById("theme-toggle");
  if (sidebarBtn) {
    sidebarBtn.querySelector(".theme-icon").textContent = toggleBtnIcon;
    sidebarBtn.querySelector(".theme-text").textContent = toggleBtnText;
  }
  const topBtn = document.getElementById("theme-toggle-top");
  if (topBtn) {
    topBtn.textContent = toggleBtnIcon;
  }
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
}

function setupEventListeners() {
  const tabs = document.querySelectorAll(".nav-tab, .mobile-tab");
  tabs.forEach((tab) => {
    tab.setAttribute("aria-pressed", tab.classList.contains("active"));
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");

      // Update UI for both sidebar and mobile bottom tabs
      tabs.forEach((t) => {
        if (t.getAttribute("data-tab") === targetTab) {
          t.classList.add("active");
          t.setAttribute("aria-pressed", "true");
        } else {
          t.classList.remove("active");
          t.setAttribute("aria-pressed", "false");
        }
      });

      // Update State
      currentTab = targetTab;
      render();
      window.scrollTo(0, 0);
    });
  });

  // Theme Toggle Listeners
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
  const themeToggleTop = document.getElementById("theme-toggle-top");
  if (themeToggleTop) {
    themeToggleTop.addEventListener("click", toggleTheme);
  }
}

async function getReport(index) {
  const reportInfo = manifest.reports[index];
  if (!reportsData[reportInfo.date]) {
    const res = await fetch(`data/reports/${reportInfo.file}`);
    reportsData[reportInfo.date] = await res.json();
  }
  return reportsData[reportInfo.date];
}

function section(title, body, lead = "") {
  return `
    <section class="section">
      <div class="section-title">${title}</div>
      ${lead ? `<p class="section-lede">${lead}</p>` : ""}
      ${body}
    </section>
  `;
}

function statusCard(item) {
  const text = item.explain || item.text || item.note || item.benefit || "";
  return `
    <article class="summary-card card-${item.status || "ok"}">
      ${item.status ? `<div class="card-status status-${item.status}">${item.status}</div>` : ""}
      <div class="card-title">${item.title}</div>
      ${text ? `<p>${text}</p>` : ""}
      ${item.hindi ? `<p class="hindi-note">${item.hindi}</p>` : ""}
    </article>
  `;
}

function simpleCard({
  icon = "",
  title = "",
  kicker = "",
  body = "",
  badgeText = "",
  badgeTone = "monitor",
}) {
  return `
    <article class="lifestyle-card">
      ${badgeText ? `<span class="badge badge-${badgeTone} card-badge">${badgeText}</span>` : ""}
      ${icon ? `<div class="card-icon">${icon}</div>` : ""}
      <div class="card-title">${title}</div>
      ${kicker ? `<div class="card-kicker">${kicker}</div>` : ""}
      ${body ? `<p>${body}</p>` : ""}
    </article>
  `;
}

function cardGrid(cards, className = "") {
  return `<div class="card-grid ${className}">${cards.join("")}</div>`;
}

function simpleTable(headers, rows, className = "") {
  return `
    <div class="table-wrap">
      <table class="marker-table ${className}">
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
  `;
}

function renderDietChart(container) {
  let html = `
    <section class="care-brief">
      <div>
        <div class="eyebrow">Universal Care Plan</div>
        <h2>Today’s focus</h2>
        <p>Review the daily schedule and key medical markers below.</p>
      </div>
    </section>

    ${dietData.conditionSummary ? section("🧭 Current Snapshot", cardGrid(dietData.conditionSummary.map(statusCard), "summary-grid")) : ""}

    ${dietData.safetyFirst ? section("⚕️ Safety First", cardGrid(dietData.safetyFirst.map(statusCard), "summary-grid")) : ""}

    ${dietData.schedule ? section(
      "📅 Daily Schedule",
      `
      <div class="meal-day">
        <div class="meal-rows">
          ${dietData.schedule
            .map(
              (item) => `
            <div class="meal-row ${item.label && item.label.startsWith("✨") ? "meal-row-new" : ""}">
              <div class="meal-time">${item.time}<br>${item.label}</div>
              <div class="meal-food">${item.food}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      `,
      "Main daily checklist for food and medications.",
    ) : ""}

    ${
      dietData.goals
        ? section(
            "🎯 Primary Goals",
            `
        <ul class="clean-list">
          ${dietData.goals.map((g) => `<li>${g}</li>`).join("")}
        </ul>
      `,
          )
        : ""
    }

    <div class="disclaimer">
      This dashboard is an AI-generated guide. Keep all medical decisions with the treating doctor.
    </div>
  `;
  container.innerHTML = html;
}

function renderCategories(container) {
  if (!dietData.customModules || dietData.customModules.length === 0) {
    container.innerHTML = `<div class="disclaimer">No custom modules generated for this patient. The AI will populate this section with personalized protocols based on their profile.</div>`;
    return;
  }

  const html = dietData.customModules.map(mod => {
    let contentHtml = "";

    if (mod.type === "cardGrid") {
      const cards = mod.items.map(item => simpleCard({
        title: item.title,
        body: item.body,
        badgeText: item.badgeText,
        badgeTone: item.badgeTone || "ok"
      }));
      contentHtml = cardGrid(cards);
    } 
    else if (mod.type === "table") {
      const rows = mod.tableRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`);
      contentHtml = simpleTable(mod.tableHeaders || [], rows);
    }
    else if (mod.type === "list") {
      contentHtml = `<div class="recipe-card" style="padding: 15px;">
        <ul style="list-style: none; padding: 0;">
          ${mod.items.map(item => `
            <li style="margin-bottom:10px; font-size:13px; border-bottom: 1px solid var(--border); padding-bottom:8px;">
              <strong style="color:var(--navy); display:block;">${item.title}</strong>
              <span style="color:var(--slate);">${item.body}</span>
            </li>
          `).join("")}
        </ul>
      </div>`;
    }

    return section(mod.title, contentHtml, mod.description);
  }).join("");

  container.innerHTML = html;
}

function renderGuidelines(container) {
  let html = `
    <!-- DIETARY PRECAUTIONS -->
    <div class="section">
      <div class="section-title">⚠️ Dietary Precautions</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:15px;">
        ${
          dietData.precautions
            ? dietData.precautions
                .map(
                  (p) => `
          <div class="lifestyle-card">
            <div style="font-size:28px; margin-bottom:8px;">${p.icon}</div>
            <div style="font-weight:700; font-size:15px; margin-bottom:10px; color:var(--navy);">${p.title}</div>
            <ul style="list-style: none; padding: 0;">
              ${p.rules
                .map(
                  (rule) => `
                <li style="padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 13px; display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: var(--attention);">•</span>
                  <span style="color:var(--slate);">${rule}</span>
                </li>
              `,
                )
                .join("")}
            </ul>
          </div>
        `,
                )
                .join("")
            : ""
        }
      </div>
    </div>

    <!-- STRICT AVOIDANCES -->
    ${
      dietData.avoidFoods
        ? `
    <div class="section">
      <div class="section-title">❌ Strictly Avoid</div>
      <table class="marker-table">
        <thead>
          <tr><th>❌ Avoid</th><th>Reason (Allopathy)</th><th>Reason (Ayurveda)</th></tr>
        </thead>
        <tbody>
          ${dietData.avoidFoods
            .map(
              (a) => `
            <tr>
              <td><strong>${a.item}</strong></td>
              <td style="font-size:13px; color:#C62828;">${a.allopathy}</td>
              <td style="font-size:13px; color:var(--slate);">${a.ayurveda}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- MEDICATIONS -->
    ${
      dietData.medications
        ? `
    <div class="section">
      <div class="section-title">💊 Current Medications</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:15px;">
        ${dietData.medications
          .map(
            (m) => `
          <div class="lifestyle-card">
            <div style="font-size:28px; margin-bottom:8px;">${m.icon}</div>
            <div style="font-weight:700; font-size:15px; margin-bottom:4px; color:var(--navy);">${m.name}</div>
            <div style="font-size:13px; color:var(--slate);">${m.purpose}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    <!-- SAFETY NOTES -->
    ${
      dietData.safetyNotes
        ? `
    <div class="section">
      <div class="section-title">🛡️ Medication Safety</div>
      <div class="safety-warning">
        <strong>⚠️ Interaction Alert:</strong> Giloy, Karela, Kutki, Ashwagandha, high-dose cinnamon, and turmeric/curcumin supplements may affect sugar or liver safety. Do not self-start them with Huminsulin + Daparyl M.
      </div>
      <table class="marker-table">
        <thead>
          <tr><th>Item</th><th>Huminsulin</th><th>Daparyl M</th><th>Panlipase</th></tr>
        </thead>
        <tbody>
          ${dietData.safetyNotes
            .map(
              (s) => `
            <tr>
              <td><strong>${s.item}</strong></td>
              <td>${s.insulin}</td>
              <td>${s.daparylM}</td>
              <td>${s.panlipase}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    ${renderClinicalProtocols()}

    <!-- LIFESTYLE -->
    <div class="section">
      <div class="section-title">🚶 Lifestyle Rules</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
        ${dietData.lifestyle
          .map(
            (item) => `
          <div class="lifestyle-card">
            <div style="font-size:24px; margin-bottom:8px;">${item.emoji}</div>
            <div style="font-weight:600; font-size:15px; margin-bottom:5px; color:var(--navy);">${item.title}</div>
            <div style="font-size:13px; color:var(--slate);">${item.note}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>

    <!-- GLOSSARY -->
    ${
      dietData.glossary
        ? `
    <div class="section">
      <div class="section-title">📘 Simple Hindi Glossary</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:15px;">
        ${dietData.glossary
          .map(
            (g) => `
          <div class="lifestyle-card">
            <div style="font-weight:700; font-size:15px; color:var(--navy); margin-bottom:4px;">${g.term}</div>
            <div style="font-size:13px; color:var(--info); font-weight:600; margin-bottom:6px;">${g.hindi}</div>
            <div style="font-size:13px; color:var(--slate);">${g.meaning}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    <!-- SOURCES -->
    ${
      dietData.webCheckedSources
        ? `
    <div class="section">
      <div class="section-title">🔎 Web-Checked Medical Sources</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:15px;">
        ${dietData.webCheckedSources
          .map(
            (src) => `
          <div class="lifestyle-card">
            <div style="font-weight:700; font-size:15px; color:var(--navy); margin-bottom:4px;">${src.topic}</div>
            <div style="font-size:13px; color:var(--slate); margin-bottom:8px;">${src.takeaway}</div>
            <a href="${src.url}" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:var(--info); font-weight:700;">${src.source}</a>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }
  `;
  container.innerHTML = html;
}

async function renderReports(container) {
  let html = "";

  // Render all reports from manifest
  for (let i = 0; i < manifest.reports.length; i++) {
    const report = await getReport(i);
    html += `
      <div class="section">
        <div class="section-title">📊 Report: ${report.label}</div>
        <p style="margin-bottom:20px; color:var(--slate); font-size:14px;">${report.summary}</p>
        <div class="summary-grid" style="margin-bottom:20px;">
          ${report.keyMarkers
            .map(
              (m) => `
            <div class="summary-card card-${m.status}">
              <div class="card-status status-${m.status}">${m.status}</div>
              <div class="card-title" style="font-weight:600; font-size:12px;">${m.title}</div>
              <div class="card-value status-${m.status}" style="font-size:18px;">${m.value}</div>
            </div>
          `,
            )
            .join("")}
        </div>

        ${report.sections
          .map(
            (s) => `
          <div style="margin-bottom:30px;">
            <div style="font-weight:700; font-size:15px; margin-bottom:10px;">${s.icon} ${s.title}</div>
            ${
              s.type === "table"
                ? `
              <div class="checklist-table-wrap">
                <table class="marker-table">
                  <thead><tr>${s.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
                  <tbody>
                    ${s.rows
                      .map(
                        (row) => `
                      <tr>
                        <td>${row[0]}</td>
                        <td style="font-family: 'DM Mono', monospace; font-weight:600;">${row[1]}</td>
                        <td style="font-size:12px;">${row[2]}</td>
                        <td><span class="badge badge-${row[3]}">${row[3]}</span></td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
                : s.type === "list"
                  ? `
              <ul style="list-style: none; padding: 0;">
                ${s.items
                  .map(
                    (item) => `
                  <li style="padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px; display: flex; align-items: flex-start; gap: 8px;">
                    <span style="color: var(--attention);">•</span>
                    <span>${item}</span>
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            `
                  : ""
            }
            ${s.note ? `<p class="section-note">${s.note}</p>` : ""}
          </div>
        `,
          )
          .join("")}

        ${
          report.targets
            ? `
          <div style="margin-bottom:30px;">
            <div style="font-weight:700; font-size:15px; margin-bottom:10px;">🎯 Recovery Targets</div>
            ${simpleTable(
              ["Marker", "Current", "3 months", "6 months"],
              report.targets.map(
                (t) => `
                <tr>
                  <td><strong>${t.marker}</strong></td>
                  <td>${t.current}</td>
                  <td>${t.target3}</td>
                  <td>${t.target6}</td>
                </tr>
              `,
              ),
            )}
          </div>
        `
            : ""
        }
      </div>
      <hr style="border: 0; border-top: 1px solid var(--border); margin: 40px 0;">
    `;
  }

  // Pending Tests
  if (dietData.pendingTests) {
    html += `
      <div class="section">
        <div class="section-title">🧪 Pending Tests</div>
        <table class="marker-table">
          <thead><tr><th>Test</th><th>Order</th><th>Reveals</th></tr></thead>
          <tbody>
            ${dietData.pendingTests
              .map(
                (t) => `
              <tr>
                <td><strong>${t.test}</strong></td>
                <td><span class="badge badge-monitor">${t.orderedBy}</span></td>
                <td style="font-size:13px;">${t.reveals}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = html;
}

init();
