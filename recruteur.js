// ============================================================
// Recruteur — Espace recruteur / bilan comparatif
// Firebase is initialized by firebase-config.js (db)
// ============================================================

// ============================================================
// Referentiel
// ============================================================
const SAVOIR_ETRE = [
    "Capacité d'adaptation", "Gestion du stress", "Travail en équipe",
    "Communication", "Écoute active", "Leadership", "Créativité",
    "Esprit critique", "Prise de décision", "Gestion des conflits",
    "Autonomie", "Rigueur", "Empathie", "Persévérance"
];

const LABELS_QUALITATIFS = ["", "En émergence", "En développement", "Observé", "Bien observé", "Point fort"];

// Score colors: 1=red-500, 2=orange-500, 3=yellow-500, 4=emerald-500, 5=violet-500
const SCORE_COLORS = {
    1: { bg: "#fef2f2", text: "#ef4444", border: "#fecaca" },
    2: { bg: "#fff7ed", text: "#f97316", border: "#fed7aa" },
    3: { bg: "#fefce8", text: "#eab308", border: "#fef08a" },
    4: { bg: "#ecfdf5", text: "#10b981", border: "#a7f3d0" },
    5: { bg: "#f5f3ff", text: "#8b5cf6", border: "#ddd6fe" }
};

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
// State
// ============================================================
let allCandidats = [];
let radarChart = null;
let selectedCandidat = null;
let currentScoresAnimateur = null;
let currentScoresCandidat = null;
let currentNotes = "";

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
// Select candidate
// ============================================================
async function selectCandidat(id, liEl) {
    document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("active"));
    liEl.classList.add("active");

    const candidat = allCandidats.find(c => c.id === id);
    if (!candidat) return;
    selectedCandidat = candidat;

    // Get animateur scores from observations sub-collection
    let scoresAnimateur = null;
    let notesAnimateur = "";
    try {
        const snap = await db.collection("candidats").doc(id)
            .collection("observations").orderBy("dateObservation", "desc").limit(1).get();
        if (!snap.empty) {
            const data = snap.docs[0].data();
            scoresAnimateur = data.scores || data.scores_animateur || null;
            notesAnimateur = data.notesAnimateur || "";
        }
    } catch (err) {
        console.error("Erreur chargement observation :", err);
    }

    // Fallback: dernieresNotesAnimateur or dernieresNotes on main doc
    if (!scoresAnimateur && candidat.dernieresNotesAnimateur) {
        scoresAnimateur = candidat.dernieresNotesAnimateur;
    }
    if (!scoresAnimateur && candidat.dernieresNotes) {
        scoresAnimateur = candidat.dernieresNotes;
    }
    if (!notesAnimateur && candidat.notesAnimateur) {
        notesAnimateur = candidat.notesAnimateur;
    }

    // Get candidate self-evaluation scores
    let scoresCandidat = candidat.scores_candidat || null;

    currentScoresAnimateur = scoresAnimateur;
    currentScoresCandidat = scoresCandidat;
    currentNotes = notesAnimateur;

    renderBilan(candidat, scoresAnimateur, scoresCandidat, notesAnimateur);
}

// ============================================================
// Render bilan
// ============================================================
function renderBilan(candidat, scoresAnimateur, scoresCandidat, notesAnimateur) {
    document.getElementById("empty-state").classList.add("hidden");
    const container = document.getElementById("bilan-container");
    container.classList.remove("hidden");
    container.style.animation = "none";
    void container.offsetWidth;
    container.style.animation = "fadeUp 0.4s ease forwards";

    // Header
    document.getElementById("bilan-prenom").textContent = candidat.prenom || "";
    document.getElementById("bilan-nom").textContent = candidat.nom || "";
    document.getElementById("bilan-email").textContent = candidat.email || "—";

    // Psy badge
    const psyBadge = document.getElementById("bilan-psy-badge");
    if (candidat.profil_psy) {
        document.getElementById("bilan-profil-psy").textContent = candidat.profil_psy;
        psyBadge.classList.remove("hidden");
        psyBadge.classList.add("inline-flex");
    } else {
        psyBadge.classList.add("hidden");
        psyBadge.classList.remove("inline-flex");
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
    if (candidat.cvURL) {
        btnCv.href = candidat.cvURL;
        btnCv.classList.remove("hidden");
        btnCv.classList.add("inline-flex");
    } else {
        btnCv.classList.add("hidden");
        btnCv.classList.remove("inline-flex");
    }

    // LinkedIn
    const btnLi = document.getElementById("btn-linkedin");
    if (candidat.linkedin) {
        btnLi.href = candidat.linkedin;
        btnLi.classList.remove("hidden");
        btnLi.classList.add("inline-flex");
    } else {
        btnLi.classList.add("hidden");
        btnLi.classList.remove("inline-flex");
    }

    // 16 Personalities
    const btnPers = document.getElementById("btn-personality");
    if (candidat.personalityLink) {
        btnPers.href = candidat.personalityLink;
        btnPers.classList.remove("hidden");
        btnPers.classList.add("inline-flex");
    } else {
        btnPers.classList.add("hidden");
        btnPers.classList.remove("inline-flex");
    }

    renderComparativeTable(scoresCandidat, scoresAnimateur);
    renderRadar(scoresAnimateur);
    renderSecteurs(scoresAnimateur);
}

// ============================================================
// Comparative Table (star feature)
// ============================================================
function getScorePillHTML(score) {
    if (!score || score === 0) {
        return '<span class="score-pill bg-gray-100 text-gray-400 border border-gray-200">—</span>';
    }
    const label = LABELS_QUALITATIFS[score] || "—";
    const colors = SCORE_COLORS[score] || { bg: "#f3f4f6", text: "#9ca3af", border: "#e5e7eb" };
    return `<span class="score-pill" style="background:${colors.bg};color:${colors.text};border:1px solid ${colors.border}">
        <span class="w-1.5 h-1.5 rounded-full" style="background:${colors.text}"></span>
        ${score}/5 · ${label}
    </span>`;
}

function getEcartBadgeHTML(scoreCandidat, scoreAnimateur) {
    if ((!scoreCandidat || scoreCandidat === 0) || (!scoreAnimateur || scoreAnimateur === 0)) {
        return '<span class="ecart-badge bg-gray-100 text-gray-400">—</span>';
    }
    const ecart = Math.abs(scoreCandidat - scoreAnimateur);
    let cls = "ecart-green";
    if (ecart >= 3) cls = "ecart-red";
    else if (ecart === 2) cls = "ecart-amber";

    const sign = scoreAnimateur > scoreCandidat ? "+" : (scoreAnimateur < scoreCandidat ? "-" : "");
    return `<span class="ecart-badge ${cls}">${sign}${ecart}</span>`;
}

function renderComparativeTable(scoresCandidat, scoresAnimateur) {
    const tbody = document.getElementById("comp-table-body");
    const emptyMsg = document.getElementById("comp-table-empty");
    const hasCandidat = scoresCandidat && Object.values(scoresCandidat).some(v => v > 0);
    const hasAnimateur = scoresAnimateur && Object.values(scoresAnimateur).some(v => v > 0);

    if (!hasCandidat && !hasAnimateur) {
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
        const sa = (scoresAnimateur && scoresAnimateur[skill]) || 0;

        const tr = document.createElement("tr");
        tr.className = idx % 2 === 0 ? "bg-white" : "bg-gray-50/50";
        tr.innerHTML = `
            <td class="px-5 py-3 font-medium text-gray-700 text-[13px]">${skill}</td>
            <td class="px-4 py-3 text-center">${getScorePillHTML(sc)}</td>
            <td class="px-4 py-3 text-center">${getScorePillHTML(sa)}</td>
            <td class="px-4 py-3 text-center">${getEcartBadgeHTML(sc, sa)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================
// Radar Chart
// ============================================================
function renderRadar(scores) {
    const canvas = document.getElementById("radar-chart");
    const noMsg = document.getElementById("no-observation-msg");

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
            labels: SAVOIR_ETRE.map(l => l.length > 14 ? l.slice(0, 12) + "…" : l),
            datasets: [{
                label: "Observation animateur",
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
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        .replace(/…/g, "...")
        .replace(/—/g, "-")
        .replace(/–/g, "-")
        .replace(/→/g, "->")
        .replace(/ /g, " ")
        .replace(/[✓✔✅]/g, "")
        .replace(/[✨☆★✱❖]/g, "*")
        .replace(/é/g, "e").replace(/è/g, "e").replace(/ê/g, "e").replace(/ë/g, "e")
        .replace(/É/g, "E").replace(/È/g, "E").replace(/Ê/g, "E")
        .replace(/à/g, "a").replace(/â/g, "a").replace(/ä/g, "a")
        .replace(/À/g, "A").replace(/Â/g, "A")
        .replace(/ù/g, "u").replace(/û/g, "u").replace(/ü/g, "u")
        .replace(/î/g, "i").replace(/ï/g, "i")
        .replace(/ô/g, "o").replace(/ö/g, "o")
        .replace(/ç/g, "c").replace(/Ç/g, "C")
        .replace(/'/g, "'")
        .trim();
}

function setupExportPDF() {
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        if (!selectedCandidat) return;
        try {
            generatePDF(selectedCandidat, currentScoresAnimateur, currentScoresCandidat, currentNotes);
        } catch (err) {
            console.error("Erreur export PDF :", err);
            alert("Erreur PDF : " + err.message);
        }
    });
}

function generatePDF(candidat, scoresAnimateur, scoresCandidat, notesAnimateur) {
    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFCtor) throw new Error("jsPDF non disponible");

    const pdf = new jsPDFCtor({ unit: "mm", format: "a4", orientation: "portrait" });
    const PW = 210, PH = 297, M = 12, W = PW - 2 * M;
    let y = M;

    // ---- HEADER ----
    const headerH = 28;
    pdf.setFillColor(76, 29, 149);
    pdf.roundedRect(M, y, W, headerH, 3, 3, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(cleanText(`${candidat.prenom || ""} ${candidat.nom || ""}`), M + 6, y + 10);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(220, 215, 255);
    pdf.text("Bilan comparatif - Espace recruteur", M + 6, y + 15.5);

    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(cleanText(candidat.email || "-"), M + 6, y + 21);

    // Badges
    let bx = M + 6;
    const by = y + 24;
    if (candidat.profil_psy) {
        const txt = cleanText(candidat.profil_psy);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        const w = pdf.getTextWidth(txt) + 5;
        pdf.setFillColor(217, 119, 6);
        pdf.roundedRect(bx, by, w, 4, 1, 1, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.text(txt, bx + 2.5, by + 3);
        bx += w + 2;
    }
    if (candidat.cvURL) {
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        const w = pdf.getTextWidth("CV") + 5;
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(bx, by, w, 4, 1, 1, "F");
        pdf.setTextColor(76, 29, 149);
        pdf.textWithLink("CV", bx + 2.5, by + 3, { url: candidat.cvURL });
        bx += w + 2;
    }
    if (candidat.linkedin) {
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        const w = pdf.getTextWidth("LinkedIn") + 5;
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(bx, by, w, 4, 1, 1, "F");
        pdf.setTextColor(29, 78, 216);
        pdf.textWithLink("LinkedIn", bx + 2.5, by + 3, { url: candidat.linkedin });
    }
    y += headerH + 4;

    // ---- ANIMATEUR NOTES ----
    if (notesAnimateur) {
        const clean = cleanText(notesAnimateur);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        const lines = pdf.splitTextToSize(clean, W - 10);
        const blockH = 6 + lines.length * 3.5 + 3;

        pdf.setFillColor(255, 251, 235);
        pdf.setDrawColor(245, 158, 11);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(M, y, W, blockH, 2, 2, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(180, 83, 9);
        pdf.text("NOTES DE L'ANIMATEUR", M + 4, y + 4.5);

        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(120, 53, 15);
        pdf.text(lines, M + 4, y + 9);

        y += blockH + 4;
    }

    // ---- COMPARATIVE TABLE ----
    const hasCandidat = scoresCandidat && Object.values(scoresCandidat).some(v => v > 0);
    const hasAnimateur = scoresAnimateur && Object.values(scoresAnimateur).some(v => v > 0);

    if (hasCandidat || hasAnimateur) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(31, 41, 55);
        pdf.text("Tableau comparatif des savoir-etre", M, y + 4);
        y += 7;

        // Table header
        const colX = [M, M + 56, M + 98, M + 140, M + 170];
        const colLabels = ["Savoir-etre", "Auto-eval.", "Observation", "Label", "Ecart"];
        const rowH = 6;

        pdf.setFillColor(243, 244, 246);
        pdf.rect(M, y, W, rowH, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(75, 85, 99);
        colLabels.forEach((label, i) => {
            pdf.text(label, colX[i] + 2, y + 4);
        });
        y += rowH;

        SAVOIR_ETRE.forEach((skill, idx) => {
            const sc = (scoresCandidat && scoresCandidat[skill]) || 0;
            const sa = (scoresAnimateur && scoresAnimateur[skill]) || 0;

            // Alternate row background
            if (idx % 2 === 0) {
                pdf.setFillColor(249, 250, 251);
                pdf.rect(M, y, W, rowH, "F");
            }

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7);
            pdf.setTextColor(55, 65, 81);
            pdf.text(cleanText(skill), colX[0] + 2, y + 4);

            // Candidate score
            if (sc > 0) {
                pdf.setTextColor(55, 65, 81);
                pdf.text(`${sc}/5`, colX[1] + 2, y + 4);
            } else {
                pdf.setTextColor(156, 163, 175);
                pdf.text("-", colX[1] + 2, y + 4);
            }

            // Animateur score
            if (sa > 0) {
                pdf.setTextColor(55, 65, 81);
                pdf.text(`${sa}/5`, colX[2] + 2, y + 4);
            } else {
                pdf.setTextColor(156, 163, 175);
                pdf.text("-", colX[2] + 2, y + 4);
            }

            // Label
            const labelTxt = sa > 0 ? cleanText(LABELS_QUALITATIFS[sa]) : (sc > 0 ? cleanText(LABELS_QUALITATIFS[sc]) : "-");
            pdf.setTextColor(107, 114, 128);
            pdf.setFontSize(6.5);
            pdf.text(labelTxt, colX[3] + 2, y + 4);

            // Ecart
            pdf.setFontSize(7);
            if (sc > 0 && sa > 0) {
                const ecart = Math.abs(sc - sa);
                if (ecart <= 1) {
                    pdf.setFillColor(209, 250, 229); pdf.setTextColor(6, 95, 70);
                } else if (ecart === 2) {
                    pdf.setFillColor(254, 243, 199); pdf.setTextColor(146, 64, 14);
                } else {
                    pdf.setFillColor(254, 226, 226); pdf.setTextColor(153, 27, 27);
                }
                const ecartW = 10;
                pdf.roundedRect(colX[4] + 2, y + 0.5, ecartW, 5, 1, 1, "F");
                const sign = sa > sc ? "+" : (sa < sc ? "-" : "");
                pdf.text(`${sign}${ecart}`, colX[4] + 4, y + 4);
            } else {
                pdf.setTextColor(156, 163, 175);
                pdf.text("-", colX[4] + 4, y + 4);
            }

            y += rowH;

            // Page break check
            if (y > PH - 40) {
                pdf.addPage();
                y = M;
            }
        });

        y += 4;
    }

    // ---- RADAR + SECTORS (2 columns) ----
    // Check if we need a new page
    if (y > PH - 110) {
        pdf.addPage();
        y = M;
    }

    const colTop = y;
    const radarW = 90;
    const radarH = 90;
    const secX = M + radarW + 5;
    const secW = W - radarW - 5;

    // Radar card
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, radarW, radarH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Profil des savoir-etre", M + 4, y + 6);

    const hasScores = scoresAnimateur && Object.values(scoresAnimateur).some(v => v > 0);
    if (hasScores && radarChart) {
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
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text("Aucune observation enregistree", M + 6, y + radarH / 2);
    }

    // Sectors
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55);
    pdf.text("Pistes d'orientation", secX, y + 6);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(107, 114, 128);
    pdf.text("Suggestions - pas des verdicts.", secX, y + 10);

    const sorted = [...SECTEURS].map(s => ({
        ...s,
        pct: scoresAnimateur ? Math.round(s.competences.reduce((sum, k) => sum + (scoresAnimateur[k] || 0), 0) / 15 * 100) : 0
    })).sort((a, b) => b.pct - a.pct);

    let sy = y + 13;
    const cardH = 19;

    sorted.forEach(s => {
        let bg, txt, bar, msg;
        if (s.pct > 75) {
            bg = [236, 253, 245]; txt = [4, 120, 87]; bar = [16, 185, 129]; msg = "Forte affinite";
        } else if (s.pct >= 50) {
            bg = [255, 251, 235]; txt = [180, 83, 9]; bar = [245, 158, 11]; msg = "Affinite moderee";
        } else {
            bg = [249, 250, 251]; txt = [75, 85, 99]; bar = [156, 163, 175]; msg = "A explorer";
        }

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

        // Progress bar
        const barX = secX + 3;
        const barY = sy + 11.5;
        const barW = secW - 6;
        pdf.setFillColor(229, 231, 235);
        pdf.roundedRect(barX, barY, barW, 2, 1, 1, "F");
        if (s.pct > 0) {
            pdf.setFillColor(bar[0], bar[1], bar[2]);
            pdf.roundedRect(barX, barY, barW * (s.pct / 100), 2, 1, 1, "F");
        }

        // Labels
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(107, 114, 128);
        pdf.text(s.labels.map(cleanText).join(" - "), secX + 3, sy + 17);

        sy += cardH + 2;
    });

    y = colTop + Math.max(radarH, sy - colTop) + 5;

    // ---- DISCLAIMER ----
    if (y > PH - 25) {
        pdf.addPage();
        y = M;
    }

    const disclaimerText = "Ce bilan est un outil de mediation, pas de classement. Les observations sont subjectives, liees au contexte d'une seance de jeu. Elles servent de point de depart pour accompagner le jeune dans son orientation.";
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
    pdf.text(`SoftSkill Observer - Espace recruteur - Genere le ${dateStr}`, PW / 2, PH - 5, { align: "center" });

    pdf.save(`Bilan_Recruteur_${cleanText(candidat.prenom || "")}_${cleanText(candidat.nom || "")}.pdf`);
}
