import { Handshake, Monitor, Users, Briefcase, FileCheck } from "lucide-react";

export const DOMAINS: Record<string, any> = {
    // === E6 (BLOC 3) ===
    E6_DISTRIBUTION: {
        id: 'distrib',
        exam: 'E6',
        title: "E6 - Implanter et promouvoir l'offre",
        subtitle: "Distributeur",
        color: "blue",
        gradient: "from-blue-500 to-cyan-400",
        icon: Monitor,
        skills: [
            { id: 1, name: "Valoriser l’offre sur le lieu de vente", criteria: ["Suivre l'application des accords", "Analyser la cohérence merchandising", "Argumenter des préconisations"] },
            { id: 2, name: "Développer la présence réseau", criteria: ["Diagnostiquer rayon/zone", "Identifier opportunités référencement", "Maîtriser techniques implantation"] },
            { id: 3, name: "Proposer une animation commerciale", criteria: ["Choisir/justifier animation", "Créer les outils (PLV, ILV)", "Planifier l'action"] },
            { id: 4, name: "Évaluer l’efficacité de l’animation", criteria: ["Présenter un reporting (CA, Marge)", "Formuler un bilan argumenté", "Proposer des remédiations"] }
        ]
    },
    E6_PARTENARIAT: {
        id: 'partenariat',
        exam: 'E6',
        title: "E6 - Développer un réseau de partenaires",
        subtitle: "Partenariat",
        color: "emerald",
        gradient: "from-emerald-500 to-teal-400",
        icon: Handshake,
        skills: [
            { id: 1, name: "Participer au développement du réseau", criteria: ["Analyse macro/micro environnement", "Matrice SWOT", "Identifier besoins", "Dégager problématique"] },
            { id: 2, name: "Mobiliser et évaluer le réseau", criteria: ["Listing partenaires", "Tableau multicritères", "Actions d'animation", "Outils d'évaluation perf."] }
        ]
    },
    E6_VD: {
        id: 'vd',
        exam: 'E6',
        title: "E6 - Créer et animer un réseau",
        subtitle: "Vente Directe",
        color: "purple",
        gradient: "from-purple-500 to-pink-400",
        icon: Users,
        skills: [
            { id: 1, name: "Prospecter et vendre en réunion", criteria: ["Fichier prospects", "Com. digitale", "Méthodes vente réunion", "Utilisation OAV"] },
            { id: 2, name: "Recruter et former des vendeurs", criteria: ["Processus recrutement", "Statuts VDI", "Cadre légal et éthique"] },
            { id: 3, name: "Impulser une dynamique de réseau", criteria: ["Outils stimulation", "Rémunération", "Stratégie développement"] }
        ]
    },

    // === E4 (BLOC 2) ===
    E4_CIBLER_PROSPECTER: {
        id: 'e4_cibler',
        exam: 'E4',
        title: "E4 - Cibler et Prospecter",
        subtitle: "Cibler & Prospecter",
        color: "orange",
        gradient: "from-orange-500 to-red-400",
        icon: FileCheck,
        skills: [
            { id: 101, name: "Collecter et analyser l'information", criteria: ["Veille informationnelle", "Qualification fichier", "Analyse sectorielle"] },
            { id: 102, name: "Organiser et conduire la prospection", criteria: ["Ciblage", "Choix méthode (physique/digital/phoning)", "Mise en œuvre", "Suivi (tableau de bord)"] }
        ]
    },
    E4_NEGOCIER: {
        id: 'e4_negocier',
        exam: 'E4',
        title: "E4 - Négocier et Accompagner",
        subtitle: "Négociation",
        color: "amber",
        gradient: "from-amber-500 to-yellow-400",
        icon: Briefcase,
        skills: [
            { id: 201, name: "Négocier et vendre", criteria: ["Préparation entretien", "Découverte besoins (SONCAS)", "Argumentation/Traitement objections", "Conclusion"] },
            { id: 202, name: "Accompagner la relation client", criteria: ["Suivi après-vente", "Fidélisation", "Gestion des réclamations"] }
        ]
    },
    E4_EVENEMENT: {
        id: 'e4_event',
        exam: 'E4',
        title: "E4 - Organiser un Événement",
        subtitle: "Événementiel",
        color: "indigo",
        gradient: "from-indigo-600 to-purple-500",
        icon: Users,
        skills: [
            { id: 301, name: "Concevoir une opération événementielle", criteria: ["Définition objectifs/cibles", "Budget prévisionnel (Seuil renta)", "Planification (Rétroplanning)"] },
            { id: 302, name: "Mettre en œuvre et évaluer", criteria: ["Coordination jour J", "Bilan quantitatif/qualitatif", "Pistes d'amélioration"] }
        ]
    },
    E4_INFO: {
        id: 'e4_info',
        exam: 'E4',
        title: "E4 - Exploiter et Mutualiser l'Information",
        subtitle: "Information",
        color: "teal",
        gradient: "from-teal-500 to-cyan-400",
        icon: FileCheck,
        skills: [
            { id: 401, name: "Remonter et valoriser l'information", criteria: ["Pertinence informations collectées", "Sélection et hiérarchisation", "Partage avec équipe"] },
            { id: 402, name: "Collaborer à l'interne", criteria: ["Qualité analyses commerciales", "Propositions d'amélioration", "Développement expertise"] }
        ]
    }
};

export const CCF_GRILLE_E6 = {
    title: "GRILLE CCF E6",
    sections: [
        { id: 'E6_DISTRIBUTION', skills: [{ id: 'ccf_distrib_1' }, { id: 'ccf_distrib_2' }] },
        { id: 'E6_PARTENARIAT', skills: [{ id: 'ccf_part_1' }, { id: 'ccf_part_2' }] },
        { id: 'E6_VD', skills: [{ id: 'ccf_vd_1' }, { id: 'ccf_vd_2' }] }
    ]
};

// TODO: Ajouter CCF E4 qui est plus complexe (Sit A / Sit B)
export const CCF_GRILLE_E4 = {
    title: "GRILLE CCF E4",
    sections: [
        {
            id: 'E4_SIT_A',
            title: "Situation A (Au fil de l'eau)",
            skills: [
                { id: 'e4_sitA_1', name: "Cibler et prospecter", desc: "Qualité du ciblage, pertinence méthode, résultats obtenus" },
                { id: 'e4_sitA_2', name: "Exploiter l'information", desc: "Veille, qualification données, usage outils digitaux" }
            ]
        },
        {
            id: 'E4_SIT_B',
            title: "Situation B (Simulation Négociation)",
            skills: [
                { id: 'e4_sitB_1', name: "Conduire un entretien de négociation", desc: "Phase découverte, argumentation adaptée, traitement objections, conclusion" },
                { id: 'e4_sitB_2', name: "Organiser et animer un événement", desc: "Cohérence projet, budget, solutions proposées" }
            ]
        }
    ]
};
