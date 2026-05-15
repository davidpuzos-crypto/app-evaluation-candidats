// ============================================================
// Firebase est initialisé par firebase-config.js (db, storage)
// ============================================================

// ============================================================
// Référentiel
// ============================================================
const SAVOIR_ETRE = [
    "Capacité d'adaptation", "Gestion du stress", "Travail en équipe",
    "Communication", "Écoute active", "Leadership", "Créativité",
    "Esprit critique", "Prise de décision", "Gestion des conflits",
    "Autonomie", "Rigueur", "Empathie", "Persévérance"
];

const LABELS_QUALITATIFS = ["", "En émergence", "En développement", "Observé", "Bien observé", "Point fort"];

// ============================================================
// Pistes d'orientation
// ============================================================
const SECTEURS = [
    {
        nom: "Aéronautique", emoji: "✈️",
        description: "Précision, calme sous pression, sens de l'organisation",
        competences: ["Rigueur", "Gestion du stress", "Prise de décision"],
        labels: ["Rigueur", "Gestion du stress", "Sens de l'organisation"]
    },
    {
        nom: "Restauration", emoji: "🍽️",
        description: "Réactivité, esprit d'équipe, relation client",
        competences: ["Gestion des conflits", "Travail en équipe", "Communication"],
        labels: ["Réactivité", "Travail en équipe", "Communication"]
    },
    {
        nom: "Bâtiment", emoji: "🏗️",
        description: "Endurance, autonomie, adaptation au terrain",
        competences: ["Persévérance", "Autonomie", "Capacité d'adaptation"],
        labels: ["Persévérance", "Autonomie", "Adaptation"]
    },
    {
        nom: "Audio-visuel", emoji: "🎬",
        description: "Créativité, curiosité, fédérer une équipe",
        competences: ["Esprit critique", "Créativité", "Leadership"],
        labels: ["Force de proposition", "Curiosité", "Fédérer"]
    }
];

// ============================================================
// État
// ============================================================
let allCandidats  = [];
let radarChart    = null;
let selectedCandidat = null;

// ============================================================
// Init
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    loadCandidats();
    setupSearch();
    setupExportPDF();
});

// ============================================================
// Chargement
// ============================================================
async function loadCandidats() {
    const list    = document.getElementById("candidat-list");
    const counter = document.getElementById("candidat-count");
    try {
        const snap = await db.collection("candidats").orderBy("dateInscription", "desc").get();
        allCandidats = [];
        snap.forEach(doc => allCandidats.push({ id: doc.id, ...doc.data() }));
        counter.textContent = `${allCandidats.length} jeune(s)`;
        renderCandidatList(allCandidats);
    } catch (err) {
        console.error("Erreur :", err);
        list.innerHTML = '<li class="px-4 py-6 text-center text-red-400/60 text-sm">Erreur de chargement</li>';
    }
}

function renderCandidatList(candidats) {
    const list = document.getElementById("candidat-list");
    if (!candidats.length) {
        list.innerHTML = '<li class="px-4 py-8 text-center text-gray-300 text-sm">Aucun jeune trouvé</li>';
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
            dateStr = d.toLocaleDateString("fr-FR", { day:"2-digit", month:"short" });
        }

        const ini = ((c.prenom||"")[0]||"") + ((c.nom||"")[0]||"");
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="avatar w-9 h-9">${ini.toUpperCase()}</div>
                <div class="min-w-0 flex-1">
                    <p class="font-semibold text-gray-700 text-[13px] truncate">${c.prenom||""} ${c.nom||""}</p>
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
// Recherche
// ============================================================
function setupSearch() {
    document.getElementById("search-input").addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = q
            ? allCandidats.filter(c => `${c.prenom} ${c.nom} ${c.email} ${c.profil_psy||""}`.toLowerCase().includes(q))
            : allCandidats;
        renderCandidatList(filtered);
        document.getElementById("candidat-count").textContent = `${filtered.length} jeune(s)`;
    });
}

// ============================================================
// Sélection
// ============================================================
async function selectCandidat(id, liEl) {
    document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("active"));
    liEl.classList.add("active");

    const candidat = allCandidats.find(c => c.id === id);
    if (!candidat) return;
    selectedCandidat = candidat;

    let scores = null, notesAnimateur = "";
    try {
        const snap = await db.collection("candidats").doc(id)
            .collection("observations").orderBy("dateObservation", "desc").limit(1).get();
        if (!snap.empty) {
            const data = snap.docs[0].data();
            scores = data.scores;
            notesAnimateur = data.notesAnimateur || "";
        }
    } catch (err) { console.error("Erreur :", err); }

    if (!scores && candidat.dernieresNotes) scores = candidat.dernieresNotes;
    if (!notesAnimateur && candidat.notesAnimateur) notesAnimateur = candidat.notesAnimateur;

    renderBilan(candidat, scores, notesAnimateur);
}

// ============================================================
// Rendu bilan
// ============================================================
function renderBilan(candidat, scores, notesAnimateur) {
    document.getElementById("empty-state").classList.add("hidden");
    const container = document.getElementById("bilan-container");
    container.classList.remove("hidden");
    container.style.animation = "none";
    void container.offsetWidth;
    container.style.animation = "fadeUp 0.4s ease forwards";

    document.getElementById("bilan-prenom").textContent = candidat.prenom || "";
    document.getElementById("bilan-nom").textContent    = candidat.nom || "";
    document.getElementById("bilan-email").textContent  = candidat.email || "—";

    const psyBadge = document.getElementById("bilan-psy-badge");
    if (candidat.profil_psy) {
        document.getElementById("bilan-profil-psy").textContent = candidat.profil_psy;
        psyBadge.classList.remove("hidden"); psyBadge.classList.add("inline-flex");
    } else {
        psyBadge.classList.add("hidden"); psyBadge.classList.remove("inline-flex");
    }

    // Notes
    const notesSection = document.getElementById("notes-section");
    if (notesAnimateur) {
        document.getElementById("bilan-notes").textContent = notesAnimateur;
        notesSection.classList.remove("hidden");
    } else {
        notesSection.classList.add("hidden");
    }

    // CV
    const btnCv = document.getElementById("btn-cv");
    if (candidat.cvURL) { btnCv.href = candidat.cvURL; btnCv.classList.remove("hidden"); btnCv.classList.add("inline-flex"); }
    else { btnCv.classList.add("hidden"); btnCv.classList.remove("inline-flex"); }

    // LinkedIn
    const btnLi = document.getElementById("btn-linkedin");
    if (candidat.linkedin) { btnLi.href = candidat.linkedin; btnLi.classList.remove("hidden"); btnLi.classList.add("inline-flex"); }
    else { btnLi.classList.add("hidden"); btnLi.classList.remove("inline-flex"); }

    renderRadar(scores);
    renderSecteurs(scores);
}

// ============================================================
// Radar Chart
// ============================================================
function renderRadar(scores) {
    const canvas = document.getElementById("radar-chart");
    const noMsg  = document.getElementById("no-observation-msg");

    if (!scores || Object.values(scores).every(v => v === 0)) {
        canvas.style.display = "none";
        noMsg.classList.remove("hidden");
        if (radarChart) { radarChart.destroy(); radarChart = null; }
        return;
    }

    canvas.style.display = "block";
    noMsg.classList.add("hidden");
    if (radarChart) { radarChart.destroy(); radarChart = null; }

    const data = SAVOIR_ETRE.map(s => scores[s] || 0);

    radarChart = new Chart(canvas, {
        type: "radar",
        data: {
            labels: SAVOIR_ETRE.map(l => l.length > 14 ? l.slice(0,12) + "…" : l),
            datasets: [{
                label: "Tendances observées",
                data,
                backgroundColor: "rgba(139,92,246,0.12)",
                borderColor: "rgba(124,58,237,0.6)",
                borderWidth: 2,
                pointBackgroundColor: "#7c3aed",
                pointBorderColor: "#fff",
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#8b5cf6"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#1e1b4b",
                    borderColor: "rgba(139,92,246,0.3)",
                    borderWidth: 1,
                    titleColor: "#c4b5fd",
                    bodyColor: "#e5e7eb",
                    padding: 10,
                    callbacks: {
                        label: (ctx) => ` ${LABELS_QUALITATIFS[ctx.raw] || "Non observé"} (${ctx.raw}/5)`
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true, min: 0, max: 5,
                    ticks: {
                        stepSize: 1,
                        font: { size: 9 },
                        backdropColor: "transparent",
                        color: "#9ca3af",
                        callback: (v) => LABELS_QUALITATIFS[v] ? LABELS_QUALITATIFS[v][0] : ""
                    },
                    pointLabels: {
                        font: { size: 9, weight: "500" },
                        color: "#6b7280"
                    },
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
// Pistes d'orientation
// ============================================================
function calculateMatch(scores, secteur) {
    if (!scores) return 0;
    return Math.round(secteur.competences.reduce((sum, c) => sum + (scores[c] || 0), 0) / 15 * 100);
}

function getBarStyle(pct) {
    if (pct > 75) return {
        fill: "bg-emerald-500", bg: "bg-emerald-50",
        textClass: "text-emerald-700", msg: "Forte affinité"
    };
    if (pct >= 50) return {
        fill: "bg-amber-500", bg: "bg-amber-50",
        textClass: "text-amber-700", msg: "Affinité modérée"
    };
    return {
        fill: "bg-gray-400", bg: "bg-gray-50",
        textClass: "text-gray-500", msg: "À explorer"
    };
}

function renderSecteurs(scores) {
    const container = document.getElementById("secteurs-container");
    container.innerHTML = "";

    // Trier par score décroissant
    const sorted = [...SECTEURS].map(s => ({ ...s, pct: calculateMatch(scores, s) }))
                                 .sort((a,b) => b.pct - a.pct);

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
// Export PDF — styles inline pour html2canvas
// ============================================================
function setupExportPDF() {
    document.getElementById("btn-export-pdf").addEventListener("click", async () => {
        if (!selectedCandidat) return;
        const el  = document.getElementById("bilan-container");
        const btn = document.getElementById("btn-export-pdf");
        btn.style.display = "none";

        const saved = applyPdfStyles();

        if (radarChart) {
            radarChart.options.scales.r.pointLabels.color = "#374151";
            radarChart.options.scales.r.pointLabels.font.size = 10;
            radarChart.options.scales.r.ticks.color = "#6b7280";
            radarChart.options.scales.r.grid.color = "rgba(0,0,0,0.15)";
            radarChart.options.scales.r.angleLines.color = "rgba(0,0,0,0.15)";
            radarChart.data.datasets[0].borderColor = "#7c3aed";
            radarChart.data.datasets[0].borderWidth = 3;
            radarChart.data.datasets[0].backgroundColor = "rgba(124,58,237,0.3)";
            radarChart.data.datasets[0].pointBackgroundColor = "#6d28d9";
            radarChart.data.datasets[0].pointRadius = 5;
            radarChart.data.datasets[0].pointBorderWidth = 2;
            radarChart.update("none");
        }

        await new Promise(r => setTimeout(r, 150));

        try {
            await html2pdf().set({
                margin: 10,
                filename: `Bilan_${selectedCandidat.prenom||""}_${selectedCandidat.nom||""}.pdf`,
                image: { type: "png", quality: 1.0 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
            }).from(el).save();
        } finally {
            restorePdfStyles(saved);
            btn.style.display = "";

            if (radarChart) {
                radarChart.options.scales.r.pointLabels.color = "#6b7280";
                radarChart.options.scales.r.pointLabels.font.size = 9;
                radarChart.options.scales.r.ticks.color = "#9ca3af";
                radarChart.options.scales.r.grid.color = "rgba(0,0,0,0.06)";
                radarChart.options.scales.r.angleLines.color = "rgba(0,0,0,0.06)";
                radarChart.data.datasets[0].borderColor = "rgba(124,58,237,0.6)";
                radarChart.data.datasets[0].borderWidth = 2;
                radarChart.data.datasets[0].backgroundColor = "rgba(139,92,246,0.12)";
                radarChart.data.datasets[0].pointBackgroundColor = "#7c3aed";
                radarChart.data.datasets[0].pointRadius = 4;
                radarChart.data.datasets[0].pointBorderWidth = 1.5;
                radarChart.update("none");
            }
        }
    });
}

function applyPdfStyles() {
    const saved = [];

    function save(el, styles) {
        saved.push({ el, orig: el.style.cssText });
        Object.entries(styles).forEach(([k, v]) => el.style.setProperty(k, v, "important"));
    }

    // Header gradient → solid purple
    const header = document.querySelector(".pdf-header");
    if (header) {
        save(header, {
            "background": "#4c1d95",
            "background-image": "none"
        });
        header.querySelectorAll("*").forEach(child => {
            if (child.id === "btn-export-pdf") return;
            const tag = child.tagName.toLowerCase();
            if (tag === "span" || tag === "h2" || tag === "svg" || tag === "path" || tag === "p" || tag === "a") {
                save(child, { "color": "#ffffff", "-webkit-text-fill-color": "#ffffff", "opacity": "1" });
            }
        });
    }

    // Email badge
    const emailBadge = document.querySelector(".pdf-badge-email");
    if (emailBadge) save(emailBadge, { "background-color": "rgba(255,255,255,0.25)" });

    // Psy badge
    const psyBadge = document.querySelector(".pdf-badge-psy");
    if (psyBadge && !psyBadge.classList.contains("hidden")) {
        save(psyBadge, { "background-color": "#d97706", "color": "#ffffff", "-webkit-text-fill-color": "#ffffff" });
        psyBadge.querySelectorAll("*").forEach(c => save(c, { "color": "#ffffff", "-webkit-text-fill-color": "#ffffff" }));
    }

    // CV & LinkedIn badges
    const cvBadge = document.querySelector(".pdf-badge-cv");
    if (cvBadge && !cvBadge.classList.contains("hidden")) {
        save(cvBadge, { "background-color": "#ffffff", "color": "#4c1d95", "-webkit-text-fill-color": "#4c1d95" });
    }
    const liBadge = document.querySelector(".pdf-badge-li");
    if (liBadge && !liBadge.classList.contains("hidden")) {
        save(liBadge, { "background-color": "#ffffff", "color": "#1d4ed8", "-webkit-text-fill-color": "#1d4ed8" });
    }

    // Notes animateur
    const notes = document.querySelector(".pdf-notes");
    if (notes && !notes.classList.contains("hidden")) {
        save(notes, { "background-color": "#fffbeb", "border-color": "#f59e0b" });
        notes.querySelectorAll("p, span").forEach(c => {
            save(c, { "color": "#78350f", "-webkit-text-fill-color": "#78350f", "opacity": "1" });
        });
    }

    // Section titles
    document.querySelectorAll(".pdf-section-title").forEach(h => {
        save(h, { "color": "#1f2937", "-webkit-text-fill-color": "#1f2937" });
    });

    // Subtitle
    const sub = document.querySelector(".pdf-subtitle");
    if (sub) save(sub, { "color": "#6b7280", "-webkit-text-fill-color": "#6b7280" });

    // Sector cards
    document.querySelectorAll("#secteurs-container > div").forEach(card => {
        save(card, { "opacity": "1", "animation": "none" });
        card.querySelectorAll(".font-bold.text-gray-700").forEach(t =>
            save(t, { "color": "#1f2937", "-webkit-text-fill-color": "#1f2937" })
        );
        card.querySelectorAll(".text-gray-400").forEach(t =>
            save(t, { "color": "#6b7280", "-webkit-text-fill-color": "#6b7280" })
        );
        card.querySelectorAll(".text-emerald-700").forEach(t =>
            save(t, { "color": "#047857", "-webkit-text-fill-color": "#047857" })
        );
        card.querySelectorAll(".text-amber-700").forEach(t =>
            save(t, { "color": "#b45309", "-webkit-text-fill-color": "#b45309" })
        );
        card.querySelectorAll(".text-gray-500").forEach(t =>
            save(t, { "color": "#374151", "-webkit-text-fill-color": "#374151" })
        );
        card.querySelectorAll(".bg-emerald-500").forEach(bar =>
            save(bar, { "background-color": "#10b981" })
        );
        card.querySelectorAll(".bg-amber-500").forEach(bar =>
            save(bar, { "background-color": "#f59e0b" })
        );
        card.querySelectorAll(".bg-gray-400").forEach(bar =>
            save(bar, { "background-color": "#9ca3af" })
        );
        card.querySelectorAll(".bg-emerald-50").forEach(c =>
            save(c, { "background-color": "#ecfdf5" })
        );
        card.querySelectorAll(".bg-amber-50").forEach(c =>
            save(c, { "background-color": "#fffbeb" })
        );
        card.querySelectorAll(".bg-gray-50").forEach(c =>
            save(c, { "background-color": "#f9fafb" })
        );
    });

    // Disclaimer
    const disc = document.querySelector(".pdf-disclaimer");
    if (disc) {
        save(disc, { "background-color": "#f5f3ff", "border-color": "#c4b5fd" });
        disc.querySelectorAll("p, strong").forEach(c =>
            save(c, { "color": "#5b21b6", "-webkit-text-fill-color": "#5b21b6", "opacity": "1" })
        );
    }

    return saved;
}

function restorePdfStyles(saved) {
    saved.forEach(({ el, orig }) => { el.style.cssText = orig; });
}
