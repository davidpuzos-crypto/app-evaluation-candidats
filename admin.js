const ADMIN_PWD = "1234";

const STANDS = [
    { id: "aeronautique-defense", short: "Aéro", emoji: "✈️" },
    { id: "batiment",             short: "Bât",  emoji: "🏗️" },
    { id: "audio-visuel",        short: "AV",   emoji: "🎬" },
    { id: "restauration",        short: "Resto", emoji: "🍽️" }
];

let allCandidats = [];
let observationsCache = {};
let deleteTargetId = null;
let currentFilter = "all";
let currentSort = "date-desc";

// ============================================================
// Toast
// ============================================================
function showToast(msg, type = "success") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = `toast toast-${type} show`;
    setTimeout(() => t.classList.remove("show"), 2500);
}

// ============================================================
// Session persistence
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("admin_auth") === "1") {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("admin-panel").classList.remove("hidden");
        loadCandidats();
    }
});

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
        sessionStorage.setItem("admin_auth", "1");
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
// Load candidates + observations
// ============================================================
async function loadCandidats() {
    document.getElementById("admin-loading").classList.remove("hidden");
    document.getElementById("admin-list").classList.add("hidden");
    document.getElementById("admin-empty").classList.add("hidden");

    try {
        const snap = await db.collection("candidats").orderBy("dateInscription", "desc").get();
        allCandidats = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        observationsCache = {};
        const obsPromises = allCandidats.map(async c => {
            const obsSnap = await db.collection("candidats").doc(c.id).collection("observations").get();
            observationsCache[c.id] = obsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        });
        await Promise.all(obsPromises);
    } catch (err) {
        console.error("Erreur chargement :", err);
        allCandidats = [];
    }

    document.getElementById("admin-loading").classList.add("hidden");
    updateStats();
    applyFiltersAndRender();
}

// ============================================================
// Stats
// ============================================================
function getDuplicateEmails() {
    const emailCount = {};
    allCandidats.forEach(c => {
        const e = (c.email || "").toLowerCase().trim();
        if (e) emailCount[e] = (emailCount[e] || 0) + 1;
    });
    return Object.entries(emailCount).filter(([_, cnt]) => cnt > 1).map(([email]) => email);
}

function updateStats() {
    const total = allCandidats.length;
    const autoEval = allCandidats.filter(c => c.scores_candidat && Object.values(c.scores_candidat).some(v => v > 0)).length;
    const observed = allCandidats.filter(c => (observationsCache[c.id] || []).length > 0).length;
    const dupes = getDuplicateEmails();
    const dupCount = allCandidats.filter(c => dupes.includes((c.email || "").toLowerCase().trim())).length;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-autoeval").textContent = autoEval;
    document.getElementById("stat-observed").textContent = observed;
    document.getElementById("stat-duplicates").textContent = dupCount;
}

// ============================================================
// Filters + Sort
// ============================================================
function getFilteredCandidats() {
    const q = document.getElementById("admin-search").value.toLowerCase().trim();
    const dupes = getDuplicateEmails();

    let list = allCandidats;

    if (currentFilter === "autoeval") {
        list = list.filter(c => c.scores_candidat && Object.values(c.scores_candidat).some(v => v > 0));
    } else if (currentFilter === "no-autoeval") {
        list = list.filter(c => !c.scores_candidat || !Object.values(c.scores_candidat).some(v => v > 0));
    } else if (currentFilter === "observed") {
        list = list.filter(c => (observationsCache[c.id] || []).length > 0);
    } else if (currentFilter === "duplicates") {
        list = list.filter(c => dupes.includes((c.email || "").toLowerCase().trim()));
    }

    if (q) {
        list = list.filter(c =>
            (c.prenom || "").toLowerCase().includes(q) ||
            (c.nom || "").toLowerCase().includes(q) ||
            (c.email || "").toLowerCase().includes(q) ||
            (c.profil_psy || "").toLowerCase().includes(q)
        );
    }

    list = [...list];
    if (currentSort === "date-desc") {
        // already ordered from Firestore
    } else if (currentSort === "date-asc") {
        list.reverse();
    } else if (currentSort === "alpha-asc") {
        list.sort((a, b) => ((a.prenom || "") + " " + (a.nom || "")).localeCompare((b.prenom || "") + " " + (b.nom || "")));
    } else if (currentSort === "alpha-desc") {
        list.sort((a, b) => ((b.prenom || "") + " " + (b.nom || "")).localeCompare((a.prenom || "") + " " + (a.nom || "")));
    }

    return list;
}

function applyFiltersAndRender() {
    const list = getFilteredCandidats();
    document.getElementById("result-count").textContent = list.length + " / " + allCandidats.length;
    renderList(list);
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        applyFiltersAndRender();
    });
});

// Stat cards as filter shortcuts
document.querySelectorAll(".stat-card[data-filter]").forEach(card => {
    card.addEventListener("click", () => {
        const f = card.dataset.filter;
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        const target = document.querySelector(`.filter-btn[data-filter="${f}"]`);
        if (target) target.classList.add("active");
        currentFilter = f;
        applyFiltersAndRender();
    });
});

// Sort
document.getElementById("sort-select").addEventListener("change", e => {
    currentSort = e.target.value;
    applyFiltersAndRender();
});

// Search
document.getElementById("admin-search").addEventListener("input", () => applyFiltersAndRender());
document.getElementById("btn-refresh").addEventListener("click", loadCandidats);

// ============================================================
// Render list
// ============================================================
function renderList(candidats) {
    const container = document.getElementById("admin-list");
    const empty = document.getElementById("admin-empty");
    const dupes = getDuplicateEmails();

    if (!candidats.length) {
        container.classList.add("hidden");
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");
    container.classList.remove("hidden");

    container.innerHTML = candidats.map(c => {
        const ini = ((c.prenom || "")[0] || "") + ((c.nom || "")[0] || "");
        const isDupe = dupes.includes((c.email || "").toLowerCase().trim());
        let dateStr = "";
        const ts = c.dateInscription;
        if (ts) {
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
        }
        const hasScores = c.scores_candidat && Object.values(c.scores_candidat).some(v => v > 0);
        const obs = observationsCache[c.id] || [];
        const standBadges = obs.map(o => {
            const stand = STANDS.find(s => s.id === o.id);
            return stand ? `<span class="text-[10px]" title="${stand.short}">${stand.emoji}</span>` : "";
        }).filter(Boolean).join("");

        return `
        <div class="bg-white rounded-xl border border-gray-200 hover:border-brand-200 hover:shadow-md transition-all p-4 sm:p-5 ${isDupe ? 'card-duplicate' : ''}">
            <div class="flex items-start gap-3 sm:gap-4">
                <div class="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">${ini.toUpperCase()}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-bold text-gray-800 text-sm">${c.prenom || ""} ${c.nom || ""}</p>
                        ${isDupe ? '<span class="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">DOUBLON</span>' : ""}
                    </div>
                    <p class="text-xs text-gray-400 truncate">${c.email || "Pas d'email"}</p>
                    <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                        ${c.profil_psy ? `<span class="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">${c.profil_psy}</span>` : ""}
                        ${dateStr ? `<span class="text-[10px] text-gray-400">${dateStr}</span>` : ""}
                        ${hasScores ? '<span class="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Auto-éval ✓</span>' : '<span class="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Pas d\'auto-éval</span>'}
                        ${obs.length ? `<span class="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">${obs.length} stand${obs.length > 1 ? 's' : ''} ${standBadges}</span>` : '<span class="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Pas observé</span>'}
                    </div>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
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
// Edit modal
// ============================================================
function openEditModal(id) {
    const c = allCandidats.find(x => x.id === id);
    if (!c) return;

    document.getElementById("edit-id").value = id;
    document.getElementById("edit-prenom").value = c.prenom || "";
    document.getElementById("edit-nom").value = c.nom || "";
    document.getElementById("edit-email").value = c.email || "";
    document.getElementById("edit-mbti").value = c.profil_psy || "";
    document.getElementById("edit-personality-link").value = c.personalityLink || "";
    document.getElementById("edit-linkedin").value = c.linkedin || "";
    document.getElementById("edit-cv").value = c.cvURL || "";

    // Auto-eval section
    const autoSection = document.getElementById("edit-autoeval-section");
    const autoCount = document.getElementById("edit-autoeval-count");
    const autoPreview = document.getElementById("edit-autoeval-preview");
    if (c.scores_candidat && Object.values(c.scores_candidat).some(v => v > 0)) {
        autoSection.classList.remove("hidden");
        const entries = Object.entries(c.scores_candidat).filter(([_, v]) => v > 0);
        autoCount.textContent = entries.length + " / 14 renseignés";
        const top3 = entries.sort((a, b) => b[1] - a[1]).slice(0, 3);
        autoPreview.innerHTML = "Top : " + top3.map(([k, v]) => `<strong>${k}</strong> (${v}/5)`).join(", ");
    } else {
        autoSection.classList.add("hidden");
    }

    // Observations
    const obs = observationsCache[id] || [];
    const obsList = document.getElementById("edit-obs-list");
    if (!obs.length) {
        obsList.innerHTML = '<span class="text-gray-400 italic">Aucune observation terrain</span>';
    } else {
        obsList.innerHTML = obs.map(o => {
            const stand = STANDS.find(s => s.id === o.id);
            const scores = o.scores_animateur || o.scores || {};
            const count = Object.values(scores).filter(v => v > 0).length;
            const emoji = stand ? stand.emoji : "📋";
            const name = stand ? stand.short : o.id;
            return `<div class="flex items-center justify-between py-1.5 px-2 bg-white rounded-lg">
                <span class="font-medium">${emoji} ${name}</span>
                <div class="flex items-center gap-3">
                    <span class="text-gray-400">${count} savoir-être notés</span>
                    <button class="btn-del-obs text-red-400 hover:text-red-600 transition-colors" data-candidat-id="${id}" data-obs-id="${o.id}" title="Supprimer cette observation">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>`;
        }).join("");

        obsList.querySelectorAll(".btn-del-obs").forEach(btn => {
            btn.addEventListener("click", async () => {
                const standName = STANDS.find(s => s.id === btn.dataset.obsId)?.short || btn.dataset.obsId;
                if (!confirm("Supprimer l'observation « " + standName + " » ?")) return;
                try {
                    await db.collection("candidats").doc(btn.dataset.candidatId)
                        .collection("observations").doc(btn.dataset.obsId).delete();
                    btn.closest("div").remove();
                    observationsCache[btn.dataset.candidatId] = observationsCache[btn.dataset.candidatId].filter(o => o.id !== btn.dataset.obsId);
                    updateStats();
                    showToast("Observation supprimée");
                } catch (err) {
                    showToast("Erreur : " + err.message, "error");
                }
            });
        });
    }

    // Dates
    const datesEl = document.getElementById("edit-dates");
    const lines = [];
    if (c.dateInscription) {
        const d = c.dateInscription.toDate ? c.dateInscription.toDate() : new Date(c.dateInscription);
        lines.push("Inscription : " + d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    }
    if (c.dateAutoEvaluation) {
        const d = c.dateAutoEvaluation.toDate ? c.dateAutoEvaluation.toDate() : new Date(c.dateAutoEvaluation);
        lines.push("Auto-éval : " + d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    }
    datesEl.innerHTML = lines.map(l => `<p>${l}</p>`).join("");

    document.getElementById("edit-modal").classList.remove("hidden");
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
            personalityLink: document.getElementById("edit-personality-link").value.trim(),
            linkedin: document.getElementById("edit-linkedin").value.trim(),
            cvURL: document.getElementById("edit-cv").value.trim()
        });
        document.getElementById("edit-modal").classList.add("hidden");
        showToast("Candidat mis à jour");
        await loadCandidats();
    } catch (err) {
        showToast("Erreur : " + err.message, "error");
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
        showToast("Auto-évaluation réinitialisée", "info");
        await loadCandidats();
    } catch (err) {
        showToast("Erreur : " + err.message, "error");
    }
});

document.getElementById("btn-delete-from-edit").addEventListener("click", () => {
    const id = document.getElementById("edit-id").value;
    document.getElementById("edit-modal").classList.add("hidden");
    openDeleteModal(id);
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
    const name = document.getElementById("delete-name").textContent;
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
        showToast("Candidat supprimé");
        await loadCandidats();
    } catch (err) {
        showToast("Erreur : " + err.message, "error");
    }

    btn.textContent = "Supprimer";
    btn.disabled = false;
});

// ============================================================
// CSV Export
// ============================================================
document.getElementById("btn-export-csv").addEventListener("click", () => {
    if (!allCandidats.length) { showToast("Aucun candidat à exporter", "info"); return; }

    const headers = ["Prénom", "Nom", "Email", "MBTI", "Date inscription", "Auto-éval", "Nb stands observés", "Stands"];
    const rows = allCandidats.map(c => {
        let dateStr = "";
        if (c.dateInscription) {
            const d = c.dateInscription.toDate ? c.dateInscription.toDate() : new Date(c.dateInscription);
            dateStr = d.toLocaleDateString("fr-FR");
        }
        const hasScores = c.scores_candidat && Object.values(c.scores_candidat).some(v => v > 0);
        const obs = observationsCache[c.id] || [];
        const standNames = obs.map(o => {
            const s = STANDS.find(st => st.id === o.id);
            return s ? s.short : o.id;
        }).join(" | ");

        return [
            c.prenom || "", c.nom || "", c.email || "", c.profil_psy || "",
            dateStr, hasScores ? "Oui" : "Non", obs.length, standNames
        ];
    });

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(";"))
        .join("\n");

    const bom = "﻿";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidats_softskill_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast(allCandidats.length + " candidats exportés", "info");
});
