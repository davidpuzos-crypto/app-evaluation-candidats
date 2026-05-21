// ============================================================
// Recruteur — CV soft-skills
// ============================================================

const SAVOIR_ETRE = [
    "Capacité d'adaptation", "Gestion du stress", "Travail en équipe",
    "Communication", "Écoute active", "Leadership", "Créativité",
    "Esprit critique", "Prise de décision", "Gestion des conflits",
    "Autonomie", "Rigueur", "Empathie", "Persévérance"
];

const LABELS_QUALITATIFS = ["", "En émergence", "En développement", "Observé", "Bien observé", "Point fort"];

const SCORE_COLORS = {
    0: { bg: "#f3f4f6", text: "#9ca3af", border: "#e5e7eb" },
    1: { bg: "#fef2f2", text: "#ef4444", border: "#fecaca" },
    2: { bg: "#fff7ed", text: "#f97316", border: "#fed7aa" },
    3: { bg: "#fefce8", text: "#eab308", border: "#fef08a" },
    4: { bg: "#ecfdf5", text: "#10b981", border: "#a7f3d0" },
    5: { bg: "#f5f3ff", text: "#8b5cf6", border: "#ddd6fe" }
};

const STANDS = [
    { id: "aeronautique-defense", nom: "Aéronautique & Défense", short: "Aéro", emoji: "✈️" },
    { id: "batiment",             nom: "Bâtiment",               short: "Bât",  emoji: "🏗️" },
    { id: "audio-visuel",        nom: "Audio-visuel",           short: "AV",   emoji: "🎬" },
    { id: "restauration",        nom: "Restauration",           short: "Resto", emoji: "🍽️" }
];

// ============================================================
// 16 Personalities decoder
// ============================================================
const PERSONALITY_PROFILES = {
    INTJ: { titre: "L'Architecte",    desc: "Analytique, structuré et orienté solutions. Excelle dans la planification stratégique et la résolution de problèmes complexes." },
    INTP: { titre: "Le Logicien",     desc: "Curieux, inventif et avide de comprendre. Capacité naturelle à analyser les systèmes et proposer des approches innovantes." },
    ENTJ: { titre: "Le Commandant",   desc: "Déterminé, stratégique et leader naturel. Sait mobiliser une équipe autour d'un objectif ambitieux." },
    ENTP: { titre: "L'Innovateur",    desc: "Vif d'esprit, créatif et stimulé par les défis intellectuels. Excellent en brainstorming et résolution créative." },
    INFJ: { titre: "L'Avocat",        desc: "Idéaliste, organisé et porté par ses convictions. Force tranquille capable d'inspirer et guider les autres." },
    INFP: { titre: "Le Médiateur",    desc: "Créatif, empathique et axé sur l'harmonie en équipe. Sensible aux besoins des autres, excellent médiateur naturel." },
    ENFJ: { titre: "Le Protagoniste", desc: "Charismatique, altruiste et inspirant. Fédère naturellement les équipes et crée un environnement positif." },
    ENFP: { titre: "L'Inspirateur",   desc: "Enthousiaste, créatif et communicatif. Apporte de l'énergie et des idées nouvelles dans chaque projet." },
    ISTJ: { titre: "Le Logisticien",  desc: "Fiable, méthodique et soucieux du détail. Pilier de confiance sur lequel toute équipe peut s'appuyer." },
    ISFJ: { titre: "Le Défenseur",    desc: "Dévoué, attentionné et protecteur. Crée un cadre sécurisant et veille au bien-être de l'équipe." },
    ESTJ: { titre: "Le Directeur",    desc: "Organisé, pragmatique et décisif. Sait structurer le travail et mener un projet à son terme." },
    ESFJ: { titre: "Le Consul",       desc: "Sociable, attentionné et fédérateur. Excelle dans la cohésion d'équipe et la relation client." },
    ISTP: { titre: "Le Virtuose",     desc: "Pratique, observateur et performant sous pression. S'adapte vite et trouve des solutions concrètes." },
    ISFP: { titre: "L'Aventurier",    desc: "Sensible, créatif et ouvert aux nouvelles expériences. Apporte une touche d'originalité et de flexibilité." },
    ESTP: { titre: "L'Entrepreneur",  desc: "Énergique, pragmatique et orienté action. Excelle dans l'exécution rapide et la prise de décision terrain." },
    ESFP: { titre: "L'Animateur",     desc: "Spontané, enthousiaste et connecté aux autres. Crée une dynamique positive et sait embarquer son entourage." }
};

// ============================================================
// State
// ============================================================
let allCandidats = [];
let radarChart = null;
let selectedCandidat = null;
let currentStandObservations = {};
let currentAverageScores = null;
let currentScoresCandidat = null;

// ============================================================
// Init
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    loadCandidats();
    setupSearch();
    setupExportPDF();
    setupMobileSidebar();
});

// ============================================================
// Mobile sidebar
// ============================================================
function setupMobileSidebar() {
    const overlay = document.getElementById("sidebar-overlay");
    const backdrop = document.getElementById("sidebar-backdrop");
    const btnToggle = document.getElementById("btn-sidebar-toggle");
    const btnClose = document.getElementById("btn-sidebar-close");
    const btnSelectMobile = document.getElementById("btn-select-mobile");
    const fab = document.getElementById("fab-candidats");

    function openSidebar() { overlay.classList.remove("sidebar-closed"); document.body.style.overflow = "hidden"; }
    function closeSidebar() { overlay.classList.add("sidebar-closed"); document.body.style.overflow = ""; }

    btnToggle.addEventListener("click", openSidebar);
    btnClose.addEventListener("click", closeSidebar);
    backdrop.addEventListener("click", closeSidebar);
    if (btnSelectMobile) btnSelectMobile.addEventListener("click", openSidebar);
    if (fab) fab.addEventListener("click", openSidebar);

    window._closeMobileSidebar = closeSidebar;
}

function updateHeaderName(candidat) {
    let el = document.getElementById("header-candidat-name");
    if (!el) {
        const headerDiv = document.querySelector("header .px-4");
        if (!headerDiv) return;
        el = document.createElement("span");
        el.id = "header-candidat-name";
        el.className = "hidden sm:inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg text-xs font-semibold ml-3";
        headerDiv.querySelector("div").appendChild(el);
    }
    el.textContent = `${candidat.prenom || ""} ${candidat.nom || ""}`.trim();
}

function showFab(show) {
    const fab = document.getElementById("fab-candidats");
    if (fab) fab.classList.toggle("hidden", !show);
}

// ============================================================
// Load candidates
// ============================================================
async function loadCandidats() {
    try {
        const snap = await db.collection("candidats").orderBy("dateInscription", "desc").get();
        allCandidats = [];
        snap.forEach(doc => allCandidats.push({ id: doc.id, ...doc.data() }));
        renderCandidatList(allCandidats);
        updateCounts(allCandidats.length);
    } catch (err) {
        console.error("Erreur chargement candidats :", err);
        getListEls().forEach(el => {
            el.innerHTML = '<li class="px-4 py-6 text-center text-red-400/60 text-sm">Erreur de chargement</li>';
        });
    }
}

function getListEls() {
    return [document.getElementById("candidat-list"), document.getElementById("candidat-list-mobile")].filter(Boolean);
}

function updateCounts(count) {
    const txt = `${count} candidat(s)`;
    ["candidat-count", "candidat-count-mobile"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
    });
}

function renderCandidatList(candidats) {
    getListEls().forEach(list => {
        if (!candidats.length) {
            list.innerHTML = '<li class="px-4 py-8 text-center text-gray-300 text-sm">Aucun candidat trouvé</li>';
            return;
        }
        list.innerHTML = "";
        candidats.forEach(c => {
            const li = document.createElement("li");
            li.className = "sidebar-item px-4 py-3";
            li.setAttribute("data-id", c.id);

            let dateStr = "";
            const ts = c.dateDerniereObservation || c.dateInscription;
            if (ts) {
                const d = ts.toDate ? ts.toDate() : new Date(ts);
                dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
            }

            const ini = ((c.prenom || "")[0] || "") + ((c.nom || "")[0] || "");
            li.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="avatar w-9 h-9">${ini.toUpperCase()}</div>
                    <div class="min-w-0 flex-1">
                        <p class="font-semibold text-gray-700 text-[13px] truncate">${c.prenom || ""} ${c.nom || ""}</p>
                        <div class="flex items-center gap-1.5 mt-0.5">
                            ${dateStr ? `<span class="text-[10px] text-gray-400">${dateStr}</span>` : ""}
                            ${c.profil_psy ? `<span class="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">${c.profil_psy}</span>` : ""}
                        </div>
                    </div>
                    <svg class="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
            `;
            li.addEventListener("click", () => selectCandidat(c.id, li));
            list.appendChild(li);
        });
    });
}

// ============================================================
// Search
// ============================================================
function setupSearch() {
    ["search-input", "search-input-mobile"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = q
                ? allCandidats.filter(c => `${c.prenom} ${c.nom} ${c.email} ${c.profil_psy || ""}`.toLowerCase().includes(q))
                : allCandidats;
            renderCandidatList(filtered);
            updateCounts(filtered.length);
        });
    });
}

// ============================================================
// Select candidate — fetch ALL stand observations
// ============================================================
async function selectCandidat(id, liEl) {
    document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("active"));
    liEl.classList.add("active");

    // Highlight same candidate in the other list
    document.querySelectorAll(`.sidebar-item[data-id="${id}"]`).forEach(el => el.classList.add("active"));

    // Close mobile sidebar
    if (window._closeMobileSidebar) window._closeMobileSidebar();

    const candidat = allCandidats.find(c => c.id === id);
    if (!candidat) return;
    selectedCandidat = candidat;

    updateHeaderName(candidat);

    const container = document.getElementById("bilan-container");
    const emptyState = document.getElementById("empty-state");
    container.classList.add("hidden");
    emptyState.classList.remove("hidden");
    emptyState.innerHTML = '<div class="flex flex-col items-center justify-center min-h-[40vh]"><div class="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div><p class="text-sm text-gray-400">Chargement du bilan...</p></div>';

    const standObservations = {};
    try {
        const snap = await db.collection("candidats").doc(id)
            .collection("observations").get();
        snap.forEach(doc => {
            standObservations[doc.id] = doc.data();
        });
    } catch (err) {
        console.error("Erreur chargement observations :", err);
    }

    currentStandObservations = standObservations;
    currentScoresCandidat = candidat.scores_candidat || null;
    currentAverageScores = computeAverageScores(standObservations);

    const emptyEl = document.getElementById("empty-state");
    emptyEl.innerHTML = '';

    renderBilan(candidat, standObservations);
    showFab(true);

    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// Compute average scores across completed stands
// ============================================================
function computeAverageScores(standObs) {
    const sums = {};
    const counts = {};
    SAVOIR_ETRE.forEach(skill => { sums[skill] = 0; counts[skill] = 0; });

    Object.values(standObs).forEach(obs => {
        const scores = obs.scores_animateur || obs.scores || {};
        SAVOIR_ETRE.forEach(skill => {
            const v = scores[skill];
            if (v && v > 0) {
                sums[skill] += v;
                counts[skill]++;
            }
        });
    });

    const avg = {};
    SAVOIR_ETRE.forEach(skill => {
        avg[skill] = counts[skill] > 0 ? Math.round(sums[skill] / counts[skill] * 10) / 10 : 0;
    });
    return avg;
}

// ============================================================
// Render bilan
// ============================================================
function renderBilan(candidat, standObservations) {
    document.getElementById("empty-state").classList.add("hidden");
    const container = document.getElementById("bilan-container");
    container.classList.remove("hidden");
    container.style.animation = "none";
    void container.offsetWidth;
    container.style.animation = "fadeUp 0.4s ease forwards";

    document.getElementById("bilan-prenom").textContent = candidat.prenom || "";
    document.getElementById("bilan-nom").textContent = candidat.nom || "";
    document.getElementById("bilan-email").textContent = candidat.email || "—";

    const psyBadge = document.getElementById("bilan-psy-badge");
    if (candidat.profil_psy) {
        document.getElementById("bilan-profil-psy").textContent = candidat.profil_psy;
        psyBadge.classList.remove("hidden");
        psyBadge.classList.add("inline-flex");
    } else {
        psyBadge.classList.add("hidden");
        psyBadge.classList.remove("inline-flex");
    }

    // Links
    toggleLink("btn-cv", candidat.cvURL);
    toggleLink("btn-linkedin", candidat.linkedin);
    toggleLink("btn-personality", candidat.personalityLink);

    renderPersonalityDecoder(candidat.profil_psy);
    renderStandNotes(standObservations);
    renderStandsProgress(standObservations);
    renderSuperPouvoirs(currentAverageScores);
    renderComparativeTable(currentScoresCandidat, standObservations, currentAverageScores);
    renderRadar(currentAverageScores, currentScoresCandidat);
}

function toggleLink(btnId, url) {
    const btn = document.getElementById(btnId);
    if (url) {
        btn.href = url;
        btn.classList.remove("hidden");
        btn.classList.add("inline-flex");
    } else {
        btn.classList.add("hidden");
        btn.classList.remove("inline-flex");
    }
}

// ============================================================
// 1. Personality Decoder
// ============================================================
function renderPersonalityDecoder(profilPsy) {
    const container = document.getElementById("personality-decoder");
    if (!profilPsy || !PERSONALITY_PROFILES[profilPsy]) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    const profile = PERSONALITY_PROFILES[profilPsy];
    container.classList.remove("hidden");
    container.innerHTML = `
        <div class="psy-decoder px-7 py-4">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center flex-shrink-0">
                    <span class="text-lg">🧠</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2 flex-wrap">
                        <span class="font-extrabold text-amber-800 text-base">${profilPsy}</span>
                        <span class="text-amber-700 font-bold text-sm">— ${profile.titre}</span>
                    </div>
                    <p class="text-[13px] text-amber-800/80 leading-relaxed mt-1">${profile.desc}</p>
                    <p class="text-[10px] text-amber-600/60 mt-2 italic">Le profil de personnalité est un indicateur de tendances comportementales, idéal pour initier un échange constructif, et non un test scientifique strict.</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// Stand notes (per stand)
// ============================================================
function renderStandNotes(standObservations) {
    const container = document.getElementById("notes-section");
    const notes = [];
    STANDS.forEach(stand => {
        const obs = standObservations[stand.id];
        if (obs && obs.notesAnimateur) {
            notes.push({ stand, text: obs.notesAnimateur });
        }
    });

    if (!notes.length) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.classList.remove("hidden");
    container.innerHTML = `
        <div class="px-7 py-4 bg-amber-50 border-t border-amber-100">
            <div class="flex items-start gap-2.5">
                <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                <div class="flex-1">
                    <p class="text-xs font-bold text-amber-700 mb-2">Notes des facilitateurs</p>
                    ${notes.map(n => `
                        <div class="mb-1.5 last:mb-0">
                            <span class="text-[11px] font-bold text-amber-600">${n.stand.emoji} ${n.stand.nom} :</span>
                            <span class="text-[12px] text-amber-900/70 italic ml-1">${n.text}</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// Stands progress badges
// ============================================================
function renderStandsProgress(standObservations) {
    const container = document.getElementById("stands-progress");
    const badges = document.getElementById("stands-badges");
    const completedCount = STANDS.filter(s => standObservations[s.id]).length;

    if (completedCount === 0) {
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");
    badges.innerHTML = STANDS.map(stand => {
        const done = !!standObservations[stand.id];
        return `
            <div class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}">
                <span class="text-lg">${stand.emoji}</span>
                <div>
                    <p class="text-[12px] font-bold ${done ? 'text-emerald-700' : 'text-gray-400'}">${stand.nom}</p>
                    <p class="text-[10px] ${done ? 'text-emerald-500 font-semibold' : 'text-gray-400'}">
                        ${done ? '✓ Complété' : 'En attente'}
                    </p>
                </div>
            </div>
        `;
    }).join("");
}

// ============================================================
// 2. Super-Pouvoirs (Top 3)
// ============================================================
function renderSuperPouvoirs(avgScores) {
    const container = document.getElementById("super-pouvoirs-container");
    if (!avgScores || Object.values(avgScores).every(v => v === 0)) {
        container.classList.add("hidden");
        return;
    }

    const ranked = SAVOIR_ETRE
        .filter(s => avgScores[s] > 0)
        .sort((a, b) => avgScores[b] - avgScores[a])
        .slice(0, 3);

    if (!ranked.length) {
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden px-7 py-5">
            <h3 class="flex items-center gap-2.5 text-sm font-bold text-gray-700 mb-4">
                <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span class="text-sm">⚡</span>
                </div>
                Top 3 des savoir-être observés par les facilitateurs
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                ${ranked.map((skill, idx) => {
                    const score = avgScores[skill];
                    const roundedScore = Math.round(score);
                    const label = LABELS_QUALITATIFS[roundedScore] || "";
                    const medals = ["🥇", "🥈", "🥉"];
                    return `
                        <div class="superpower-card rounded-xl p-4 flex items-center gap-3">
                            <div class="superpower-rank">${medals[idx]}</div>
                            <div class="min-w-0">
                                <p class="font-bold text-brand-800 text-[14px] leading-tight">${skill}</p>
                                <p class="text-[12px] text-brand-600 font-semibold mt-0.5">${score.toFixed(1)}/5 · ${label}</p>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

// ============================================================
// 3. Multi-Stand Comparative Table
// ============================================================
function getScorePillHTML(score) {
    if (!score || score === 0) {
        return '<span class="score-pill bg-gray-100 text-gray-400 border border-gray-200">—</span>';
    }
    const rounded = Math.round(score);
    const label = LABELS_QUALITATIFS[rounded] || "—";
    const colors = SCORE_COLORS[rounded] || SCORE_COLORS[0];
    return `<span class="score-pill" style="background:${colors.bg};color:${colors.text};border:1px solid ${colors.border}">
        ${rounded}/5 · ${label}
    </span>`;
}

function getStandDotsHTML(skill, standObservations) {
    return STANDS.map(stand => {
        const obs = standObservations[stand.id];
        const scores = obs ? (obs.scores_animateur || obs.scores || {}) : {};
        const score = scores[skill] || 0;
        if (score === 0) {
            return `<span class="stand-dot bg-gray-100 text-gray-400 border border-gray-200" title="${stand.nom} : pas encore évalué">—</span>`;
        }
        const colors = SCORE_COLORS[score];
        return `<span class="stand-dot" style="background:${colors.bg};color:${colors.text};border:1px solid ${colors.border}" title="${stand.nom} : ${score}/5 — ${LABELS_QUALITATIFS[score]}">${score}</span>`;
    }).join("");
}

function getBoussoleHTML(scoreCandidat, avgTerrain) {
    if ((!scoreCandidat || scoreCandidat === 0) || avgTerrain === 0) {
        return '<span class="boussole-badge bg-gray-100 text-gray-400 border border-gray-200">—</span>';
    }

    const ecart = scoreCandidat - avgTerrain;

    if (Math.abs(ecart) <= 0.8) {
        return '<span class="boussole-badge boussole-ancree">🤝 Conscience de soi ancrée</span>';
    }
    if (ecart < -0.8) {
        return '<span class="boussole-badge boussole-pepite">💎 Pépite cachée</span>';
    }
    return '<span class="boussole-badge boussole-potentiel">🚀 Potentiel à confirmer</span>';
}

function renderComparativeTable(scoresCandidat, standObservations, avgScores) {
    const tbody = document.getElementById("comp-table-body");
    const emptyMsg = document.getElementById("comp-table-empty");
    const hasCandidat = scoresCandidat && Object.values(scoresCandidat).some(v => v > 0);
    const hasStands = Object.keys(standObservations).length > 0;

    if (!hasCandidat && !hasStands) {
        tbody.innerHTML = "";
        emptyMsg.classList.remove("hidden");
        tbody.closest("table").classList.add("hidden");
        return;
    }

    emptyMsg.classList.add("hidden");
    tbody.closest("table").classList.remove("hidden");
    tbody.innerHTML = "";

    SAVOIR_ETRE.forEach((skill, idx) => {
        const sc = (scoresCandidat && scoresCandidat[skill]) || 0;
        const avg = avgScores[skill] || 0;

        const tr = document.createElement("tr");
        tr.className = idx % 2 === 0 ? "bg-white" : "bg-gray-50/50";
        tr.innerHTML = `
            <td class="px-5 py-3 font-medium text-gray-700 text-[13px]">${skill}</td>
            <td class="px-3 py-3 text-center">${getScorePillHTML(sc)}</td>
            <td class="px-3 py-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    ${getStandDotsHTML(skill, standObservations)}
                </div>
            </td>
            <td class="px-3 py-3 text-center">${getBoussoleHTML(sc, avg)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================
// Radar Chart (dual: auto-eval + terrain average)
// ============================================================
function renderRadar(avgScores, scoresCandidat) {
    const canvas = document.getElementById("radar-chart");
    const noMsg = document.getElementById("no-observation-msg");
    const hasAvg = avgScores && Object.values(avgScores).some(v => v > 0);
    const hasCand = scoresCandidat && Object.values(scoresCandidat).some(v => v > 0);

    if (!hasAvg && !hasCand) {
        canvas.style.display = "none";
        noMsg.classList.remove("hidden");
        if (radarChart) { radarChart.destroy(); radarChart = null; }
        return;
    }

    canvas.style.display = "block";
    noMsg.classList.add("hidden");
    if (radarChart) { radarChart.destroy(); radarChart = null; }

    const datasets = [];
    if (hasAvg) {
        datasets.push({
            label: "Moyenne terrain (facilitateurs)",
            data: SAVOIR_ETRE.map(s => avgScores[s] || 0),
            backgroundColor: "rgba(139,92,246,0.12)",
            borderColor: "rgba(124,58,237,0.7)",
            borderWidth: 2,
            pointBackgroundColor: "#7c3aed",
            pointBorderColor: "#fff",
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6
        });
    }
    if (hasCand) {
        datasets.push({
            label: "Auto-évaluation (candidat)",
            data: SAVOIR_ETRE.map(s => (scoresCandidat[s] || 0)),
            backgroundColor: "rgba(234,179,8,0.08)",
            borderColor: "rgba(234,179,8,0.5)",
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointBackgroundColor: "#eab308",
            pointBorderColor: "#fff",
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5
        });
    }

    radarChart = new Chart(canvas, {
        type: "radar",
        data: {
            labels: SAVOIR_ETRE.map(l => l.length > 14 ? l.slice(0, 12) + "…" : l),
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: "bottom", labels: { font: { size: 10 }, usePointStyle: true, pointStyle: "circle", padding: 12 } },
                tooltip: {
                    backgroundColor: "#1e1b4b",
                    borderColor: "rgba(139,92,246,0.3)",
                    borderWidth: 1,
                    titleColor: "#c4b5fd",
                    bodyColor: "#e5e7eb",
                    padding: 10,
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.raw;
                            const rounded = Math.round(v);
                            return ` ${ctx.dataset.label}: ${v.toFixed ? v.toFixed(1) : v}/5 — ${LABELS_QUALITATIFS[rounded] || ""}`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true, min: 0, max: 5,
                    ticks: { stepSize: 1, font: { size: 11 }, backdropColor: "transparent", color: "#9ca3af" },
                    pointLabels: { font: { size: 12, weight: "500" }, color: "#6b7280" },
                    grid: { color: "rgba(0,0,0,0.06)" },
                    angleLines: { color: "rgba(0,0,0,0.06)" }
                }
            },
            animation: { duration: 600, easing: "easeOutQuart" }
        },
        plugins: [{
            id: "whiteBackground",
            beforeDraw: (chart) => {
                const ctx = chart.canvas.getContext("2d");
                ctx.save();
                ctx.globalCompositeOperation = "destination-over";
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, chart.canvas.width, chart.canvas.height);
                ctx.restore();
            }
        }]
    });
}

// ============================================================
// PDF Export — jsPDF direct rendering
// ============================================================
function cleanText(s) {
    if (!s) return "";
    return String(s)
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}\u{1F000}-\u{1F9FF}]/gu, "")
        .replace(/['']/g, "'").replace(/[""]/g, '"').replace(/…/g, "...").replace(/—/g, "-").replace(/–/g, "-").replace(/→/g, "->").replace(/ /g, " ")
        .replace(/[✓✔✅]/g, "").replace(/[✨☆★✱❖]/g, "*")
        .replace(/é/g, "e").replace(/è/g, "e").replace(/ê/g, "e").replace(/ë/g, "e")
        .replace(/É/g, "E").replace(/È/g, "E").replace(/Ê/g, "E")
        .replace(/à/g, "a").replace(/â/g, "a").replace(/ä/g, "a")
        .replace(/À/g, "A").replace(/Â/g, "A")
        .replace(/ù/g, "u").replace(/û/g, "u").replace(/ü/g, "u")
        .replace(/î/g, "i").replace(/ï/g, "i")
        .replace(/ô/g, "o").replace(/ö/g, "o")
        .replace(/ç/g, "c").replace(/Ç/g, "C")
        .replace(/'/g, "'").trim();
}

function setupExportPDF() {
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        if (!selectedCandidat) return;
        try {
            generatePDF(selectedCandidat, currentStandObservations, currentScoresCandidat, currentAverageScores);
        } catch (err) {
            console.error("Erreur export PDF :", err);
            alert("Erreur PDF : " + err.message);
        }
    });
}

function generatePDF(candidat, standObservations, scoresCandidat, avgScores) {
    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFCtor) throw new Error("jsPDF non disponible");

    const pdf = new jsPDFCtor({ unit: "mm", format: "a4", orientation: "portrait" });
    const PW = 210, PH = 297, M = 12, W = PW - 2 * M;
    let y = M;

    // ---- HEADER ----
    const headerH = 22;
    pdf.setFillColor(76, 29, 149);
    pdf.roundedRect(M, y, W, headerH, 3, 3, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(cleanText(`${candidat.prenom || ""} ${candidat.nom || ""}`), M + 6, y + 8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(220, 215, 255);
    pdf.text("CV soft-skills - Forum emploi ludique", M + 6, y + 13);

    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    const infoLine = [candidat.email || ""].concat(candidat.profil_psy ? [candidat.profil_psy] : []).join("  |  ");
    pdf.text(cleanText(infoLine), M + 6, y + 18);
    y += headerH + 3;

    // ---- PERSONALITY DECODER ----
    if (candidat.profil_psy && PERSONALITY_PROFILES[candidat.profil_psy]) {
        const p = PERSONALITY_PROFILES[candidat.profil_psy];
        const titleTxt = cleanText(`${candidat.profil_psy} - ${p.titre}`);
        const descTxt = cleanText(p.desc);
        const descLines = pdf.splitTextToSize(descTxt, W - 10);
        const blockH = 10 + descLines.length * 3.2;

        pdf.setFillColor(255, 251, 235);
        pdf.setDrawColor(253, 230, 138);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(M, y, W, blockH, 2, 2, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(146, 64, 14);
        pdf.text(titleTxt, M + 4, y + 5);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(120, 53, 15);
        pdf.text(descLines, M + 4, y + 10);

        y += blockH + 3;
    }

    // ---- SUPER-POUVOIRS ----
    const ranked = SAVOIR_ETRE.filter(s => avgScores[s] > 0).sort((a, b) => avgScores[b] - avgScores[a]).slice(0, 3);
    if (ranked.length > 0) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(31, 41, 55);
        pdf.text("Top 3 des savoir-etre observes par les facilitateurs", M, y + 4);
        y += 7;

        const cardW = (W - 6) / 3;
        ranked.forEach((skill, i) => {
            const cx = M + i * (cardW + 3);
            pdf.setFillColor(245, 243, 255);
            pdf.setDrawColor(221, 214, 254);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(cx, y, cardW, 14, 2, 2, "FD");

            const medals = ["#1", "#2", "#3"];
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(76, 29, 149);
            pdf.text(medals[i], cx + 3, y + 5);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(7.5);
            pdf.setTextColor(91, 33, 182);
            pdf.text(cleanText(skill), cx + 10, y + 5);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7);
            pdf.setTextColor(109, 40, 217);
            const roundedScore = Math.round(avgScores[skill]);
            pdf.text(`${avgScores[skill].toFixed(1)}/5 - ${cleanText(LABELS_QUALITATIFS[roundedScore])}`, cx + 10, y + 10);
        });
        y += 18;
    }

    // ---- COMPARATIVE TABLE ----
    const hasCandidat = scoresCandidat && Object.values(scoresCandidat).some(v => v > 0);
    const hasStands = Object.keys(standObservations).length > 0;

    if (hasCandidat || hasStands) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(31, 41, 55);
        pdf.text("Tableau comparatif multi-stands", M, y + 4);
        y += 7;

        const colX = [M, M + 48, M + 68, M + 88, M + 108, M + 128];
        const colLabels = ["Savoir-etre", "Auto", "Aero", "Bat", "AV", "Resto", "Boussole"];
        const rowH = 5.5;

        pdf.setFillColor(243, 244, 246);
        pdf.rect(M, y, W, rowH, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6);
        pdf.setTextColor(75, 85, 99);
        colLabels.forEach((label, i) => {
            if (i < colX.length) pdf.text(label, colX[i] + 1.5, y + 3.8);
            else pdf.text(label, M + 148, y + 3.8);
        });
        y += rowH;

        SAVOIR_ETRE.forEach((skill, idx) => {
            if (y > PH - 20) { pdf.addPage(); y = M; }

            const sc = (scoresCandidat && scoresCandidat[skill]) || 0;
            const avg = avgScores[skill] || 0;

            if (idx % 2 === 0) {
                pdf.setFillColor(249, 250, 251);
                pdf.rect(M, y, W, rowH, "F");
            }

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(6.5);
            pdf.setTextColor(55, 65, 81);
            pdf.text(cleanText(skill), colX[0] + 1.5, y + 3.8);

            // Auto score
            pdf.setTextColor(sc > 0 ? [55, 65, 81] : [156, 163, 175]);
            pdf.text(sc > 0 ? `${sc}/5` : "-", colX[1] + 1.5, y + 3.8);

            // Stand scores
            STANDS.forEach((stand, si) => {
                const obs = standObservations[stand.id];
                const scs = obs ? (obs.scores_animateur || obs.scores || {}) : {};
                const sv = scs[skill] || 0;
                pdf.setTextColor(sv > 0 ? [55, 65, 81] : [156, 163, 175]);
                pdf.text(sv > 0 ? `${sv}/5` : "-", colX[2 + si] + 1.5, y + 3.8);
            });

            // Boussole text
            pdf.setFontSize(6);
            if (sc > 0 && avg > 0) {
                const ecart = sc - avg;
                if (Math.abs(ecart) <= 0.8) {
                    pdf.setTextColor(6, 95, 70);
                    pdf.text("Conscience ancree", M + 148, y + 3.8);
                } else if (ecart < -0.8) {
                    pdf.setTextColor(30, 64, 175);
                    pdf.text("Pepite cachee", M + 148, y + 3.8);
                } else {
                    pdf.setTextColor(133, 77, 14);
                    pdf.text("Potentiel a confirmer", M + 148, y + 3.8);
                }
            } else {
                pdf.setTextColor(156, 163, 175);
                pdf.text("-", M + 150, y + 3.8);
            }

            y += rowH;
        });

        y += 4;
    }

    // ---- RADAR ----
    if (y > PH - 100) { pdf.addPage(); y = M; }

    const radarW = 110, radarH = 90;
    const radarX = M + (W - radarW) / 2;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(radarX, y, radarW, radarH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Profil des savoir-etre", radarX + 4, y + 6);

    const hasRadarData = avgScores && Object.values(avgScores).some(v => v > 0);
    if (hasRadarData && radarChart) {
        const img = radarChart.toBase64Image("image/png", 1.0);
        pdf.addImage(img, "PNG", radarX + 5, y + 8, radarW - 10, radarH - 14);
    } else {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text("Aucune observation enregistree", radarX + 6, y + radarH / 2);
    }

    y += radarH + 5;

    // ---- DISCLAIMER ----
    if (y > PH - 20) { pdf.addPage(); y = M; }

    const disclaimerText = "Ce CV soft-skills est un outil de mediation, pas de classement. Les observations sont subjectives, liees au contexte de seances de jeu. Elles servent de point de depart pour accompagner le candidat dans son orientation.";
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    const dlines = pdf.splitTextToSize(disclaimerText, W - 14);
    const discH = 6 + dlines.length * 3 + 3;

    pdf.setFillColor(245, 243, 255);
    pdf.setDrawColor(196, 181, 253);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, W, discH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(91, 33, 182);
    pdf.text("RAPPEL", M + 4, y + 4.5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(91, 33, 182);
    pdf.text(dlines, M + 4, y + 8);

    // Footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(156, 163, 175);
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    pdf.text(`SoftSkill Observer - CV soft-skills - Genere le ${dateStr}`, PW / 2, PH - 5, { align: "center" });

    pdf.save(`AntiCV_${cleanText(candidat.prenom || "")}_${cleanText(candidat.nom || "")}.pdf`);
}
