(() => {
  const loginView = document.getElementById("loginView");
  const dashView = document.getElementById("dashView");
  const logout = document.getElementById("logout");
  const list = document.getElementById("list");
  const form = document.getElementById("form");
  const loginForm = document.getElementById("loginForm");
  const loginErr = document.getElementById("loginErr");
  const previewImg = document.getElementById("previewImg");

  const fields = {
    editId: document.getElementById("editId"),
    title: document.getElementById("title"),
    role: document.getElementById("role"),
    dates: document.getElementById("dates"),
    category: document.getElementById("category"),
    summary: document.getElementById("summary"),
    image: document.getElementById("image"),
    order: document.getElementById("order"),
    file: document.getElementById("file"),
  };

  const portraitFile = document.getElementById("portraitFile");
  const portraitPrev = document.getElementById("portraitPrev");
  const photoForm = document.getElementById("photoForm");
  let portraitUrl = "";

  function showDash(on) {
    loginView.classList.toggle("hidden", on);
    dashView.classList.toggle("hidden", !on);
    logout.classList.toggle("hidden", !on);
  }

  async function check() {
    const r = await fetch("/api/me");
    const j = await r.json();
    showDash(!!j.admin);
    if (j.admin) load();
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErr.textContent = "";
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: document.getElementById("password").value }),
    });
    if (!r.ok) { loginErr.textContent = "Wrong key."; return; }
    showDash(true);
    load();
  });

  logout.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    showDash(false);
  });

  fields.file.addEventListener("change", async () => {
    const f = fields.file.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("image", f);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    if (!r.ok) { alert("Upload failed"); return; }
    const j = await r.json();
    fields.image.value = j.url;
    previewImg.src = j.url;
    previewImg.style.display = "block";
  });

  function resetForm() {
    form.reset();
    fields.editId.value = "";
    fields.image.value = "";
    previewImg.style.display = "none";
    document.getElementById("saveBtn").textContent = "Save achievement";
  }
  document.getElementById("resetBtn").addEventListener("click", resetForm);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: fields.title.value,
      role: fields.role.value,
      dates: fields.dates.value,
      category: fields.category.value,
      summary: fields.summary.value,
      image: fields.image.value,
      order: Number(fields.order.value || 0),
    };
    const id = fields.editId.value;
    const r = await fetch(id ? `/api/achievements/${id}` : "/api/achievements", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { alert("Could not save"); return; }
    resetForm();
    load();
  });

  photoForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!portraitUrl) { alert("Choose a photo first"); return; }
    const r = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: portraitUrl }),
    });
    if (!r.ok) { alert("Could not save portrait"); return; }
    alert("Portrait saved");
  });

  portraitFile?.addEventListener("change", async () => {
    const f = portraitFile.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("image", f);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    if (!r.ok) { alert("Upload failed"); return; }
    const j = await r.json();
    portraitUrl = j.url;
    portraitPrev.src = j.url;
    portraitPrev.style.display = "block";
  });

  async function load() {
    const r = await fetch("/api/content");
    const data = await r.json();
    if (data.profile && data.profile.photo) {
      portraitUrl = data.profile.photo;
      portraitPrev.src = data.profile.photo;
      portraitPrev.style.display = "block";
    }
    const items = (data.achievements || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    list.innerHTML = items.map((a) => `
      <div class="ach-row">
        <img src="${a.image || "/images/court.jpg"}" alt="">
        <div>
          <strong>${esc(a.title)}</strong><br>
          <small style="color:var(--gold)">${esc(a.role)} · ${esc(a.dates)}</small>
        </div>
        <div>
          <button class="btn ghost" data-edit="${a.id}">Edit</button>
          <button class="btn ghost" data-del="${a.id}">Delete</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = items.find((x) => x.id === btn.dataset.edit);
        if (!a) return;
        fields.editId.value = a.id;
        fields.title.value = a.title || "";
        fields.role.value = a.role || "";
        fields.dates.value = a.dates || "";
        fields.category.value = a.category || "Practice";
        fields.summary.value = a.summary || "";
        fields.image.value = a.image || "";
        fields.order.value = a.order || 0;
        if (a.image) { previewImg.src = a.image; previewImg.style.display = "block"; }
        document.getElementById("saveBtn").textContent = "Update achievement";
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    list.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Remove this achievement?")) return;
        await fetch(`/api/achievements/${btn.dataset.del}`, { method: "DELETE" });
        load();
      });
    });
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  check();
})();
