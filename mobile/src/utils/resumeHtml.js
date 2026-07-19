/**
 * Print-ready HTML for the resume PDF (rendered by expo-print).
 *
 * Standalone by design: no theme tokens, no dark mode. A resume is printed on
 * white paper and read by ATS software, so it uses a plain single-column layout
 * with real text (not images) and web-safe fonts.
 */

const esc = (v) =>
  String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Preserve the line breaks a user typed in a textarea. */
const multiline = (v) => esc(v).replace(/\n/g, "<br/>");

const has = (v) => Boolean(String(v || "").trim());

export function buildResumeHtml(data) {
  const { personal = {}, education = [], experience = [], skills = [] } = data || {};

  const contact = [personal.email, personal.phone, personal.location, personal.linkedin]
    .filter(has)
    .map((c) => `<span>${esc(c)}</span>`)
    .join('<span class="sep">•</span>');

  const section = (title, body) =>
    body ? `<section><h2>${title}</h2>${body}</section>` : "";

  const expHtml = experience
    .filter((e) => has(e.role) || has(e.company))
    .map(
      (e) => `
        <div class="entry">
          <div class="entry-head">
            <strong>${esc(e.role)}</strong>
            <span class="dates">${esc(e.start)}${has(e.end) ? " – " + esc(e.end) : has(e.start) ? " – Present" : ""}</span>
          </div>
          ${has(e.company) ? `<div class="org">${esc(e.company)}</div>` : ""}
          ${has(e.description) ? `<p>${multiline(e.description)}</p>` : ""}
        </div>`
    )
    .join("");

  const eduHtml = education
    .filter((e) => has(e.degree) || has(e.institution))
    .map(
      (e) => `
        <div class="entry">
          <div class="entry-head">
            <strong>${esc(e.degree)}</strong>
            <span class="dates">${esc(e.year)}</span>
          </div>
          ${has(e.institution) ? `<div class="org">${esc(e.institution)}</div>` : ""}
          ${has(e.score) ? `<p>${esc(e.score)}</p>` : ""}
        </div>`
    )
    .join("");

  const skillsHtml = skills.filter(has).length
    ? `<div class="skills">${skills
        .filter(has)
        .map((s) => `<span class="skill">${esc(s)}</span>`)
        .join("")}</div>`
    : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @page { margin: 40px 44px; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: #1A2330; font-size: 12.5px; line-height: 1.5; margin: 0;
      }
      header { border-bottom: 2px solid #274B7F; padding-bottom: 14px; margin-bottom: 20px; }
      h1 { font-size: 26px; margin: 0 0 3px; letter-spacing: -0.4px; color: #1A2330; }
      .headline { font-size: 14px; color: #274B7F; font-weight: 600; margin: 0 0 8px; }
      .contact { font-size: 11.5px; color: #6B7785; }
      .contact .sep { margin: 0 7px; color: #C4CBD3; }
      section { margin-bottom: 18px; page-break-inside: avoid; }
      h2 {
        font-size: 11.5px; text-transform: uppercase; letter-spacing: 1px;
        color: #274B7F; margin: 0 0 9px; padding-bottom: 4px;
        border-bottom: 1px solid #E4E8EC;
      }
      .entry { margin-bottom: 12px; page-break-inside: avoid; }
      .entry:last-child { margin-bottom: 0; }
      .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
      .entry-head strong { font-size: 13.5px; }
      .dates { font-size: 11px; color: #6B7785; white-space: nowrap; }
      .org { font-size: 12px; color: #6B7785; margin-top: 1px; }
      p { margin: 5px 0 0; }
      .skills { display: flex; flex-wrap: wrap; gap: 6px; }
      .skill {
        background: #E8EEF6; color: #274B7F; font-size: 11.5px; font-weight: 600;
        padding: 4px 10px; border-radius: 999px;
      }
      footer { margin-top: 26px; text-align: center; font-size: 9.5px; color: #9AA5B1; }
    </style>
  </head>
  <body>
    <header>
      <h1>${esc(personal.name) || "Your Name"}</h1>
      ${has(personal.headline) ? `<p class="headline">${esc(personal.headline)}</p>` : ""}
      ${contact ? `<div class="contact">${contact}</div>` : ""}
    </header>

    ${section("Summary", has(personal.about) ? `<p style="margin:0">${multiline(personal.about)}</p>` : "")}
    ${section("Experience", expHtml)}
    ${section("Education", eduHtml)}
    ${section("Skills", skillsHtml)}

    <footer>Generated with RecruitKR</footer>
  </body>
</html>`;
}
