(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const hasGsap = typeof window.gsap !== "undefined";

  const cur = $("#cursor");
  const dot = $("#cursorDot");
  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    if (dot) { dot.style.left = mx + "px"; dot.style.top = my + "px"; }
  });
  (function loop() {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    if (cur) { cur.style.left = cx + "px"; cur.style.top = cy + "px"; }
    requestAnimationFrame(loop);
  })();
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a, button, .filter, .path-item, .work-card")) cur?.classList.add("is-hover");
    else cur?.classList.remove("is-hover");
  });

  function hideLoader() {
    const el = $("#loader");
    if (!el) return;
    if (hasGsap) {
      gsap.to(el, { opacity: 0, duration: 0.7, delay: 0.2, ease: "power2.out", onComplete: () => el.remove() });
    } else {
      el.remove();
    }
  }
  window.addEventListener("load", () => {
    hideLoader();
    if (hasGsap) {
      gsap.from("[data-fade]", { opacity: 0, y: 36, duration: 1.15, stagger: 0.12, delay: 0.2, ease: "power3.out" });
    }
  });
  setTimeout(hideLoader, 2200);

  let lenis = null;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", () => ScrollTrigger && ScrollTrigger.update());
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const header = $("#header");
  let last = 0;
  function onScrollY(scroll) {
    if (!header) return;
    if (scroll > last && scroll > 80) header.classList.add("is-hidden");
    else header.classList.remove("is-hidden");
    last = scroll;
  }
  if (lenis) lenis.on("scroll", ({ scroll }) => onScrollY(scroll));
  else window.addEventListener("scroll", () => onScrollY(window.scrollY), { passive: true });

  const burger = $("#burger");
  const sheet = $("#sheet");
  burger?.addEventListener("click", () => sheet?.classList.toggle("is-open"));
  sheet?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => sheet.classList.remove("is-open")));

  if (hasGsap) {
    gsap.to("#heroBg", {
      yPercent: 18, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  function bindReveals() {
    if (!hasGsap) return;
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.95, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" }
      });
    });
  }
  function fadeList(selector) {
    if (!hasGsap) return;
    gsap.utils.toArray(selector).forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, y: 48 }, {
        opacity: 1, y: 0, duration: 0.9, delay: (i % 4) * 0.05, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%" }
      });
    });
  }

  let DATA = null;
  let activeFilter = "All";

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function renderPortrait() {
    const box = $("#portrait");
    if (!box || !DATA) return;
    const photo = DATA.profile && DATA.profile.photo;
    if (photo) {
      box.innerHTML = `<img src="${escapeHtml(photo)}" alt="Amr Abd El-Hay">`;
    }
  }

  function renderPath() {
    const list = $("#pathList");
    const filters = $("#filters");
    if (!list || !DATA) return;
    const cats = ["All", ...Array.from(new Set(DATA.achievements.map((a) => a.category)))];
    filters.innerHTML = cats.map((c) => `<button class="filter ${c === activeFilter ? "is-on" : ""}" data-cat="${c}">${c}</button>`).join("");
    filters.querySelectorAll(".filter").forEach((btn) => {
      btn.addEventListener("click", () => { activeFilter = btn.dataset.cat; renderPath(); fadeList(".path-item"); });
    });
    const items = DATA.achievements
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .filter((a) => activeFilter === "All" || a.category === activeFilter);
    list.innerHTML = items.map((a) => `
      <article class="path-item">
        <div class="media">
          <img src="${a.image || "/images/court.jpg"}" alt="">
        </div>
        <div class="body">
          <div class="kicker">${escapeHtml(a.category || "")} · ${escapeHtml(a.dates || "")}</div>
          <h3>${escapeHtml(a.title)}</h3>
          <div class="role">${escapeHtml(a.role || "")}</div>
          <p>${escapeHtml(a.summary || "")}</p>
        </div>
      </article>
    `).join("");
  }

  function renderCourses() {
    const el = $("#courses");
    if (!el || !DATA) return;
    el.innerHTML = (DATA.courses || []).map((c) => `
      <article class="course" data-reveal>
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.meta)}</p>
      </article>
    `).join("");
  }

  function renderSkills() {
    const el = $("#skills");
    if (!el || !DATA) return;
    const s = DATA.skills || {};
    const blocks = [
      ["Legal", s.legal],
      ["Technical", s.technical],
      ["Soft skills", s.soft],
    ];
    el.innerHTML = blocks.map(([title, arr]) => `
      <div class="skill-col" data-reveal>
        <h3>${title}</h3>
        <div class="pills">${(arr || []).map((x) => `<span class="pill">${escapeHtml(x)}</span>`).join("")}</div>
      </div>
    `).join("");
  }

  function renderWork() {
    const el = $("#workList");
    if (!el || !DATA) return;
    const projects = DATA.projects || [];
    el.innerHTML = projects.map((p) => {
      const href = p.embed || p.preview || "#";
      return `
      <article class="work-card">
        <div class="screen">
          <div class="screen-bar">
            <i></i><i></i><i></i>
            <span>${escapeHtml(p.name)}</span>
          </div>
          <iframe src="${escapeHtml(href)}" title="${escapeHtml(p.name)}" loading="lazy"></iframe>
        </div>
        <div class="work-copy">
          <div class="kind">${escapeHtml(p.kind)} · ${escapeHtml(p.year)}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <div class="ar">${escapeHtml(p.nameAr || "")}</div>
          <p>${escapeHtml(p.summary)}</p>
          <div class="tags">${(p.stack || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
          <a class="btn" href="${escapeHtml(href)}" target="_blank" rel="noopener">Open full site</a>
        </div>
      </article>`;
    }).join("");
  }

  function formatPhone(p) {
    const d = String(p || "").replace(/\D/g, "");
    if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3");
    return p;
  }

  function renderContact() {
    const p = (DATA && DATA.profile) || {};
    const phone = p.phone || "01153909979";
    const email = p.email || "aamrabdelhay@gmail.com";
    const linkedin = p.linkedin || "https://www.linkedin.com/in/amrabdelhay";
    const wa = p.whatsappNumber || p.whatsapp || "https://wa.me/201153909979";
    const items = [
      { label: "Phone", href: `tel:${phone}`, text: formatPhone(phone) },
      { label: "Email", href: `mailto:${email}`, text: email },
      { label: "LinkedIn", href: linkedin, text: p.linkedinLabel || "Amr Abd El-Hay", ext: true },
      { label: "WhatsApp", href: wa, text: "Message on WhatsApp", ext: true },
    ];
    const box = $("#contactList");
    if (box) {
      box.innerHTML = items.map((it) => `
        <a class="contact-card" href="${escapeHtml(it.href)}" ${it.ext ? 'target="_blank" rel="noopener"' : ""}>
          <small>${it.label}</small>
          <strong>${escapeHtml(it.text)}</strong>
        </a>
      `).join("");
    }
    const foot = $("#footLinks");
    if (foot) {
      foot.innerHTML = `
        <a href="tel:${escapeHtml(phone)}">${escapeHtml(formatPhone(phone))}</a>
        <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
        <a href="${escapeHtml(linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
        <a href="${escapeHtml(wa)}" target="_blank" rel="noopener">WhatsApp</a>
      `;
    }
    const waBtn = $("#waFloat");
    if (waBtn) waBtn.href = wa;
  }

  fetch("/api/content")
    .then((r) => { if (!r.ok) throw new Error("API unavailable"); return r.json(); })
    .catch(() => fetch("/data/content.json").then((r) => r.json()))
    .then((data) => {
      DATA = data;
      renderPortrait();
      renderPath();
      renderCourses();
      renderSkills();
      renderWork();
      renderContact();
      bindReveals();
      fadeList(".path-item");
      if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
    })
    .catch(() => {
      bindReveals();
      hideLoader();
    });
})();
