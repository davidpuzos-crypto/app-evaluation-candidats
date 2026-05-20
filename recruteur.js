// ============================================================
// Recruteur — Anti-CV bienveillant
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
// Pistes d'orientation
// ============================================================
const SECTEURS = [
    { nom: "Aéronautique & Défense", emoji: "✈️", description: "Précision, calme sous pression, sens de l'organisation", competences: ["Rigueur", "Gestion du stress", "Prise de décision"], labels: ["Rigueur", "Gestion du stress", "Sens de l'organisation"] },
    { nom: "Restauration",           emoji: "🍽️", description: "Réactivité, esprit d'équipe, relation client",           competences: ["Gestion des conflits", "Travail en équipe", "Communication"], labels: ["Réactivité", "Travail en équipe", "Communication"] },
    { nom: "Bâtiment",               emoji: "🏗️", description: "Endurance, autonomie, adaptation au terrain",             competences: ["Persévérance", "Autonomie", "Capacité d'adaptation"], labels: ["Persévérance", "Autonomie", "Adaptation"] },
    { nom: "Audio-visuel",           emoji: "🎬",  description: "Créativité, curiosité, fédérer une équipe",               competences: ["Esprit critique", "Créativité", "Leadership"], labels: ["Force de proposition", "Curiosité", "Fédérer"] }
];

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
});

// ============================================================
// Load candidates
// ============================================================
async function loadCandidats() {
    const list = document.getElementById("candidat-list");
    const counter = document.getElementById("candidat-count");
    try {
        const snap = await db.collection("candidats").orderBy("dateInscription", "desc").get();
        allCandidats = [];
        snap.forEach(doc => allCandidats.push({ id: doc.id, ...doc.data() }));
        counter.textContent = `${allCandidats.length} candidat(s)`;
        renderCandidatList(allCandidats);
    } catch (err) {
        console.error("Erreur chargement candidats :", err);
        list.innerHTML = '<li class="px-4 py-6 text-center text-red-400/60 text-sm">Erreur de chargement</li>';
    }
}

function renderCandidatList(candidats) {
    const list = document.getElementById("candidat-list");
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
}

// ============================================================
// Search
// ============================================================
function setupSearch() {
    document.getElementById("search-input").addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = q
            ? allCandidats.filter(c => `${c.prenom} ${c.nom} ${c.email} ${c.profil_psy || ""}`.toLowerCase().includes(q))
            : allCandidats;
        renderCandidatList(filtered);
        document.getElementById("candidat-count").textContent = `${filtered.length} candidat(s)`;
    });
}

// ============================================================
// Select candidate — fetch ALL stand observations
// ============================================================
async function selectCandidat(id, liEl) {
    document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("active"));
    liEl.classList.add("active");

    const candidat = allCandidats.find(c => c.id === id);
    if (!candidat) return;
    selectedCandidat = candidat;

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

    renderBilan(candidat, standObservations);
}

// ============================================================
// Compute average scores across completed stands
// ============================================================
function computeAverageScores(standObs) {
    const sums = {};
    const counts = {};
    SAVOIR_ETRE.forEach(skill => { sums[skill] = 0; counts[skill] = 0; });

    Object.values(standObs).forEach(obs => {
        const scores = obs.scores || {};
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
    renderSecteurs(currentAverageScores);
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
                    <p class="text-xs font-bold text-amber-700 mb-2">Notes des animateurs</p>
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
                Ses Super-Pouvoirs sur le terrain
                <span class="text-[10px] font-normal text-gray-400 ml-1">— Top 3 des savoir-être observés par les animateurs</span>
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
        const score = obs && obs.scores ? (obs.scores[skill] || 0) : 0;
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
            label: "Moyenne terrain (animateurs)",
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
                    ticks: { stepSize: 1, font: { size: 9 }, backdropColor: "transparent", color: "#9ca3af" },
                    pointLabels: { font: { size: 9, weight: "500" }, color: "#6b7280" },
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
// Sectors
// ============================================================
function calculateMatch(scores, secteur) {
    if (!scores) return 0;
    return Math.round(secteur.competences.reduce((sum, c) => sum + (scores[c] || 0), 0) / 15 * 100);
}

function getBarStyle(pct) {
    if (pct > 75) return { fill: "bg-emerald-500", bg: "bg-emerald-50", textClass: "text-emerald-700", msg: "Forte affinité" };
    if (pct >= 50) return { fill: "bg-amber-500", bg: "bg-amber-50", textClass: "text-amber-700", msg: "Affinité modérée" };
    return { fill: "bg-gray-400", bg: "bg-gray-50", textClass: "text-gray-500", msg: "À explorer" };
}

function renderSecteurs(scores) {
    const container = document.getElementById("secteurs-container");
    container.innerHTML = "";

    const sorted = [...SECTEURS].map(s => ({ ...s, pct: calculateMatch(scores, s) }))
        .sort((a, b) => b.pct - a.pct);

    sorted.forEach((s, idx) => {
        const style = getBarStyle(s.pct);
        const block = document.createElement("div");
        block.className = `rounded-xl p-3.5 border border-gray-100 ${style.bg}`;
        block.style.cssText = `animation:fadeUp 0.4s ease forwards; animation-delay:${idx * 0.08}s; opacity:0;`;

        block.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${s.emoji}</span>
                    <div>
                        <span class="font-bold text-gray-700 text-sm">${s.nom}</span>
                        <p class="text-[10px] text-gray-400 mt-0.5">${s.description}</p>
                    </div>
                </div>
                <div class="text-right flex-shrink-0 ml-2">
                    <span class="text-lg font-extrabold ${style.textClass}">${s.pct}%</span>
                    <p class="text-[10px] ${style.textClass} font-semibold">${style.msg}</p>
                </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div class="progress-fill ${style.fill} h-2.5 rounded-full" style="width:0%"></div>
            </div>
            <div class="flex flex-wrap gap-1">
                ${s.labels.map(l => `<span class="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">${l}</span>`).join("")}
            </div>
        `;
        container.appendChild(block);
        requestAnimationFrame(() => {
            block.querySelector(".progress-fill").style.width = s.pct + "%";
        });
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
    pdf.text("Anti-CV bienveillant - Forum emploi ludique", M + 6, y + 13);

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
        pdf.text("Ses Super-Pouvoirs sur le terrain", M, y + 4);
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
                const sv = obs && obs.scores ? (obs.scores[skill] || 0) : 0;
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

    const colTop = y;
    const radarW = 90, radarH = 90;
    const secX = M + radarW + 5;
    const secW = W - radarW - 5;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, radarW, radarH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Profil des savoir-etre", M + 4, y + 6);

    const hasRadarData = avgScores && Object.values(avgScores).some(v => v > 0);
    if (hasRadarData && radarChart) {
        const img = radarChart.toBase64Image("image/png", 1.0);
        pdf.addImage(img, "PNG", M + 2, y + 8, radarW - 4, radarH - 14);
    } else {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text("Aucune observation enregistree", M + 6, y + radarH / 2);
    }

    // Sectors
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Pistes d'orientation", secX, y + 6);

    const sorted = [...SECTEURS].map(s => ({
        ...s,
        pct: avgScores ? Math.round(s.competences.reduce((sum, k) => sum + (avgScores[k] || 0), 0) / 15 * 100) : 0
    })).sort((a, b) => b.pct - a.pct);

    let sy = y + 12;
    const cardH = 19;

    sorted.forEach(s => {
        let bg, txt, bar;
        if (s.pct > 75) { bg = [236, 253, 245]; txt = [4, 120, 87]; bar = [16, 185, 129]; }
        else if (s.pct >= 50) { bg = [255, 251, 235]; txt = [180, 83, 9]; bar = [245, 158, 11]; }
        else { bg = [249, 250, 251]; txt = [75, 85, 99]; bar = [156, 163, 175]; }

        pdf.setFillColor(bg[0], bg[1], bg[2]);
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(secX, sy, secW, cardH, 2, 2, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(31, 41, 55);
        pdf.text(cleanText(s.nom), secX + 3, sy + 5);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(txt[0], txt[1], txt[2]);
        const pctTxt = s.pct + "%";
        const pctW = pdf.getTextWidth(pctTxt);
        pdf.text(pctTxt, secX + secW - pctW - 3, sy + 5.5);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(107, 114, 128);
        pdf.text(cleanText(s.description), secX + 3, sy + 9);

        const barX = secX + 3, barY = sy + 11.5, barW = secW - 6;
        pdf.setFillColor(229, 231, 235);
        pdf.roundedRect(barX, barY, barW, 2, 1, 1, "F");
        if (s.pct > 0) {
            pdf.setFillColor(bar[0], bar[1], bar[2]);
            pdf.roundedRect(barX, barY, barW * (s.pct / 100), 2, 1, 1, "F");
        }

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(107, 114, 128);
        pdf.text(s.labels.map(cleanText).join(" - "), secX + 3, sy + 17);

        sy += cardH + 2;
    });

    y = colTop + Math.max(radarH, sy - colTop) + 5;

    // ---- DISCLAIMER ----
    if (y > PH - 20) { pdf.addPage(); y = M; }

    const disclaimerText = "Cet Anti-CV est un outil de mediation, pas de classement. Les observations sont subjectives, liees au contexte de seances de jeu. Elles servent de point de depart pour accompagner le candidat dans son orientation.";
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
    pdf.text(`SoftSkill Observer - Anti-CV bienveillant - Genere le ${dateStr}`, PW / 2, PH - 5, { align: "center" });

    pdf.save(`AntiCV_${cleanText(candidat.prenom || "")}_${cleanText(candidat.nom || "")}.pdf`);
}
