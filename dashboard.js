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
let currentScores = null;
let currentNotes  = "";

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

    currentScores = scores;
    currentNotes  = notesAnimateur;

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
// Export PDF — génération directe avec jsPDF
// Aucun html2canvas : on dessine chaque élément à la main
// pour garantir des couleurs solides et contrastées.
// ============================================================
function setupExportPDF() {
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        if (!selectedCandidat) return;
        console.log("[PDF-v5] Export lancé — jsPDF direct");
        try {
            generatePDF(selectedCandidat, currentScores, currentNotes);
        } catch (err) {
            console.error("[PDF-v5] Erreur export :", err);
            alert("Erreur PDF : " + err.message);
        }
    });
}
console.log("[PDF-v5] dashboard.js chargé — version jsPDF directe");

// Nettoie une chaîne pour la police Helvetica de jsPDF (WinAnsi/Latin-1)
function cleanText(s) {
    if (!s) return "";
    return String(s)
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}\u{1F000}-\u{1F9FF}]/gu, "")
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/…/g, "...")
        .replace(/—/g, "-")
        .replace(/–/g, "-")
        .replace(/→/g, "->")
        .replace(/ /g, " ")
        .replace(/✓|✔|✅/g, "")
        .replace(/✨|☆|★|✱|❖/g, "*")
        .trim();
}

function generatePDF(candidat, scores, notesAnimateur) {
    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFCtor) throw new Error("jsPDF non disponible");

    const pdf = new jsPDFCtor({ unit: "mm", format: "a4", orientation: "portrait" });
    const PW = 210, PH = 297, M = 12, W = PW - 2 * M;

    let y = M;

    // ═══════════ HEADER ═══════════
    const headerH = 32;
    pdf.setFillColor(76, 29, 149);                          // #4c1d95
    pdf.roundedRect(M, y, W, headerH, 3, 3, "F");

    // Nom
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text(cleanText(`${candidat.prenom||""} ${candidat.nom||""}`), M + 6, y + 11);

    // Sous-titre
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(220, 215, 255);
    pdf.text("Bilan d'orientation - profil et pistes d'accompagnement", M + 6, y + 16.5);

    // Email
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(cleanText(candidat.email || "—"), M + 6, y + 22);

    // Badges (psy, CV, LinkedIn)
    let bx = M + 6;
    const by = y + 25;
    if (candidat.profil_psy) {
        const txt = cleanText(candidat.profil_psy);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        const w = pdf.getTextWidth(txt) + 5;
        pdf.setFillColor(217, 119, 6);                      // #d97706 amber
        pdf.roundedRect(bx, by, w, 5, 1, 1, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.text(txt, bx + 2.5, by + 3.5);
        bx += w + 2;
    }
    if (candidat.cvURL) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        const w = pdf.getTextWidth("CV") + 6;
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(bx, by, w, 5, 1, 1, "F");
        pdf.setTextColor(76, 29, 149);
        pdf.textWithLink("CV", bx + 3, by + 3.5, { url: candidat.cvURL });
        bx += w + 2;
    }
    if (candidat.linkedin) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        const w = pdf.getTextWidth("LinkedIn") + 6;
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(bx, by, w, 5, 1, 1, "F");
        pdf.setTextColor(29, 78, 216);
        pdf.textWithLink("LinkedIn", bx + 3, by + 3.5, { url: candidat.linkedin });
    }

    y += headerH + 5;

    // ═══════════ NOTES ANIMATEUR ═══════════
    if (notesAnimateur) {
        const clean = cleanText(notesAnimateur);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(clean, W - 10);
        const blockH = 6 + lines.length * 4 + 4;

        pdf.setFillColor(255, 251, 235);                    // #fffbeb amber-50
        pdf.setDrawColor(245, 158, 11);                     // #f59e0b
        pdf.setLineWidth(0.3);
        pdf.roundedRect(M, y, W, blockH, 2, 2, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(180, 83, 9);                       // #b45309 amber-700
        pdf.text("NOTES DE L'ANIMATEUR", M + 4, y + 5);

        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 53, 15);                      // #78350f
        pdf.text(lines, M + 4, y + 10);

        y += blockH + 5;
    }

    // ═══════════ RADAR + SECTEURS (2 colonnes) ═══════════
    const colTop  = y;
    const radarW  = 90;
    const radarH  = 100;
    const secX    = M + radarW + 5;
    const secW    = W - radarW - 5;

    // ── Carte radar ──
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, radarW, radarH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Profil des savoir-etre", M + 4, y + 6);

    const hasScores = scores && Object.values(scores).some(v => v > 0);
    if (hasScores && radarChart) {
        // Renforcer le radar avant export, puis restaurer
        const ds = radarChart.data.datasets[0];
        const opts = radarChart.options.scales.r;
        const backup = {
            borderColor: ds.borderColor, borderWidth: ds.borderWidth,
            backgroundColor: ds.backgroundColor, pointBackgroundColor: ds.pointBackgroundColor,
            pointRadius: ds.pointRadius, pointBorderWidth: ds.pointBorderWidth,
            ticksColor: opts.ticks.color, ticksSize: opts.ticks.font.size,
            labelColor: opts.pointLabels.color, labelSize: opts.pointLabels.font.size,
            gridColor: opts.grid.color, angleColor: opts.angleLines.color
        };
        ds.borderColor = "#7c3aed";
        ds.borderWidth = 3;
        ds.backgroundColor = "rgba(124,58,237,0.3)";
        ds.pointBackgroundColor = "#6d28d9";
        ds.pointRadius = 5;
        ds.pointBorderWidth = 2;
        opts.ticks.color = "#6b7280";
        opts.ticks.font.size = 10;
        opts.pointLabels.color = "#1f2937";
        opts.pointLabels.font.size = 10;
        opts.grid.color = "rgba(0,0,0,0.18)";
        opts.angleLines.color = "rgba(0,0,0,0.18)";
        radarChart.update("none");

        const img = radarChart.toBase64Image("image/png", 1.0);
        pdf.addImage(img, "PNG", M + 2, y + 8, radarW - 4, radarH - 14);

        ds.borderColor = backup.borderColor;
        ds.borderWidth = backup.borderWidth;
        ds.backgroundColor = backup.backgroundColor;
        ds.pointBackgroundColor = backup.pointBackgroundColor;
        ds.pointRadius = backup.pointRadius;
        ds.pointBorderWidth = backup.pointBorderWidth;
        opts.ticks.color = backup.ticksColor;
        opts.ticks.font.size = backup.ticksSize;
        opts.pointLabels.color = backup.labelColor;
        opts.pointLabels.font.size = backup.labelSize;
        opts.grid.color = backup.gridColor;
        opts.angleLines.color = backup.angleColor;
        radarChart.update("none");
    } else {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);
        pdf.setTextColor(156, 163, 175);
        pdf.text("Aucune observation enregistree", M + 6, y + radarH / 2);
    }

    // Légende sous le radar
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    pdf.text("Tendances issues d'une seance de jeu.", M + 4, y + radarH - 3);

    // ── Cartes secteurs ──
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Pistes d'orientation", secX, y + 6);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    pdf.text("Suggestions pour ouvrir la discussion - pas des verdicts.", secX, y + 10);

    const sorted = [...SECTEURS].map(s => ({
        ...s,
        pct: scores ? Math.round(s.competences.reduce((sum, k) => sum + (scores[k] || 0), 0) / 15 * 100) : 0
    })).sort((a, b) => b.pct - a.pct);

    let sy = y + 13;
    const cardH = 21;

    sorted.forEach(s => {
        let bg, txt, bar, msg;
        if (s.pct > 75) {
            bg  = [236, 253, 245];   // emerald-50
            txt = [4, 120, 87];      // emerald-700
            bar = [16, 185, 129];    // emerald-500
            msg = "Forte affinite";
        } else if (s.pct >= 50) {
            bg  = [255, 251, 235];   // amber-50
            txt = [180, 83, 9];      // amber-700
            bar = [245, 158, 11];    // amber-500
            msg = "Affinite moderee";
        } else {
            bg  = [249, 250, 251];   // gray-50
            txt = [75, 85, 99];      // gray-600
            bar = [156, 163, 175];   // gray-400
            msg = "A explorer";
        }

        pdf.setFillColor(bg[0], bg[1], bg[2]);
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(secX, sy, secW, cardH, 2, 2, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(31, 41, 55);
        pdf.text(cleanText(s.nom), secX + 3, sy + 5);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(txt[0], txt[1], txt[2]);
        const pctTxt = s.pct + "%";
        const pctW = pdf.getTextWidth(pctTxt);
        pdf.text(pctTxt, secX + secW - pctW - 3, sy + 6);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(txt[0], txt[1], txt[2]);
        const mw = pdf.getTextWidth(msg);
        pdf.text(msg, secX + secW - mw - 3, sy + 10);

        // Description
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(107, 114, 128);
        pdf.text(cleanText(s.description), secX + 3, sy + 10);

        // Barre de progression
        const barX = secX + 3;
        const barY = sy + 13;
        const barW = secW - 6;
        pdf.setFillColor(229, 231, 235);
        pdf.roundedRect(barX, barY, barW, 2, 1, 1, "F");
        if (s.pct > 0) {
            pdf.setFillColor(bar[0], bar[1], bar[2]);
            pdf.roundedRect(barX, barY, barW * (s.pct / 100), 2, 1, 1, "F");
        }

        // Labels
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(107, 114, 128);
        const tagsText = s.labels.map(cleanText).join(" - ");
        pdf.text(tagsText, secX + 3, sy + 18);

        sy += cardH + 2;
    });

    y = colTop + Math.max(radarH, sy - colTop) + 5;

    // ═══════════ DISCLAIMER ═══════════
    const disclaimerText = "Ce bilan est un outil de mediation, pas de classement. Les observations sont subjectives, liees au contexte d'une seance de jeu. Elles servent de point de depart pour accompagner le jeune dans son orientation, et peuvent etre ajustees a tout moment.";
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const dlines = pdf.splitTextToSize(disclaimerText, W - 14);
    const discH = 6 + dlines.length * 3.5 + 3;

    if (y + discH > PH - M) y = PH - M - discH;

    pdf.setFillColor(245, 243, 255);                        // #f5f3ff
    pdf.setDrawColor(196, 181, 253);                        // #c4b5fd
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, W, discH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(91, 33, 182);                          // #5b21b6
    pdf.text("RAPPEL", M + 4, y + 5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(91, 33, 182);
    pdf.text(dlines, M + 4, y + 9);

    // Pied de page
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(156, 163, 175);
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    pdf.text(`SoftSkill Observer - Genere le ${dateStr}`, PW / 2, PH - 5, { align: "center" });

    pdf.save(`Bilan_${cleanText(candidat.prenom||"")}_${cleanText(candidat.nom||"")}.pdf`);
}
