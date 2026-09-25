(function () {
  "use strict";

  var P = window.PROFILE;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HOST = location.host || "nazanin.local";

  // ---------- helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function span(cls, text) { return '<span class="' + cls + '">' + esc(text) + "</span>"; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtMonth(ym) {
    if (!ym) return "present";
    var p = ym.split("-");
    return MONTHS[+p[1] - 1] + " " + p[0];
  }
  function monthsBetween(from, to) {
    var a = from.split("-"), b;
    if (to) b = to.split("-");
    else { var d = new Date(); b = [d.getFullYear(), d.getMonth() + 1]; }
    return (+b[0] - +a[0]) * 12 + (+b[1] - +a[1]);
  }
  function fmtDuration(months) {
    var y = Math.floor(months / 12), m = months % 12, out = [];
    if (y) out.push(y + (y === 1 ? " yr" : " yrs"));
    if (m) out.push(m + " mo");
    return out.join(" ") || "< 1 mo";
  }

  // Pretty-print a value as syntax-highlighted JSON.
  function jsonHtml(v, ind) {
    ind = ind || "";
    var next = ind + "  ";
    if (v === null) return span("t-kw", "null");
    if (Array.isArray(v)) {
      if (!v.length) return "[]";
      var flat = v.every(function (x) { return typeof x !== "object" || x === null; });
      if (flat && JSON.stringify(v).length < 44) {
        return "[" + v.map(function (x) { return jsonHtml(x, next); }).join(", ") + "]";
      }
      return "[\n" + v.map(function (x) { return next + jsonHtml(x, next); }).join(",\n") + "\n" + ind + "]";
    }
    if (typeof v === "object") {
      var keys = Object.keys(v);
      if (!keys.length) return "{}";
      return "{\n" + keys.map(function (k) {
        return next + span("t-key", '"' + k + '"') + ": " + jsonHtml(v[k], next);
      }).join(",\n") + "\n" + ind + "}";
    }
    if (typeof v === "number") return span("t-num", String(v));
    if (typeof v === "boolean") return span("t-kw", String(v));
    return span("t-str", JSON.stringify(v));
  }

  var LEVEL = { 4: "advanced", 3: "intermediate", 2: "pre-intermediate" };

  // ---------- API model (shared by page + console) ----------
  var current = P.experience[0];
  var api = {
    whoami: function () {
      return {
        name: P.name,
        role: P.title,
        currentlyAt: current.company,
        experience: P.yearsOfExperience + "+ years",
        leadership: P.leadershipYears + "+ years",
        focus: ["Spring Boot", "Microservices", "Messaging", "DDD"],
        github: P.links.github.replace("https://", "")
      };
    },
    experience: function (id) {
      var e = P.experience.filter(function (x) { return x.id === id; })[0];
      if (!e) return null;
      return {
        company: e.company,
        role: e.role,
        from: e.from,
        to: e.to,
        duration: fmtDuration(monthsBetween(e.from, e.to)),
        projects: e.projects.map(function (p) { return p.name; }),
        stack: e.stack
      };
    },
    experienceIndex: function () {
      return P.experience.map(function (e) {
        return { id: e.id, company: e.company, role: e.role, from: e.from, to: e.to };
      });
    },
    skills: function () {
      var out = {};
      Object.keys(P.skills).forEach(function (g) {
        out[g] = {};
        P.skills[g].forEach(function (s) { out[g][s[0]] = s[1] ? LEVEL[s[1]] : "in use"; });
      });
      return out;
    },
    education: function () { return P.education; },
    contact: function () {
      return { email: P.links.email, github: P.links.github, linkedin: P.links.linkedin };
    },
    health: function () {
      return {
        status: "UP",
        components: {
          db: { status: "UP", details: { engines: ["Oracle", "MongoDB", "MySQL", "PostgreSQL", "Redis"] } },
          messaging: { status: "UP", details: { brokers: ["RabbitMQ", "Apache Kafka", "EMQX"] } },
          career: { status: "UP", details: { since: 2017, currentlyAt: current.company } }
        }
      };
    }
  };

  // ---------- boot screen ----------
  var BANNER = [
    "                                  _     ",
    "   ____  ____ _____  ____ _____  (_)___ ",
    "  / __ \\/ __ `/_  / / __ `/ __ \\/ / __ \\",
    " / / / / /_/ / / /_/ /_/ / / / / / / / /",
    "/_/ /_/\\__,_/ /___/\\__,_/_/ /_/_/_/ /_/ "
  ].join("\n");

  function bootLines() {
    var yrs = P.yearsOfExperience;
    return [
      ["NazaninApplication", "Starting NazaninApplication using Java 21 with PID 1"],
      ["NazaninApplication", 'No active profile set, falling back to 1 default profile: "prod"'],
      ["RepositoryConfigurationDelegate", "Bootstrapping Spring Data MongoDB repositories in DEFAULT mode."],
      ["HikariDataSource", "HikariPool-1 - Start completed. (oracle)"],
      ["RabbitAdmin", "Declared exchanges: saga.commands, saga.replies"],
      ["EmqxConnector", "Connected to EMQX broker, subscribed to location/#"],
      ["KeycloakSecurityConfig", "Resource server configured with realm 'portfolio'"],
      ["TomcatWebServer", "Tomcat started on port 443 (https) with context path '/'"],
      ["NazaninApplication", "Started NazaninApplication in " + yrs + ".0 years (process running since 2017)"]
    ];
  }

  function runBoot() {
    var boot = $("#boot");
    var seen = false;
    try { seen = sessionStorage.getItem("booted") === "1"; } catch (e) {}
    if (seen || reduceMotion) return;

    boot.hidden = false;
    document.body.style.overflow = "hidden";
    var log = $("#boot-log");
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      try { sessionStorage.setItem("booted", "1"); } catch (e) {}
      boot.classList.add("is-done");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", finish);
      setTimeout(function () { boot.hidden = true; }, 400);
    }
    document.addEventListener("keydown", finish);
    boot.addEventListener("click", finish);

    log.innerHTML = '<span class="banner">' + esc(BANNER) + "</span>\n" +
      span("lvl", " :: nazanin :: ") + span("ts", "              (v" + P.yearsOfExperience + ".0.0-RELEASE)") + "\n\n";

    var lines = bootLines();
    (async function () {
      await sleep(450);
      for (var i = 0; i < lines.length && !done; i++) {
        var ts = new Date().toISOString().replace("Z", "+00:00");
        var cls = "c.n.portfolio." + lines[i][0];
        log.innerHTML += span("ts", ts) + "  " + span("lvl", "INFO") + " 1 --- [main] " +
          span("cls", cls.padEnd(48).slice(0, 48)) + " : " + esc(lines[i][1]) + "\n";
        await sleep(i === lines.length - 1 ? 700 : 130 + Math.random() * 160);
      }
      finish();
    })();
  }

  // ---------- hero ----------
  function renderHero() {
    $("#hero-name").textContent = P.name;
    $("#hero-title").textContent = P.title;
    $("#hero-headline").textContent = P.headline;

    var metrics = [
      ["experience", P.yearsOfExperience + "+", "yrs"],
      ["users served", "3M+", "mobile bank"],
      ["team leadership", P.leadershipYears + "+", "yrs"],
      ["degrees", "2", "top student"]
    ];
    $("#metrics").innerHTML = metrics.map(function (m) {
      return "<div><dt>" + esc(m[0]) + "</dt><dd>" + esc(m[1]) + "<small>" + esc(m[2]) + "</small></dd></div>";
    }).join("");

    var code = $("#whoami code");
    var cmd = "curl -s https://" + HOST + "/api/v1/whoami | jq";
    var prompt = span("t-ok", "$ ");
    var body = jsonHtml(api.whoami());

    if (reduceMotion) {
      code.innerHTML = prompt + esc(cmd) + "\n" + body;
      return;
    }
    (async function () {
      await sleep(document.getElementById("boot").hidden ? 400 : 3200);
      for (var i = 1; i <= cmd.length; i++) {
        code.innerHTML = prompt + '<span class="caret">' + esc(cmd.slice(0, i)) + "</span>";
        await sleep(22 + Math.random() * 30);
      }
      await sleep(350);
      var lines = body.split("\n");
      for (var j = 1; j <= lines.length; j++) {
        code.innerHTML = prompt + esc(cmd) + "\n" + lines.slice(0, j).join("\n");
        await sleep(45);
      }
      code.innerHTML += "\n" + prompt + '<span class="caret"></span>';
    })();
  }

  // ---------- about ----------
  function wrap(text, width) {
    var words = text.split(" "), lines = [], line = "";
    words.forEach(function (w) {
      if ((line + " " + w).trim().length > width) { lines.push(line); line = w; }
      else line = (line + " " + w).trim();
    });
    if (line) lines.push(line);
    return lines;
  }

  function renderAbout() {
    var kw = function (s) { return span("t-kw", s); };
    var ty = function (s) { return span("t-type", s); };
    var st = function (s) { return span("t-str", '"' + s + '"'); };
    var nu = function (s) { return span("t-num", String(s)); };
    var an = function (s) { return span("t-ann", s); };
    var cm = function (s) { return span("t-com", s); };

    var L = [];
    L.push(kw("package") + " dev.nazanin;");
    L.push("");
    L.push(cm("/**"));
    P.summary.forEach(function (para, i) {
      if (i) L.push(cm(" *"));
      wrap(para, 68).forEach(function (l) { L.push(cm(" * " + l)); });
    });
    L.push(cm(" */"));
    L.push(an("@Service"));
    L.push(an("@Profile") + "(" + st("prod") + ")");
    L.push(kw("public class") + " " + ty("Nazanin") + " " + kw("implements") + " " + ty("SoftwareEngineer") + " {");
    L.push("");
    L.push("    " + kw("private final") + " " + ty("String") + " role = " + st(P.title) + ";");
    L.push("    " + kw("private final") + " " + ty("String") + " currentlyAt = " + st(current.company) + ";");
    L.push("    " + kw("private final int") + " yearsOfExperience = " + nu(P.yearsOfExperience) + ";");
    L.push("    " + kw("private final int") + " yearsLeadingTeams = " + nu(P.leadershipYears) + ";");
    L.push("");
    L.push("    " + an("@Override"));
    L.push("    " + kw("public") + " " + ty("List") + "&lt;" + ty("String") + "&gt; focus() {");
    L.push("        " + kw("return") + " " + ty("List") + ".of(" +
      ["Spring Boot", "Microservices", "Saga", "DDD", "Messaging"].map(st).join(", ") + ");");
    L.push("    }");
    L.push("");
    L.push("    " + an("@Override"));
    L.push("    " + kw("public") + " " + ty("Education") + " education() {");
    var ed = P.education[0];
    L.push("        " + kw("return new") + " " + ty("Education") + "(" + st(ed.degree) + ", " + st(ed.school) + ", " + ty("Honors") + ".TOP_STUDENT);");
    L.push("    }");
    L.push("}");

    var key = function (s) { return span("t-key", s) + ":"; };
    var list = function (arr) { return "[" + arr.map(esc).join(", ") + "]"; };
    var Y = [
      cm("# how she runs in production"),
      key("spring"),
      "  " + key("application"),
      "    " + key("name") + " " + span("t-str", P.handle),
      "  " + key("profiles"),
      "    " + key("active") + " " + span("t-str", "prod"),
      "",
      key(P.handle),
      "  " + key("role") + " " + span("t-str", P.title),
      "  " + key("currently-at") + " " + span("t-str", current.company),
      "  " + key("experience-years") + " " + nu(P.yearsOfExperience),
      "  " + key("architecture") + " " + list(["microservices", "orchestration", "saga", "ddd"]),
      "  " + key("messaging") + " " + list(["RabbitMQ", "Apache Kafka", "EMQX"]),
      "  " + key("datastores") + " " + list(["Oracle", "MongoDB", "MySQL", "PostgreSQL", "Redis"]),
      "  " + key("security") + " " + list(["Spring Security", "Keycloak"]),
      "  " + key("observability") + " " + list(["Prometheus", "Grafana", "Spring Boot Admin"]),
      "  " + key("delivery") + " " + list(["Docker", "Jenkins", "Kubernetes"])
    ];

    var files = { java: L, yml: Y };
    var target = $("#about-code code");
    function show(f) {
      target.innerHTML = files[f].map(function (l) { return '<span class="ln">' + (l || " ") + "</span>"; }).join("");
      document.querySelectorAll(".editor__tab").forEach(function (t) {
        var on = t.getAttribute("data-file") === f;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
    }
    document.querySelectorAll(".editor__tab").forEach(function (t) {
      t.addEventListener("click", function () { show(t.getAttribute("data-file")); });
    });
    show("java");
  }

  // ---------- experience ----------
  function renderExperience() {
    var chev = '<svg class="op__chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    $("#experience-list").innerHTML = P.experience.map(function (e, i) {
      var open = i === 0;
      var dur = fmtDuration(monthsBetween(e.from, e.to));
      var projects = e.projects.map(function (p) {
        return '<div class="proj"><h4>' + esc(p.name) + "</h4>" +
          (p.points.length ? "<ul>" + p.points.map(function (pt) { return "<li>" + esc(pt) + "</li>"; }).join("") + "</ul>" : "") +
          "</div>";
      }).join("");
      return '<article class="op' + (open ? " is-open" : "") + '">' +
        '<button class="op__head" type="button" aria-expanded="' + open + '" aria-controls="op-' + e.id + '">' +
          '<span class="op__method">GET</span>' +
          '<span class="op__path">/experience/' + esc(e.id) + "</span>" +
          '<span class="op__summary">' + esc(e.role) + " · " + esc(e.company) + "</span>" +
          '<span class="op__when">' + fmtMonth(e.from) + " → " + fmtMonth(e.to) + "</span>" + chev +
        "</button>" +
        '<div class="op__body" id="op-' + e.id + '">' +
          '<div class="op__meta"><span><b>200</b> OK</span><span>duration: ' + dur + "</span><span>" + esc(e.company) + "</span></div>" +
          '<div class="op__projects">' + projects + "</div>" +
          '<div class="chips">' + e.stack.map(function (s) { return '<span class="chip">' + esc(s) + "</span>"; }).join("") + "</div>" +
          '<details class="op__json"><summary>response body (application/json)</summary><pre class="window__body">' +
            jsonHtml(api.experience(e.id)) + "</pre></details>" +
        "</div></article>";
    }).join("");

    $("#experience-list").addEventListener("click", function (ev) {
      var head = ev.target.closest(".op__head");
      if (!head) return;
      var op = head.parentElement;
      var open = op.classList.toggle("is-open");
      head.setAttribute("aria-expanded", String(open));
    });

    $("#legacy-list").innerHTML = P.earlier.map(function (e) {
      return '<li><span class="co">' + esc(e.company) + '</span><span class="ro">' + esc(e.role) +
        '</span><span class="dt">' + fmtMonth(e.from) + " → " + fmtMonth(e.to) + "</span></li>";
    }).join("");
  }

  // ---------- architecture / saga ----------
  var SVGNS = "http://www.w3.org/2000/svg";
  var nodes = {
    orch: { x: 30, y: 165, w: 170, h: 70, label: "orchestrator", sub: "saga coordinator" },
    mq: { x: 265, y: 165, w: 150, h: 70, label: "RabbitMQ", sub: "commands · replies", cls: "node--broker" },
    invoice: { x: 490, y: 35, w: 200, h: 64, label: "invoice-svc", sub: "Oracle · Hibernate" },
    credit: { x: 490, y: 168, w: 200, h: 64, label: "credit-svc", sub: "MongoDB" },
    ledger: { x: 490, y: 301, w: 200, h: 64, label: "ledger-svc (GL)", sub: "Oracle · Redis cache" }
  };
  var steps = [
    { svc: "invoice", cmd: "ReserveInvoice", ok: "InvoiceReserved", comp: "ReleaseInvoice" },
    { svc: "credit", cmd: "HoldCreditLimit", ok: "CreditLimitHeld", comp: "ReleaseCreditLimit" },
    { svc: "ledger", cmd: "PostLedgerEntry", ok: "LedgerEntryPosted", err: "InsufficientBalanceException" }
  ];

  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function rightOf(n) { return [n.x + n.w, n.y + n.h / 2]; }
  function leftOf(n) { return [n.x, n.y + n.h / 2]; }

  // SVG path from the orchestrator through the broker to a service, following the drawn edges.
  function routeTo(svc, back) {
    var o = rightOf(nodes.orch), m = leftOf(nodes.mq), p = rightOf(nodes.mq), q = leftOf(nodes[svc]);
    var mx = (p[0] + q[0]) / 2;
    if (!back) {
      return "M" + o + " L" + m + " L" + p + " C" + mx + "," + p[1] + " " + mx + "," + q[1] + " " + q;
    }
    return "M" + q + " C" + mx + "," + q[1] + " " + mx + "," + p[1] + " " + p + " L" + m + " L" + o;
  }

  function renderArch() {
    var svg = $("#arch-svg");
    var edges = svgEl("g", {}, svg);
    var a = rightOf(nodes.orch), b = leftOf(nodes.mq);
    svgEl("line", { class: "edge", x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, edges);
    ["invoice", "credit", "ledger"].forEach(function (k) {
      var p = rightOf(nodes.mq), q = leftOf(nodes[k]);
      var mx = (p[0] + q[0]) / 2;
      svgEl("path", { class: "edge", d: "M" + p[0] + "," + p[1] + " C" + mx + "," + p[1] + " " + mx + "," + q[1] + " " + q[0] + "," + q[1] }, edges);
    });

    Object.keys(nodes).forEach(function (k) {
      var n = nodes[k];
      var g = svgEl("g", { class: "node " + (n.cls || ""), "data-node": k }, svg);
      svgEl("rect", { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8 }, g);
      var t = svgEl("text", { x: n.x + 14, y: n.y + n.h / 2 - 3 }, g); t.textContent = n.label;
      var s = svgEl("text", { class: "sub", x: n.x + 14, y: n.y + n.h / 2 + 15 }, g); s.textContent = n.sub;
    });
    nodes.layer = svgEl("g", {}, svg);
  }

  function animatePacket(d, cls) {
    if (reduceMotion) return sleep(250);
    var path = svgEl("path", { d: d, fill: "none", stroke: "none" }, nodes.layer);
    var total = path.getTotalLength();
    var start0 = path.getPointAtLength(0);
    var c = svgEl("circle", { class: "packet " + cls, r: 6, cx: start0.x, cy: start0.y }, nodes.layer);
    var duration = 900;
    return new Promise(function (resolve) {
      var start = null;
      function frame(t) {
        if (!start) start = t;
        var k = Math.min((t - start) / duration, 1);
        k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var pt = path.getPointAtLength(k * total);
        c.setAttribute("cx", pt.x);
        c.setAttribute("cy", pt.y);
        if (k < 1) requestAnimationFrame(frame);
        else { c.remove(); path.remove(); resolve(); }
      }
      requestAnimationFrame(frame);
    });
  }

  function setNode(k, state) {
    var g = $('[data-node="' + k + '"]');
    g.classList.remove("is-active", "is-failed", "is-comp");
    if (state) g.classList.add(state);
  }

  var sagaLog = null;
  function logLine(html) {
    var t = new Date().toTimeString().slice(0, 8) + "." + String(Date.now() % 1000).padStart(3, "0");
    sagaLog.innerHTML += span("t-dim", t) + " " + html + "\n";
    sagaLog.scrollTop = sagaLog.scrollHeight;
  }

  var sagaRunning = false;
  async function runSaga(fail) {
    if (sagaRunning) return;
    sagaRunning = true;
    var btns = [$("#saga-run"), $("#saga-fail")];
    btns.forEach(function (b) { b.disabled = true; });
    Object.keys(nodes).forEach(function (k) { if (k !== "layer") setNode(k, null); });

    var id = Math.random().toString(16).slice(2, 6);
    sagaLog.innerHTML = "";
    logLine(span("t-ok", "INFO ") + " saga[" + id + "] " + span("t-ann", "STARTED") + " FinanceRequestSaga");
    setNode("orch", "is-active");

    var done = [];
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      var route = routeTo(s.svc), back = routeTo(s.svc, true);
      logLine(span("t-key", "→ cmd ") + " " + s.cmd + span("t-dim", "  exchange=saga.commands key=" + s.svc));
      setNode("mq", "is-active");
      await animatePacket(route, "packet--cmd");
      setNode("mq", null);

      if (fail && s.err) {
        setNode(s.svc, "is-failed");
        logLine(span("t-err", "ERROR") + " " + s.svc + " rejected " + s.cmd + ": " + span("t-err", s.err));
        await animatePacket(back, "packet--err");
        logLine(span("t-err", "← nack") + " " + s.cmd + " failed, starting compensation");
        break;
      }

      setNode(s.svc, "is-active");
      await animatePacket(back, "packet--ok");
      logLine(span("t-ok", "← ok  ") + " " + s.ok);
      done.push(s);
    }

    if (fail) {
      for (var j = done.length - 1; j >= 0; j--) {
        var c = done[j];
        logLine(span("t-num", "↺ comp") + " " + c.comp + span("t-dim", "  key=" + c.svc));
        await animatePacket(routeTo(c.svc), "packet--comp");
        setNode(c.svc, "is-comp");
        await animatePacket(routeTo(c.svc, true), "packet--ok");
        logLine(span("t-ok", "← ok  ") + " " + c.comp.replace("Release", "") + "Released");
      }
      logLine(span("t-num", "WARN ") + " saga[" + id + "] " + span("t-num", "COMPENSATED") + span("t-dim", "  state is consistent, nothing half-done"));
    } else {
      logLine(span("t-ok", "INFO ") + " saga[" + id + "] " + span("t-ok", "COMPLETED") + span("t-dim", "  " + steps.length + "/" + steps.length + " steps"));
    }

    setNode("orch", null);
    btns.forEach(function (b) { b.disabled = false; });
    sagaRunning = false;
  }

  function initSaga() {
    sagaLog = $("#saga-log");
    sagaLog.innerHTML = span("t-dim", "# press \"run saga\" to send a request through the system\n# or \"run with failure\" to watch it roll back\n");
    $("#saga-run").addEventListener("click", function () { runSaga(false); });
    $("#saga-fail").addEventListener("click", function () { runSaga(true); });
  }

  // ---------- skills ----------
  function renderSkills() {
    var titles = {
      languages: "languages", frameworks: "frameworks & libraries", databases: "databases",
      platform: "tools & platforms", concepts: "concepts"
    };
    $("#skills-grid").innerHTML = Object.keys(P.skills).map(function (g) {
      return '<div class="dep-group"><h3>&lt;!-- ' + esc(titles[g] || g) + " --&gt;</h3><ul>" +
        P.skills[g].map(function (s) {
          var lvl = s[1];
          var bars = "";
          for (var i = 1; i <= 3; i++) bars += "<i" + (i <= lvl - 1 ? ' class="on"' : "") + "></i>";
          return '<li class="dep' + (lvl ? "" : " dep--tool") + '"><span class="dep__name">' + esc(s[0]) +
            '</span><span class="dep__lvl">' + (lvl ? LEVEL[lvl] : "in use") + "</span>" +
            (lvl ? '<span class="dep__bar" aria-hidden="true">' + bars + "</span>" : "") + "</li>";
        }).join("") + "</ul></div>";
    }).join("");
  }

  // ---------- education ----------
  function renderEducation() {
    $("#education-list").innerHTML = P.education.map(function (e) {
      return '<div class="edu__card"><h3>' + esc(e.degree) + "</h3><p>" + esc(e.school) + " · " + esc(e.from) + " – " + esc(e.to) +
        "</p>" + (e.note ? '<span class="badge">' + esc(e.note) + "</span>" : "") + "</div>";
    }).join("");
  }

  // ---------- contact ----------
  function renderContact() {
    var form = $("#contact-form");
    var preview = $("#contact-preview");
    var err = $("#contact-error");

    function body() {
      var d = new FormData(form);
      var o = { name: d.get("name").trim(), message: d.get("message").trim() };
      if (d.get("company").trim()) o.company = d.get("company").trim();
      return o;
    }
    function draw(status) {
      preview.innerHTML = span("t-ok", "POST") + " /api/v1/contact HTTP/1.1\n" +
        span("t-key", "Host") + ": " + esc(HOST) + "\n" +
        span("t-key", "Content-Type") + ": application/json\n\n" + jsonHtml(body()) +
        (status ? "\n\n" + status : "");
    }
    form.addEventListener("input", function () { err.textContent = ""; draw(); });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var b = body();
      if (!b.name || !b.message) {
        err.textContent = "400 Bad Request: name and message are required";
        draw(span("t-err", "HTTP/1.1 400 Bad Request"));
        return;
      }
      var text = b.message + "\n\n" + b.name + (b.company ? "\n" + b.company : "");
      var href = "mailto:" + P.links.email + "?subject=" + encodeURIComponent("Hello from " + b.name) +
        "&body=" + encodeURIComponent(text);
      draw(span("t-ok", "HTTP/1.1 202 Accepted") + span("t-dim", "\n# handed off to your mail client"));
      window.location.href = href;
    });
    draw();

    var icon = {
      email: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      github: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 00-3.6 22.4c.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 015.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0012 .5z"/></svg>',
      linkedin: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"/></svg>'
    };
    $("#contact-links").innerHTML = [
      ["email", "mailto:" + P.links.email, P.links.email],
      ["github", P.links.github, P.links.github.replace("https://", "")],
      ["linkedin", P.links.linkedin, "linkedin.com/in/" + P.links.linkedin.split("/in/")[1]]
    ].map(function (l) {
      var ext = l[0] === "email" ? "" : ' target="_blank" rel="noopener"';
      return '<li><a class="btn" href="' + esc(l[1]) + '"' + ext + ">" + icon[l[0]] + esc(l[2]) + "</a></li>";
    }).join("");
  }

  // ---------- footer ----------
  function renderFooter() {
    $("#footer-health").innerHTML = span("t-dim", "$ curl -s https://" + esc(HOST) + "/actuator/health") + "\n" +
      jsonHtml({ status: "UP", owner: P.name, year: new Date().getFullYear() });
  }

  // ---------- console ----------
  var consoleEl, outEl, inputEl, history = [], hIdx = 0, lastFocus = null;

  function print(html) { outEl.insertAdjacentHTML("beforeend", html + "\n"); outEl.scrollTop = outEl.scrollHeight; }
  function printCmd(cmd) { print('<span class="cmd">' + esc(cmd) + "</span>"); }

  var COMMANDS = {
    help: {
      desc: "list commands",
      run: function () {
        var rows = Object.keys(COMMANDS).filter(function (k) { return !COMMANDS[k].hidden; }).map(function (k) {
          return "  " + span("t-key", (k + (COMMANDS[k].args ? " " + COMMANDS[k].args : "")).padEnd(22)) + span("t-dim", COMMANDS[k].desc);
        });
        print("available commands:\n" + rows.join("\n") + "\n\n" + span("t-dim", "tip: tab completes, ↑/↓ walks history, esc closes"));
      }
    },
    whoami: { desc: "who is this", run: function () { print(jsonHtml(api.whoami())); } },
    about: { desc: "the short version", run: function () { print(P.summary.map(esc).join("\n\n")); } },
    ls: {
      desc: "list resources",
      run: function () {
        print(["experience/", "skills.json", "education.json", "contact.json"].map(function (x) {
          return x.slice(-1) === "/" ? span("t-key", x) : x;
        }).join("  "));
      }
    },
    experience: {
      args: "[id]", desc: "roles, or one role by id",
      run: function (args) {
        if (!args[0]) {
          print(P.experience.map(function (e) {
            return span("t-key", e.id.padEnd(12)) + " " + esc(e.role) + span("t-dim", " @ " + e.company);
          }).join("\n") + "\n" + span("t-dim", "try: experience " + P.experience[0].id));
          return;
        }
        var r = api.experience(args[0]);
        if (r) print(jsonHtml(r));
        else print(span("t-err", "404 Not Found: no experience with id '" + args[0] + "'"));
      }
    },
    skills: { desc: "dependencies and proficiency", run: function () { print(jsonHtml(api.skills())); } },
    education: { desc: "degrees", run: function () { print(jsonHtml(api.education())); } },
    contact: { desc: "how to reach her", run: function () { print(linkify(jsonHtml(api.contact()))); } },
    health: { desc: "GET /actuator/health", run: function () { print(jsonHtml(api.health())); } },
    curl: {
      args: "<path>", desc: "call the api, e.g. curl /api/v1/whoami",
      run: function (args) {
        var path = (args.filter(function (a) { return a[0] !== "-"; })[0] || "").replace(/^https?:\/\/[^/]+/, "");
        var m = path.match(/^\/api\/v1\/experience\/([\w-]+)$/);
        var routes = {
          "/api/v1/whoami": api.whoami, "/api/v1/experience": api.experienceIndex, "/api/v1/skills": api.skills,
          "/api/v1/education": api.education, "/api/v1/contact": api.contact, "/actuator/health": api.health
        };
        if (!path) return print(span("t-err", "curl: no URL specified") + "\n" + span("t-dim", "routes: " + Object.keys(routes).join(" ")));
        if (m) return COMMANDS.experience.run([m[1]]);
        if (routes[path]) return print(jsonHtml(routes[path]()));
        print(span("t-err", '{"status":404,"error":"Not Found","path":"' + esc(path) + '"}') + "\n" +
          span("t-dim", "routes: " + Object.keys(routes).join(" ")));
      }
    },
    open: {
      args: "<github|linkedin|email>", desc: "open a link",
      run: function (args) {
        var k = args[0];
        if (k === "email") { location.href = "mailto:" + P.links.email; return print(span("t-ok", "opening mail client…")); }
        if (P.links[k]) { window.open(P.links[k], "_blank", "noopener"); return print(span("t-ok", "opening " + P.links[k])); }
        print(span("t-err", "usage: open github | linkedin | email"));
      }
    },
    saga: {
      args: "[--fail]", desc: "run the saga demo",
      run: function (args) {
        closeConsole();
        document.getElementById("architecture").scrollIntoView();
        setTimeout(function () { runSaga(args.indexOf("--fail") !== -1); }, reduceMotion ? 0 : 600);
      }
    },
    theme: {
      args: "[dark|light]", desc: "switch color theme",
      run: function (args) {
        var t = args[0] === "dark" || args[0] === "light" ? args[0] : (isDark() ? "light" : "dark");
        setTheme(t);
        print(span("t-ok", "theme set to " + t));
      }
    },
    clear: { desc: "clear the screen", run: function () { outEl.innerHTML = ""; } },
    exit: { desc: "close the console", run: function () { closeConsole(); } },
    sudo: { hidden: true, run: function () { print(span("t-err", "nazanin is not in the sudoers file. This incident will be reported.")); } },
    "rm": { hidden: true, run: function () { print(span("t-err", "rm: permission denied (this is production, after all)")); } },
    java: { hidden: true, run: function () { print('openjdk version "21" 2023-09-19 LTS\n' + span("t-dim", "write once, run anywhere")); } },
    cat: {
      hidden: true,
      run: function (args) {
        var f = (args[0] || "").replace(/^\.\//, "");
        var map = { "skills.json": "skills", "education.json": "education", "contact.json": "contact" };
        var em = f.match(/^experience\/([\w-]+)/);
        if (em) return COMMANDS.experience.run([em[1]]);
        if (map[f]) return COMMANDS[map[f]].run([]);
        print(span("t-err", "cat: " + esc(f || "") + ": No such file or directory"));
      }
    }
  };

  function linkify(html) {
    return html.replace(/(https:\/\/[^"<\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function exec(line) {
    var cmd = line.trim();
    printCmd(cmd);
    if (!cmd) return;
    history.push(cmd); hIdx = history.length;
    var parts = cmd.split(/\s+/), name = parts[0].toLowerCase(), args = parts.slice(1);
    if (name === "ls" && args[0] && args[0].replace(/\/$/, "") === "experience") { name = "experience"; args = []; }
    var c = COMMANDS[name];
    if (c) c.run(args);
    else print(span("t-err", "command not found: " + name) + span("t-dim", "  (try 'help')"));
  }

  function openConsole() {
    if (!consoleEl.hidden) return;
    lastFocus = document.activeElement;
    consoleEl.hidden = false;
    if (!outEl.childNodes.length) {
      print(span("t-dim", "Connected to nazanin@prod. Type 'help' to see what you can do.\n"));
    }
    inputEl.focus();
  }
  function closeConsole() {
    if (consoleEl.hidden) return;
    consoleEl.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initConsole() {
    consoleEl = $("#console"); outEl = $("#console-out"); inputEl = $("#console-input");
    $("#console-open").addEventListener("click", openConsole);
    document.querySelectorAll("[data-open-console]").forEach(function (b) { b.addEventListener("click", openConsole); });
    $("#console-close").addEventListener("click", closeConsole);
    $("#console-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      exec(inputEl.value);
      inputEl.value = "";
    });
    inputEl.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowUp") { ev.preventDefault(); if (hIdx > 0) inputEl.value = history[--hIdx]; }
      else if (ev.key === "ArrowDown") {
        ev.preventDefault();
        if (hIdx < history.length - 1) inputEl.value = history[++hIdx];
        else { hIdx = history.length; inputEl.value = ""; }
      } else if (ev.key === "Tab") {
        ev.preventDefault();
        var v = inputEl.value;
        var pool = Object.keys(COMMANDS).filter(function (k) { return !COMMANDS[k].hidden; });
        if (/^experience\s+/.test(v)) {
          pool = P.experience.map(function (e) { return "experience " + e.id; });
        }
        var hits = pool.filter(function (k) { return k.indexOf(v) === 0; });
        if (hits.length === 1) inputEl.value = hits[0] + (/^experience /.test(hits[0]) ? "" : " ");
        else if (hits.length > 1) { printCmd(v); print(hits.join("  ")); }
      } else if (ev.key === "Escape") { closeConsole(); }
    });
    outEl.addEventListener("click", function (ev) { if (!ev.target.closest("a") && !window.getSelection().toString()) inputEl.focus(); });

    document.addEventListener("keydown", function (ev) {
      var tag = (ev.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || ev.target.isContentEditable;
      if (ev.key === "`" && !typing) { ev.preventDefault(); consoleEl.hidden ? openConsole() : closeConsole(); }
      else if (ev.key === "`" && ev.target === inputEl) { ev.preventDefault(); closeConsole(); }
      else if (ev.key === "Escape" && !consoleEl.hidden) closeConsole();
    });
  }

  // ---------- theme ----------
  function isDark() {
    var t = document.documentElement.dataset.theme;
    if (t) return t === "dark";
    return !window.matchMedia("(prefers-color-scheme: light)").matches;
  }
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
    document.querySelector('meta[name="theme-color"]').setAttribute("content", t === "dark" ? "#0d1117" : "#f7f8fa");
  }
  function initTheme() {
    $("#theme-toggle").addEventListener("click", function () { setTheme(isDark() ? "light" : "dark"); });
  }

  // ---------- nav + reveal ----------
  function initScroll() {
    var links = {};
    document.querySelectorAll(".nav a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    if (!("IntersectionObserver" in window)) return;

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle("is-active", k === e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { spy.observe(s); });

    if (reduceMotion) return;
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); reveal.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll(".section .container > *").forEach(function (el) {
      el.classList.add("reveal"); reveal.observe(el);
    });
  }

  // ---------- go ----------
  runBoot();
  renderHero();
  renderAbout();
  renderExperience();
  renderArch();
  initSaga();
  renderSkills();
  renderEducation();
  renderContact();
  renderFooter();
  initConsole();
  initTheme();
  initScroll();
})();
