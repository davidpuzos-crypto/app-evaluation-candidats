// ============================================================
// Firebase : Configuration et initialisation
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyBLMERKeQ9AnU4uRc2XRcWja7ZRqi7arNE",
    authDomain: "app-evaluation-candidats.firebaseapp.com",
    projectId: "app-evaluation-candidats",
    storageBucket: "app-evaluation-candidats.firebasestorage.app",
    messagingSenderId: "521001892400",
    appId: "1:521001892400:web:YOUR_APP_ID",
    measurementId: "G-XXXXXXXXXX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================================
// Référentiel des 14 savoir-être (labels du radar)
// ============================================================
const SAVOIR_ETRE = [
    "Capacité d'adaptation",
    "Gestion du stress",
    "Travail en équipe",
    "Communication",
    "Écoute active",
    "Leadership",
    "Créativité",
    "Esprit critique",
    "Prise de décision",
    "Gestion des conflits",
    "Autonomie",
    "Rigueur",
    "Empathie",
    "Persévérance"
];

// ============================================================
// Matching Secteurs d'activité
// Formule : (Score1 + Score2 + Score3) / 15 * 100
//
// Mapping vers les champs Firestore (dernieresNotes) :
//   Sens de l'organisation  → Prise de décision
//   Réactivité              → Gestion des conflits
//   Sens de la communication→ Communication
//   Force de proposition    → Esprit critique
//   Curiosité               → Créativité
//   Capacité à fédérer      → Leadership
// ============================================================
const SECTEURS = [
    {
        nom: "Aéronautique",
        icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
        emoji: "✈️",
        competences: ["Rigueur", "Gestion du stress", "Prise de décision"],
        labels: ["Rigueur", "Gestion du stress", "Sens de l'organisation"]
    },
    {
        nom: "Restauration",
        icon: "M3 3h18v18H3zM12 8v4m0 0v4m0-4h4m-4 0H8",
        emoji: "🍽️",
        competences: ["Gestion des conflits", "Travail en équipe", "Communication"],
        labels: ["Réactivité", "Travail en équipe", "Sens de la communication"]
    },
    {
        nom: "Bâtiment",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        emoji: "🏗️",
        competences: ["Persévérance", "Autonomie", "Capacité d'adaptation"],
        labels: ["Persévérance", "Autonomie", "Capacité d'adaptation"]
    },
    {
        nom: "Audio-visuel",
        icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
        emoji: "🎬",
        competences: ["Esprit critique", "Créativité", "Leadership"],
        labels: ["Force de proposition", "Curiosité", "Capacité à fédérer"]
    }
];

// ============================================================
// État global
// ============================================================
let allCandidats = [];
let radarChart = null;
let selectedCandidat = null;

// ============================================================
// Initialisation
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    loadCandidats();
    setupSearch();
    setupExportPDF();
});

// ============================================================
// Chargement des candidats depuis Firestore
// ============================================================
async function loadCandidats() {
    const list = document.getElementById("candidat-list");
    const counter = document.getElementById("candidat-count");

    try {
        const snapshot = await db.collection("candidats")
            .orderBy("dateInscription", "desc")
            .get();

        allCandidats = [];
        snapshot.forEach(doc => {
            allCandidats.push({ id: doc.id, ...doc.data() });
        });

        counter.textContent = `${allCandidats.length} candidat(s)`;
        renderCandidatList(allCandidats);
    } catch (error) {
        console.error("Erreur chargement candidats :", error);
        list.innerHTML = '<li class="p-4 text-red-500 text-sm text-center">Erreur de chargement</li>';
    }
}

// ============================================================
// Rendu de la liste sidebar
// ============================================================
function renderCandidatList(candidats) {
    const list = document.getElementById("candidat-list");

    if (candidats.length === 0) {
        list.innerHTML = '<li class="p-6 text-center text-gray-400 text-sm">Aucun candidat trouvé</li>';
        return;
    }

    list.innerHTML = "";
    candidats.forEach(c => {
        const li = document.createElement("li");
        li.className = "sidebar-item border-l-4 border-transparent cursor-pointer px-5 py-4";
        li.setAttribute("data-id", c.id);

        // Formater la date
        let dateStr = "—";
        if (c.dateDerniereObservation) {
            const d = c.dateDerniereObservation.toDate ? c.dateDerniereObservation.toDate() : new Date(c.dateDerniereObservation);
            dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
        } else if (c.dateInscription) {
            const d = c.dateInscription.toDate ? c.dateInscription.toDate() : new Date(c.dateInscription);
            dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
        }

        const initiales = ((c.prenom || "")[0] || "") + ((c.nom || "")[0] || "");

        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    ${initiales.toUpperCase()}
                </div>
                <div class="min-w-0 flex-1">
                    <p class="font-semibold text-gray-800 text-sm truncate">${c.prenom || ""} ${c.nom || ""}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-gray-400">${dateStr}</span>
                        ${c.profil_psy ? `<span class="text-xs font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">${c.profil_psy}</span>` : ""}
                    </div>
                </div>
                <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
        `;

        li.addEventListener("click", () => selectCandidat(c.id, li));
        list.appendChild(li);
    });
}

// ============================================================
// Recherche instantanée
// ============================================================
function setupSearch() {
    const input = document.getElementById("search-input");
    input.addEventListener("input", () => {
        const q = input.value.toLowerCase().trim();
        if (!q) {
            renderCandidatList(allCandidats);
            document.getElementById("candidat-count").textContent = `${allCandidats.length} candidat(s)`;
            return;
        }
        const filtered = allCandidats.filter(c =>
            `${c.prenom} ${c.nom} ${c.email} ${c.profil_psy || ""}`.toLowerCase().includes(q)
        );
        renderCandidatList(filtered);
        document.getElementById("candidat-count").textContent = `${filtered.length} résultat(s)`;
    });
}

// ============================================================
// Sélection d'un candidat
// ============================================================
async function selectCandidat(id, liEl) {
    // Surbrillance
    document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("active"));
    liEl.classList.add("active");

    const candidat = allCandidats.find(c => c.id === id);
    if (!candidat) return;
    selectedCandidat = candidat;

    // Récupérer la dernière observation
    let scores = null;
    try {
        const obsSnap = await db.collection("candidats").doc(id)
            .collection("observations")
            .orderBy("dateObservation", "desc")
            .limit(1)
            .get();
        if (!obsSnap.empty) {
            scores = obsSnap.docs[0].data().scores;
        }
    } catch (err) {
        console.error("Erreur chargement observation :", err);
    }

    // Fallback sur dernieresNotes
    if (!scores && candidat.dernieresNotes) {
        scores = candidat.dernieresNotes;
    }

    renderBilan(candidat, scores);
}

// ============================================================
// Rendu du bilan complet
// ============================================================
function renderBilan(candidat, scores) {
    document.getElementById("empty-state").classList.add("hidden");
    document.getElementById("bilan-container").classList.remove("hidden");

    // En-tête
    document.getElementById("bilan-prenom").textContent = candidat.prenom || "";
    document.getElementById("bilan-nom").textContent = candidat.nom || "";
    document.getElementById("bilan-email").textContent = candidat.email || "—";
    document.getElementById("bilan-profil-psy").textContent = candidat.profil_psy || "Non renseigné";

    // Bouton CV
    const btnCv = document.getElementById("btn-cv");
    if (candidat.cvURL) {
        btnCv.href = candidat.cvURL;
        btnCv.classList.remove("hidden");
        btnCv.classList.add("inline-flex");
    } else {
        btnCv.classList.add("hidden");
        btnCv.classList.remove("inline-flex");
    }

    // Bouton LinkedIn
    const btnLi = document.getElementById("btn-linkedin");
    if (candidat.linkedin) {
        btnLi.href = candidat.linkedin;
        btnLi.classList.remove("hidden");
        btnLi.classList.add("inline-flex");
    } else {
        btnLi.classList.add("hidden");
        btnLi.classList.remove("inline-flex");
    }

    // Graphique radar
    renderRadar(scores);

    // Matching secteurs
    renderSecteurs(scores);
}

// ============================================================
// Radar Chart (Chart.js)
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

    const data = SAVOIR_ETRE.map(s => scores[s] || 0);

    // Détruire l'instance précédente pour éviter la superposition
    if (radarChart) {
        radarChart.destroy();
        radarChart = null;
    }

    radarChart = new Chart(canvas, {
        type: "radar",
        data: {
            labels: SAVOIR_ETRE.map(l => l.length > 16 ? l.slice(0, 14) + "…" : l),
            datasets: [{
                label: "Notes (/5)",
                data: data,
                backgroundColor: "rgba(124, 58, 237, 0.15)",
                borderColor: "rgba(124, 58, 237, 0.7)",
                borderWidth: 2.5,
                pointBackgroundColor: "rgba(124, 58, 237, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        font: { size: 10 },
                        backdropColor: "transparent"
                    },
                    pointLabels: {
                        font: { size: 10, weight: "500" },
                        color: "#6b7280"
                    },
                    grid: { color: "rgba(0,0,0,0.06)" },
                    angleLines: { color: "rgba(0,0,0,0.06)" }
                }
            },
            animation: { duration: 500 }
        },
        plugins: [{
            // Plugin pour fond blanc opaque (nécessaire pour l'export PDF)
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
// Matching Secteurs : barres de progression
// Formule : (S1 + S2 + S3) / 15 * 100
// Couleur : Rouge < 50% | Jaune 50-75% | Vert > 75%
// ============================================================
function calculateSectorMatch(scores, secteur) {
    if (!scores) return 0;
    let sum = 0;
    secteur.competences.forEach(comp => {
        sum += (scores[comp] || 0);
    });
    return Math.round((sum / 15) * 100);
}

function getBarColor(pct) {
    if (pct > 75) return { bg: "bg-green-100", fill: "bg-green-500", text: "text-green-700", badge: "bg-green-50 text-green-600" };
    if (pct >= 50) return { bg: "bg-yellow-100", fill: "bg-yellow-500", text: "text-yellow-700", badge: "bg-yellow-50 text-yellow-600" };
    return { bg: "bg-red-100", fill: "bg-red-500", text: "text-red-700", badge: "bg-red-50 text-red-600" };
}

function renderSecteurs(scores) {
    const container = document.getElementById("secteurs-container");
    container.innerHTML = "";

    SECTEURS.forEach(secteur => {
        const pct = calculateSectorMatch(scores, secteur);
        const colors = getBarColor(pct);

        const block = document.createElement("div");
        block.className = "bg-gray-50 rounded-xl p-4 border border-gray-100";

        const labelsHtml = secteur.labels.map(l => `<span class="text-xs ${colors.badge} px-2 py-0.5 rounded-full font-medium">${l}</span>`).join("");

        block.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${secteur.emoji}</span>
                    <span class="font-semibold text-gray-800 text-sm">${secteur.nom}</span>
                </div>
                <span class="text-lg font-extrabold ${colors.text}">${pct}%</span>
            </div>
            <div class="w-full ${colors.bg} rounded-full h-3 mb-2">
                <div class="progress-fill ${colors.fill} h-3 rounded-full" style="width: 0%"></div>
            </div>
            <div class="flex flex-wrap gap-1.5">
                ${labelsHtml}
            </div>
        `;

        container.appendChild(block);

        // Animer la barre après insertion dans le DOM
        requestAnimationFrame(() => {
            const bar = block.querySelector(".progress-fill");
            bar.style.width = pct + "%";
        });
    });
}

// ============================================================
// Export PDF (html2pdf.js)
// ============================================================
function setupExportPDF() {
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        if (!selectedCandidat) return;

        const element = document.getElementById("bilan-container");
        const btnPdf = document.getElementById("btn-export-pdf");

        // Cacher le bouton PDF pour ne pas l'imprimer
        btnPdf.style.display = "none";

        const filename = `Bilan_${selectedCandidat.prenom || ""}_${selectedCandidat.nom || ""}.pdf`;

        const opt = {
            margin:      10,
            filename:    filename,
            image:       { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
            jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // Réafficher le bouton après export
            btnPdf.style.display = "";
        });
    });
}
