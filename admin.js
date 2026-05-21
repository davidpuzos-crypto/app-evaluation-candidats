const ADMIN_PWD = "1234";

let allCandidats = [];
let deleteTargetId = null;

// ============================================================
// Login
// ============================================================
document.getElementById("btn-login").addEventListener("click", tryLogin);
document.getElementById("pwd-input").addEventListener("keydown", e => {
    if (e.key === "Enter") tryLogin();
});

function tryLogin() {
    const input = document.getElementById("pwd-input");
    const err = document.getElementById("pwd-error");
    if (input.value === ADMIN_PWD) {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("admin-panel").classList.remove("hidden");
        loadCandidats();
    } else {
        err.classList.remove("hidden");
        input.classList.add("border-red-400");
        input.focus();
    }
}

// ============================================================
// Load candidates
// ============================================================
async function loadCandidats() {
    document.getElementById("admin-loading").classList.remove("hidden");
    document.getElementById("admin-list").classList.add("hidden");
    document.getElementById("admin-empty").classList.add("hidden");

    try {
        const snap = await db.collection("candidats").orderBy("dateInscription", "desc").get();
        allCandidats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error("Erreur chargement :", err);
        allCandidats = [];
    }

    document.getElementById("admin-loading").classList.add("hidden");
    document.getElementById("admin-count").textContent = allCandidats.length + " candidat(s)";
    renderList(allCandidats);
}

// ============================================================
// Render list
// ============================================================
function renderList(candidats) {
    const container = document.getElementById("admin-list");
    const empty = document.getElementById("admin-empty");

    if (!candidats.length) {
        container.classList.add("hidden");
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");
    container.classList.remove("hidden");

    container.innerHTML = candidats.map(c => {
        const ini = ((c.prenom || "")[0] || "") + ((c.nom || "")[0] || "");
        let dateStr = "";
        const ts = c.dateInscription;
        if (ts) {
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
        }
        const hasScores = c.scores_candidat && Object.values(c.scores_candidat).some(v => v > 0);

        return `
        <div class="bg-white rounded-xl border border-gray-200 hover:border-brand-200 hover:shadow-md transition-all p-4 sm:p-5">
            <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">${ini.toUpperCase()}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-gray-800 text-sm truncate">${c.prenom || ""} ${c.nom || ""}</p>
                    <p class="text-xs text-gray-400 truncate">${c.email || "Pas d'email"}</p>
                    <div class="flex flex-wrap items-center gap-1.5 mt-1">
                        ${c.profil_psy ? `<span class="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">${c.profil_psy}</span>` : ""}
                        ${dateStr ? `<span class="text-[10px] text-gray-400">${dateStr}</span>` : ""}
                        ${hasScores ? '<span class="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Auto-eval</span>' : ""}
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button class="btn-edit w-9 h-9 flex items-center justify-center rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 transition-colors" data-id="${c.id}" title="Modifier">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button class="btn-delete w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors" data-id="${c.id}" title="Supprimer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </div>
        </div>`;
    }).join("");

    container.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });
    container.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", () => openDeleteModal(btn.dataset.id));
    });
}

// ============================================================
// Search
// ============================================================
document.getElementById("admin-search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { renderList(allCandidats); return; }
    const filtered = allCandidats.filter(c =>
        (c.prenom || "").toLowerCase().includes(q) ||
        (c.nom || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.profil_psy || "").toLowerCase().includes(q)
    );
    renderList(filtered);
});

document.getElementById("btn-refresh").addEventListener("click", loadCandidats);

// ============================================================
// Edit modal
// ============================================================
async function openEditModal(id) {
    const c = allCandidats.find(x => x.id === id);
    if (!c) return;

    document.getElementById("edit-id").value = id;
    document.getElementById("edit-prenom").value = c.prenom || "";
    document.getElementById("edit-nom").value = c.nom || "";
    document.getElementById("edit-email").value = c.email || "";
    document.getElementById("edit-mbti").value = c.profil_psy || "";
    document.getElementById("edit-linkedin").value = c.linkedin || "";
    document.getElementById("edit-cv").value = c.cvURL || "";

    const obsList = document.getElementById("edit-obs-list");
    obsList.innerHTML = '<span class="text-gray-400">Chargement...</span>';

    document.getElementById("edit-modal").classList.remove("hidden");

    try {
        const snap = await db.collection("candidats").doc(id).collection("observations").get();
        if (snap.empty) {
            obsList.innerHTML = '<span class="text-gray-400">Aucune observation</span>';
        } else {
            obsList.innerHTML = snap.docs.map(doc => {
                const data = doc.data();
                const scores = data.scores_animateur || data.scores || {};
                const count = Object.values(scores).filter(v => v > 0).length;
                return `<div class="flex items-center justify-between py-1">
                    <span class="font-medium">${doc.id}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400">${count} savoir-être notés</span>
                        <button class="btn-del-obs text-red-400 hover:text-red-600 transition-colors" data-candidat-id="${id}" data-obs-id="${doc.id}" title="Supprimer cette observation">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>`;
            }).join("");

            obsList.querySelectorAll(".btn-del-obs").forEach(btn => {
                btn.addEventListener("click", async () => {
                    if (!confirm("Supprimer l'observation " + btn.dataset.obsId + " ?")) return;
                    try {
                        await db.collection("candidats").doc(btn.dataset.candidatId)
                            .collection("observations").doc(btn.dataset.obsId).delete();
                        btn.closest("div").remove();
                    } catch (err) {
                        alert("Erreur : " + err.message);
                    }
                });
            });
        }
    } catch (err) {
        obsList.innerHTML = '<span class="text-red-400">Erreur de chargement</span>';
    }
}

document.getElementById("btn-close-modal").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.add("hidden");
});

document.getElementById("edit-modal").addEventListener("click", e => {
    if (e.target === e.currentTarget) {
        document.getElementById("edit-modal").classList.add("hidden");
    }
});

document.getElementById("btn-save-edit").addEventListener("click", async () => {
    const id = document.getElementById("edit-id").value;
    const btn = document.getElementById("btn-save-edit");
    const orig = btn.textContent;
    btn.textContent = "Enregistrement...";
    btn.disabled = true;

    try {
        await db.collection("candidats").doc(id).update({
            prenom: document.getElementById("edit-prenom").value.trim(),
            nom: document.getElementById("edit-nom").value.trim(),
            email: document.getElementById("edit-email").value.trim(),
            profil_psy: document.getElementById("edit-mbti").value.trim().toUpperCase(),
            linkedin: document.getElementById("edit-linkedin").value.trim(),
            cvURL: document.getElementById("edit-cv").value.trim()
        });
        document.getElementById("edit-modal").classList.add("hidden");
        await loadCandidats();
    } catch (err) {
        alert("Erreur : " + err.message);
    }

    btn.textContent = orig;
    btn.disabled = false;
});

document.getElementById("btn-reset-scores").addEventListener("click", async () => {
    if (!confirm("Remettre à zéro l'auto-évaluation de ce candidat ?\nIl pourra ainsi re-remplir sa fiche.")) return;

    const id = document.getElementById("edit-id").value;
    try {
        await db.collection("candidats").doc(id).update({
            scores_candidat: firebase.firestore.FieldValue.delete(),
            dateAutoEvaluation: firebase.firestore.FieldValue.delete()
        });
        document.getElementById("edit-modal").classList.add("hidden");
        await loadCandidats();
    } catch (err) {
        alert("Erreur : " + err.message);
    }
});

// ============================================================
// Delete modal
// ============================================================
function openDeleteModal(id) {
    const c = allCandidats.find(x => x.id === id);
    if (!c) return;
    deleteTargetId = id;
    document.getElementById("delete-name").textContent = (c.prenom || "") + " " + (c.nom || "") + " (" + (c.email || "pas d'email") + ")";
    document.getElementById("delete-modal").classList.remove("hidden");
}

document.getElementById("btn-cancel-delete").addEventListener("click", () => {
    document.getElementById("delete-modal").classList.add("hidden");
    deleteTargetId = null;
});

document.getElementById("delete-modal").addEventListener("click", e => {
    if (e.target === e.currentTarget) {
        document.getElementById("delete-modal").classList.add("hidden");
        deleteTargetId = null;
    }
});

document.getElementById("btn-confirm-delete").addEventListener("click", async () => {
    if (!deleteTargetId) return;
    const btn = document.getElementById("btn-confirm-delete");
    btn.textContent = "Suppression...";
    btn.disabled = true;

    try {
        const obsSnap = await db.collection("candidats").doc(deleteTargetId)
            .collection("observations").get();
        const batch = db.batch();
        obsSnap.forEach(doc => batch.delete(doc.ref));
        batch.delete(db.collection("candidats").doc(deleteTargetId));
        await batch.commit();

        document.getElementById("delete-modal").classList.add("hidden");
        deleteTargetId = null;
        await loadCandidats();
    } catch (err) {
        alert("Erreur : " + err.message);
    }

    btn.textContent = "Supprimer";
    btn.disabled = false;
});
