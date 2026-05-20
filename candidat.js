// ============================================================
// Candidat — Auto-evaluation des savoir-etre
// ============================================================

const SAVOIR_ETRE = [
    { nom: "Capacité d'adaptation",  icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
    { nom: "Gestion du stress",      icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
    { nom: "Travail en équipe",      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { nom: "Communication",          icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { nom: "Écoute active",          icon: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" },
    { nom: "Leadership",             icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" },
    { nom: "Créativité",             icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
    { nom: "Esprit critique",        icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { nom: "Prise de décision",      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { nom: "Gestion des conflits",   icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
    { nom: "Autonomie",              icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { nom: "Rigueur",                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { nom: "Empathie",               icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { nom: "Persévérance",           icon: "M13 10V3L4 14h7v7l9-11h-7z" }
];

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

const LABELS_QUALITATIFS = [
    "",
    "En émergence",
    "En développement",
    "Observé",
    "Bien observé",
    "Point fort"
];

const QLABEL_CLASSES = [
    "text-white/35",
    "ql-1",
    "ql-2",
    "ql-3",
    "ql-4",
    "ql-5"
];

let scores = {};

// ============================================================
// Init
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    initSkillsGrid();
    setupSaveHandler();
    updateProgress();
});

// ============================================================
// Grille des competences
// ============================================================
function initSkillsGrid() {
    const grid = document.getElementById("skills-grid");
    SAVOIR_ETRE.forEach((skill, idx) => {
        scores[skill.nom] = 0;

        const row = document.createElement("div");
        row.className = "skill-row";
        row.style.animationDelay = (idx * 0.03) + "s";

        row.innerHTML = `
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-brand-400/85" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="${skill.icon}"/>
                    </svg>
                </div>
                <div class="min-w-0">
                    <span class="font-semibold text-white/90 text-[14px] block leading-tight">${skill.nom}</span>
                    <span class="text-[12px] text-white/45 block mt-0.5 font-medium qualitative-label" data-qlabel="${skill.nom}">Pas encore evalué</span>
                </div>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0 ml-3" data-stars="${skill.nom}"></div>
        `;

        const starsWrap = row.querySelector(`[data-stars="${skill.nom}"]`);
        for (let i = 1; i <= 5; i++) {
            const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            star.setAttribute("viewBox", "0 0 24 24");
            star.setAttribute("class", "star-svg");
            star.setAttribute("data-skill", skill.nom);
            star.setAttribute("data-value", i);
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", STAR_PATH);
            path.setAttribute("class", "star-path");
            path.setAttribute("stroke", "none");
            star.appendChild(path);
            star.addEventListener("click",      () => setRating(skill.nom, i));
            star.addEventListener("mouseenter", () => previewRating(skill.nom, i));
            star.addEventListener("mouseleave", () => restoreRating(skill.nom));
            starsWrap.appendChild(star);
        }

        grid.appendChild(row);
    });
}

// ============================================================
// Etoiles
// ============================================================
function setRating(skillName, value) {
    scores[skillName] = scores[skillName] === value ? 0 : value;
    updateStars(skillName, scores[skillName]);
    updateQualitativeLabel(skillName);
    updateProgress();
}

function previewRating(skillName, value) {
    document.querySelectorAll(`.star-svg[data-skill="${skillName}"]`).forEach(s => {
        if (parseInt(s.getAttribute("data-value")) <= value && !s.classList.contains("filled"))
            s.classList.add("preview");
    });
}

function restoreRating(skillName) {
    document.querySelectorAll(`.star-svg[data-skill="${skillName}"]`).forEach(s => s.classList.remove("preview"));
}

function updateStars(skillName, value) {
    document.querySelectorAll(`.star-svg[data-skill="${skillName}"]`).forEach(s => {
        const v = parseInt(s.getAttribute("data-value"));
        s.classList.toggle("filled", v <= value);
        s.classList.remove("preview");
    });
}

function updateQualitativeLabel(skillName) {
    const el  = document.querySelector(`[data-qlabel="${skillName}"]`);
    const val = scores[skillName];
    el.textContent = val === 0 ? "Pas encore evalué" : LABELS_QUALITATIFS[val];
    el.className   = `text-[12px] block mt-0.5 font-medium qualitative-label ${QLABEL_CLASSES[val]}`;
}

// ============================================================
// Barre de progression
// ============================================================
function updateProgress() {
    const observed = Object.values(scores).filter(v => v > 0).length;
    const total    = SAVOIR_ETRE.length;
    const pct      = Math.round((observed / total) * 100);

    const bar   = document.getElementById("progress-bar");
    const label = document.getElementById("progress-label");
    if (bar)   bar.style.width = pct + "%";
    if (label) label.textContent = `${observed} / ${total} evalués`;
}

// ============================================================
// Toast notifications
// ============================================================
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const colors = {
        success: "bg-emerald-500/90 border-emerald-400/40 text-white",
        error:   "bg-red-500/90 border-red-400/40 text-white",
        info:    "bg-brand-600/90 border-brand-400/40 text-white"
    };
    const icons = {
        success: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        error:   '<path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        info:    '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
    };

    const toast = document.createElement("div");
    toast.className = `toast pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg text-sm font-medium max-w-[340px] ${colors[type]}`;
    toast.innerHTML = `
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${icons[type]}</svg>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

// ============================================================
// Validation du formulaire
// ============================================================
function validateForm() {
    const prenom = document.getElementById("prenom").value.trim();
    const nom    = document.getElementById("nom").value.trim();
    const email  = document.getElementById("email").value.trim();

    // Reset error states
    ["prenom", "nom", "email"].forEach(id => {
        document.getElementById(id).classList.remove("inp-error");
    });

    let valid = true;

    if (!prenom) {
        document.getElementById("prenom").classList.add("inp-error");
        valid = false;
    }
    if (!nom) {
        document.getElementById("nom").classList.add("inp-error");
        valid = false;
    }
    if (!email) {
        document.getElementById("email").classList.add("inp-error");
        valid = false;
    } else {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            document.getElementById("email").classList.add("inp-error");
            valid = false;
        }
    }

    if (!valid) {
        showToast("Veuillez remplir tous les champs obligatoires", "error");
    }

    return valid;
}

// ============================================================
// Sauvegarde (Enregistrer)
// ============================================================
function setupSaveHandler() {
    document.getElementById("btn-enregistrer").addEventListener("click", saveCandidat);

    // Clear error state on input focus
    ["prenom", "nom", "email"].forEach(id => {
        document.getElementById(id).addEventListener("focus", () => {
            document.getElementById(id).classList.remove("inp-error");
        });
    });
}

async function saveCandidat() {
    // Validate form
    if (!validateForm()) return;

    // Check that at least one skill is rated
    const hasRatings = Object.values(scores).some(v => v > 0);
    if (!hasRatings) {
        showToast("Veuillez evaluer au moins un savoir-etre", "error");
        return;
    }

    const btn = document.getElementById("btn-enregistrer");
    btn.disabled = true;
    btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Enregistrement...';

    const prenom          = document.getElementById("prenom").value.trim();
    const nom             = document.getElementById("nom").value.trim();
    const email           = document.getElementById("email").value.trim();
    const linkedin        = document.getElementById("linkedin").value.trim();
    const profil_psy      = document.getElementById("profilPsy").value;
    const personalityLink = document.getElementById("personality-link").value.trim();
    const cvURL           = document.getElementById("cvURL").value.trim() || null;

    // Build scores_candidat object
    const scores_candidat = {};
    SAVOIR_ETRE.forEach(skill => {
        scores_candidat[skill.nom] = scores[skill.nom];
    });

    try {
        // Check if candidate with this email already exists
        const existingSnap = await db.collection("candidats")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (!existingSnap.empty) {
            // UPDATE existing candidate
            const docRef = existingSnap.docs[0].ref;
            await docRef.update({
                nom,
                prenom,
                email,
                linkedin,
                profil_psy,
                personalityLink,
                cvURL,
                scores_candidat,
                dateAutoEvaluation: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast(`${prenom} ${nom}, votre fiche a été mise à jour !`);
        } else {
            // CREATE new candidate
            await db.collection("candidats").add({
                nom,
                prenom,
                email,
                linkedin,
                profil_psy,
                personalityLink,
                cvURL,
                scores_candidat,
                dateInscription:    firebase.firestore.FieldValue.serverTimestamp(),
                dateAutoEvaluation: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast(`${prenom} ${nom}, votre auto-evaluation est enregistrée !`);
        }

        // Reset form and scores after successful save
        document.getElementById("candidat-form").reset();
        document.getElementById("profilPsy").value = "";
        document.getElementById("personality-link").value = "";
        document.getElementById("cvURL").value = "";
        SAVOIR_ETRE.forEach(skill => {
            scores[skill.nom] = 0;
            updateStars(skill.nom, 0);
            updateQualitativeLabel(skill.nom);
        });
        updateProgress();

    } catch (err) {
        console.error("Erreur lors de l'enregistrement :", err);
        showToast("Erreur lors de l'enregistrement. Veuillez reessayer.", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Enregistrer';
    }
}
