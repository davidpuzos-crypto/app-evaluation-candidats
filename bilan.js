// ============================================================
// Firebase : Initialisation + Authentification anonyme
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
const auth = firebase.auth();

// Authentification anonyme pour sécuriser l'accès en lecture
auth.signInAnonymously().catch(err => {
    console.error("Erreur d'authentification anonyme :", err);
});

// ============================================================
// Référentiel des 14 savoir-être (identique à app.js)
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
// Chaque secteur a des compétences clés pondérées (poids sur 1)
// ============================================================
const SECTEURS = [
    {
        nom: "Aéronautique",
        icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
        color: "indigo",
        competences: {
            "Rigueur": 0.40,
            "Gestion du stress": 0.35,
            "Prise de décision": 0.25
        }
    },
    {
        nom: "Restauration",
        icon: "M3 3h18v18H3zM12 8v4m0 0v4m0-4h4m-4 0H8",
        color: "orange",
        competences: {
            "Capacité d'adaptation": 0.30,
            "Travail en équipe": 0.40,
            "Communication": 0.30
        }
    },
    {
        nom: "Bâtiment",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        color: "amber",
        competences: {
            "Persévérance": 0.35,
            "Autonomie": 0.35,
            "Capacité d'adaptation": 0.30
        }
    },
    {
        nom: "Audio-visuel",
        icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
        color: "pink",
        competences: {
            "Créativité": 0.35,
            "Esprit critique": 0.30,
            "Leadership": 0.35
        }
    }
];

// Palette pour les barres de progression
const COLOR_MAP = {
    indigo: { bg: "bg-indigo-100", fill: "bg-indigo-500", text: "text-indigo-700" },
    orange: { bg: "bg-orange-100", fill: "bg-orange-500", text: "text-orange-700" },
    amber:  { bg: "bg-amber-100",  fill: "bg-amber-500",  text: "text-amber-700"  },
    pink:   { bg: "bg-pink-100",   fill: "bg-pink-500",   text: "text-pink-700"   }
};

// ============================================================
// État global
// ============================================================
let allCandidats = [];
let radarChart = null;

// ============================================================
// Initialisation au chargement
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            loadCandidats();
        }
    });
    setupSearch();
    setupExportPDF();
});

// ============================================================
// Chargement des candidats dans la sidebar
// ============================================================
async function loadCandidats() {
    const list = document.getElementById("candidat-list");
    try {
        const snapshot = await db.collection("candidats").orderBy("dateInscription", "desc").get();
        allCandidats = [];
        snapshot.forEach(doc => {
            allCandidats.push({ id: doc.id, ...doc.data() });
        });
        renderCandidatList(allCandidats);
    } catch (error) {
        console.error("Erreur chargement candidats :", error);
        list.innerHTML = '<div class="p-4 text-red-500 text-sm">Erreur de chargement.</div>';
    }
}

function renderCandidatList(candidats) {
    const list = document.getElementById("candidat-list");
    if (candidats.length === 0) {
        list.innerHTML = '<div class="p-6 text-center text-gray-400 text-sm">Aucun candidat trouvé.</div>';
        return;
    }
    list.innerHTML = "";
    candidats.forEach(c => {
        const item = document.createElement("button");
        item.className = "sidebar-item w-full text-left px-4 py-3 border-l-4 border-transparent flex items-center gap-3";
        item.setAttribute("data-id", c.id);

        const initiales = ((c.prenom || "")[0] || "") + ((c.nom || "")[0] || "");
        item.innerHTML = `
            <span class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">${initiales.toUpperCase()}</span>
            <div class="min-w-0">
                <p class="font-medium text-gray-800 text-sm truncate">${c.prenom} ${c.nom}</p>
                <p class="text-xs text-gray-400 truncate">${c.profil_psy || "—"}</p>
            </div>
        `;
        item.addEventListener("click", () => selectCandidat(c.id, item));
        list.appendChild(item);
    });
}

// ============================================================
// Recherche instantanée dans la sidebar
// ============================================================
function setupSearch() {
    const input = document.getElementById("search-candidat");
    input.addEventListener("input", () => {
        const q = input.value.toLowerCase().trim();
        if (!q) {
            renderCandidatList(allCandidats);
            return;
        }
        const filtered = allCandidats.filter(c =>
            `${c.prenom} ${c.nom} ${c.email} ${c.profil_psy || ""}`.toLowerCase().includes(q)
        );
        renderCandidatList(filtered);
    });
}

// ============================================================
// Sélection d'un candidat : afficher le bilan
// ============================================================
async function selectCandidat(id, btnEl) {
    // Activer visuellement
    document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("active"));
    btnEl.classList.add("active");

    const candidat = allCandidats.find(c => c.id === id);
    if (!candidat) return;

    // Récupérer la dernière observation
    let scores = null;
    try {
        const obsSnapshot = await db.collection("candidats").doc(id)
            .collection("observations").orderBy("dateObservation", "desc").limit(1).get();
        if (!obsSnapshot.empty) {
            scores = obsSnapshot.docs[0].data().scores;
        }
    } catch (err) {
        console.error("Erreur chargement observation :", err);
    }

    // Fallback sur dernieresNotes si pas d'observation en sous-collection
    if (!scores && candidat.dernieresNotes) {
        scores = candidat.dernieresNotes;
    }

    renderBilan(candidat, scores);
}

// ============================================================
// Rendu du bilan complet
// ============================================================
function renderBilan(candidat, scores) {
    // Afficher le conteneur, cacher l'état vide
    document.getElementById("empty-state").classList.add("hidden");
    document.getElementById("bilan-container").classList.remove("hidden");

    // En-tête
    document.getElementById("bilan-prenom").textContent = candidat.prenom || "";
    document.getElementById("bilan-nom").textContent = candidat.nom || "";
    document.getElementById("bilan-email").textContent = candidat.email || "";
    document.getElementById("bilan-profil-psy").textContent = candidat.profil_psy || "Non renseigné";

    // Bouton LinkedIn
    const linkedinBtn = document.getElementById("bilan-linkedin");
    if (candidat.linkedin) {
        linkedinBtn.href = candidat.linkedin;
        linkedinBtn.classList.remove("hidden");
        linkedinBtn.classList.add("inline-flex");
    } else {
        linkedinBtn.classList.add("hidden");
        linkedinBtn.classList.remove("inline-flex");
    }

    // Bouton CV
    const cvBtn = document.getElementById("bilan-cv");
    if (candidat.cvURL) {
        cvBtn.href = candidat.cvURL;
        cvBtn.classList.remove("hidden");
        cvBtn.classList.add("inline-flex");
    } else {
        cvBtn.classList.add("hidden");
        cvBtn.classList.remove("inline-flex");
    }

    // Bouton 16 Personalities
    const persBtn = document.getElementById("bilan-personality-link");
    if (candidat.personalityLink) {
        persBtn.href = candidat.personalityLink;
        persBtn.classList.remove("hidden");
        persBtn.classList.add("inline-flex");
    } else {
        persBtn.classList.add("hidden");
        persBtn.classList.remove("inline-flex");
    }

    // Graphique radar
    renderRadar(scores);

    // Matching secteurs
    renderSecteurs(scores);
}

// ============================================================
// Graphique Radar (Chart.js)
// ============================================================
function renderRadar(scores) {
    const canvas = document.getElementById("radar-chart");
    const noObs = document.getElementById("no-observation");

    if (!scores || Object.values(scores).every(v => v === 0)) {
        canvas.classList.add("hidden");
        noObs.classList.remove("hidden");
        if (radarChart) { radarChart.destroy(); radarChart = null; }
        return;
    }

    canvas.classList.remove("hidden");
    noObs.classList.add("hidden");

    const labels = SAVOIR_ETRE;
    const data = labels.map(s => scores[s] || 0);

    if (radarChart) radarChart.destroy();

    radarChart = new Chart(canvas, {
        type: "radar",
        data: {
            labels: labels.map(l => l.length > 18 ? l.slice(0, 16) + "…" : l),
            datasets: [{
                label: "Notes (/5)",
                data: data,
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                borderColor: "rgba(99, 102, 241, 0.8)",
                borderWidth: 2,
                pointBackgroundColor: "rgba(99, 102, 241, 1)",
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 5,
                    ticks: { stepSize: 1, font: { size: 11 } },
                    pointLabels: { font: { size: 11 } },
                    grid: { color: "rgba(0,0,0,0.06)" },
                    angleLines: { color: "rgba(0,0,0,0.06)" }
                }
            },
            plugins: {
                legend: { display: false }
            },
            animation: { duration: 600 }
        }
    });
}

// ============================================================
// Matching Secteurs d'activité
// ============================================================
function calculateSectorMatch(scores, secteur) {
    if (!scores) return 0;
    let total = 0;
    for (const [competence, poids] of Object.entries(secteur.competences)) {
        const note = scores[competence] || 0;
        total += (note / 5) * poids;
    }
    return Math.round(total * 100);
}

function renderSecteurs(scores) {
    const container = document.getElementById("secteurs-container");
    container.innerHTML = "";

    SECTEURS.forEach(secteur => {
        const pct = calculateSectorMatch(scores, secteur);
        const colors = COLOR_MAP[secteur.color];
        const competencesList = Object.entries(secteur.competences)
            .map(([name, poids]) => `${name} (${Math.round(poids * 100)}%)`)
            .join(" / ");

        const row = document.createElement("div");
        row.className = "flex items-center gap-4";
        row.innerHTML = `
            <div class="flex items-center gap-3 w-40 flex-shrink-0">
                <svg class="w-5 h-5 ${colors.text} flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${secteur.icon}"/>
                </svg>
                <span class="font-medium text-sm text-gray-700">${secteur.nom}</span>
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-3">
                    <div class="flex-1 ${colors.bg} rounded-full h-4 overflow-hidden">
                        <div class="progress-bar-fill ${colors.fill} h-4 rounded-full" style="width: ${pct}%"></div>
                    </div>
                    <span class="text-sm font-bold ${colors.text} w-12 text-right">${pct}%</span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">${competencesList}</p>
            </div>
        `;
        container.appendChild(row);
    });
}

// ============================================================
// Export PDF (html2pdf.js)
// ============================================================
function setupExportPDF() {
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        const element = document.getElementById("bilan-pdf");
        const prenomEl = document.getElementById("bilan-prenom");
        const nomEl = document.getElementById("bilan-nom");
        const filename = `Bilan_${prenomEl.textContent}_${nomEl.textContent}.pdf`;

        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     filename,
            image:        { type: "jpeg", quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak:    { mode: ["avoid-all", "css", "legacy"] }
        };

        html2pdf().set(opt).from(element).save();
    });
}
