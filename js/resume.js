(function () {
  "use strict";

  var P = window.PROFILE;
  var LEVEL = { 4: "Advanced", 3: "Intermediate", 2: "Pre-intermediate" };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function month(ym) {
    if (!ym) return "Present";
    var p = ym.split("-");
    return MONTHS[+p[1] - 1] + " " + p[0];
  }
  function strip(url) { return url.replace(/^https?:\/\/(www\.)?/, ""); }

  var contact = [
    ['<a href="' + esc(P.links.website) + '">' + esc(strip(P.links.website)) + "</a>"],
    ['<a href="mailto:' + esc(P.links.email) + '">' + esc(P.links.email) + "</a>"],
    ['<a href="' + esc(P.links.github) + '">' + esc(strip(P.links.github)) + "</a>"],
    ['<a href="' + esc(P.links.linkedin) + '">' + esc(strip(P.links.linkedin)) + "</a>"]
  ].map(function (c) { return "<li>" + c[0] + "</li>"; }).join("");

  var experience = P.experience.map(function (e) {
    var projects = e.projects.map(function (p) {
      return '<div class="proj"><h4>' + esc(p.name) + "</h4>" +
        (p.points.length ? "<ul>" + p.points.map(function (pt) { return "<li>" + esc(pt) + "</li>"; }).join("") + "</ul>" : "") +
        "</div>";
    }).join("");
    return '<article class="job">' +
      '<header><div><h3>' + esc(e.company) + '</h3><p class="role">' + esc(e.role) + "</p></div>" +
      '<p class="when">' + month(e.from) + " – " + month(e.to) + "</p></header>" +
      projects +
      '<p class="stack">' + e.stack.map(esc).join(" · ") + "</p>" +
      "</article>";
  }).join("");

  var earlier = P.earlier.map(function (e) {
    return '<li><span class="co">' + esc(e.company) + '</span><span class="ro">' + esc(e.role) +
      '</span><span class="when">' + month(e.from) + " – " + month(e.to) + "</span></li>";
  }).join("");

  var titles = {
    languages: "Languages", frameworks: "Frameworks & Libraries", databases: "Databases",
    platform: "Tools & Platforms", concepts: "Concepts"
  };
  var skills = Object.keys(P.skills).map(function (g) {
    return '<div class="skill-group"><h4>' + esc(titles[g] || g) + "</h4><ul>" +
      P.skills[g].map(function (s) {
        return "<li><span>" + esc(s[0]) + "</span>" + (s[1] ? '<em>' + LEVEL[s[1]] + "</em>" : "") + "</li>";
      }).join("") + "</ul></div>";
  }).join("");

  var education = P.education.map(function (e) {
    return '<li><strong>' + esc(e.degree) + "</strong><span>" + esc(e.school) + " · " + esc(e.from) + " – " + esc(e.to) +
      (e.note ? " · " + esc(e.note) : "") + "</span></li>";
  }).join("");

  document.getElementById("resume").innerHTML =
    '<header class="top">' +
      "<div><h1>" + esc(P.name) + '</h1><p class="title">' + esc(P.title) + "</p></div>" +
      '<ul class="contact">' + contact + "</ul>" +
    "</header>" +
    '<section><h2>Summary</h2><p class="summary">' + P.summary.map(esc).join(" ") + "</p></section>" +
    '<section><h2>Experience</h2>' + experience +
      '<h3 class="earlier-h">Earlier roles</h3><ul class="earlier">' + earlier + "</ul></section>" +
    '<section><h2>Skills</h2><div class="skills">' + skills + "</div></section>" +
    '<section><h2>Education</h2><ul class="edu">' + education + "</ul></section>";
})();
