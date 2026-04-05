// ============================================================
// Référentiel des 14 savoir-être
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

// Scores en cours pour la session d'observation
let scores = {};

// ============================================================
// Initialisation
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    initSkillsGrid();
    loadCandidats();
    setupFormHandler();
    setupObservationHandlers();
});

// ============================================================
// Génération de la grille des compétences
// ============================================================
function initSkillsGrid() {
    const grid = document.getElementById("skills-grid");
    SAVOIR_ETRE.forEach(skill => {
        scores[skill] = 0;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "skill-btn flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-300 rounded-xl text-left";
        btn.innerHTML = `
            <span class="font-medium text-gray-700">${skill}</span>
            <span class="score-badge bg-indigo-600 text-white text-sm font-bold rounded-full px-2.5 py-0.5" data-skill="${skill}">0</span>
        `;
        btn.addEventListener("click", () => incrementSkill(skill));
        grid.appendChild(btn);
    });
}

function incrementSkill(skill) {
    scores[skill]++;
    const badge = document.querySelector(`.score-badge[data-skill="${skill}"]`);
    badge.textContent = scores[skill];
    badge.classList.add("scale-125");
    setTimeout(() => badge.classList.remove("scale-125"), 150);
}

function resetScores() {
    SAVOIR_ETRE.forEach(skill => {
        scores[skill] = 0;
        const badge = document.querySelector(`.score-badge[data-skill="${skill}"]`);
        badge.textContent = "0";
    });
}

// ============================================================
// Formulaire d'inscription candidat
// ============================================================
function setupFormHandler() {
    const form = document.getElementById("candidat-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const candidat = {
            nom: document.getElementById("nom").value.trim(),
            prenom: document.getElementById("prenom").value.trim(),
            email: document.getElementById("email").value.trim(),
            personalityLink: document.getElementById("personality-link").value.trim(),
            dateInscription: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection("candidats").add(candidat);
            form.reset();
            showSuccess("inscription-success");
            loadCandidats();
        } catch (error) {
            console.error("Erreur lors de l'inscription :", error);
            alert("Erreur lors de l'inscription. Vérifiez la console.");
        }
    });
}

// ============================================================
// Chargement des candidats dans le sélecteur
// ============================================================
async function loadCandidats() {
    const select = document.getElementById("select-candidat");
    select.innerHTML = '<option value="">-- Sélectionner un candidat --</option>';

    try {
        const snapshot = await db.collection("candidats").orderBy("dateInscription", "desc").get();
        snapshot.forEach(doc => {
            const c = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = `${c.prenom} ${c.nom}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des candidats :", error);
    }
}

// ============================================================
// Sauvegarde de l'observation
// ============================================================
function setupObservationHandlers() {
    document.getElementById("btn-save-observation").addEventListener("click", saveObservation);
    document.getElementById("btn-reset-scores").addEventListener("click", resetScores);
}

async function saveObservation() {
    const candidatId = document.getElementById("select-candidat").value;
    if (!candidatId) {
        alert("Veuillez sélectionner un candidat.");
        return;
    }

    const observation = {
        candidatId: candidatId,
        scores: { ...scores },
        dateObservation: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection("candidats").doc(candidatId).collection("observations").add(observation);
        showSuccess("observation-success");
        resetScores();
    } catch (error) {
        console.error("Erreur lors de la sauvegarde :", error);
        alert("Erreur lors de la sauvegarde. Vérifiez la console.");
    }
}

// ============================================================
// Utilitaire : afficher un message de succès
// ============================================================
function showSuccess(elementId) {
    const el = document.getElementById(elementId);
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 3000);
}
