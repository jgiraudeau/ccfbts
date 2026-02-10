# Plan d'Implémentation : Système de Suivi des Élèves

## 📋 Vue d'ensemble

Créer un système complet de suivi des élèves permettant :
- Au **professeur** : Définir un planning annuel de remises de documents et suivre les soumissions
- Aux **élèves** : Voir leurs échéances et soumettre leurs documents
- Suivi des **notes** et **corrections** pour chaque document

---

## 🗄️ Phase 1 : Modèles de Base de Données

### 1.1 Table `deadlines` (Échéances)
```sql
CREATE TABLE deadlines (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL,  -- 'diaporama', 'compte_rendu_hebdo', 'fiche_activite', etc.
    due_date DATE NOT NULL,
    exam_type VARCHAR(10),  -- 'E4', 'E6', 'ALL'
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Types de documents** :
- `diaporama` : Présentation PowerPoint/PDF
- `compte_rendu_hebdo` : Compte rendu hebdomadaire de stage
- `fiche_activite` : Fiche d'activité professionnelle
- `annexes` : Documents annexes
- `attestation_stage` : Attestation de stage
- `autre` : Autre document

### 1.2 Table `submissions` (Soumissions)
```sql
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    deadline_id INTEGER REFERENCES deadlines(id) ON DELETE CASCADE,
    file_url VARCHAR(500),  -- URL du fichier uploadé
    file_name VARCHAR(200),
    submitted_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'reviewed', 'approved', 'rejected'
    grade DECIMAL(4,2),  -- Note sur 20
    feedback TEXT,  -- Commentaires du prof
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    UNIQUE(student_id, deadline_id)
);
```

### 1.3 Modifications Table `students`
Ajouter des champs pour le suivi :
```sql
ALTER TABLE students ADD COLUMN stage_start_date DATE;
ALTER TABLE students ADD COLUMN stage_end_date DATE;
ALTER TABLE students ADD COLUMN stage_company VARCHAR(200);
ALTER TABLE students ADD COLUMN stage_tutor VARCHAR(100);
```

---

## 🔧 Phase 2 : Backend API

### 2.1 Endpoints pour les Échéances (Prof)

**Router** : `/api/deadlines`

```python
# GET /api/deadlines - Liste toutes les échéances
# POST /api/deadlines - Créer une échéance
# PUT /api/deadlines/{id} - Modifier une échéance
# DELETE /api/deadlines/{id} - Supprimer une échéance
# GET /api/deadlines/calendar - Vue calendrier (par mois)
```

### 2.2 Endpoints pour les Soumissions

**Router** : `/api/submissions`

```python
# GET /api/submissions - Liste toutes les soumissions (prof)
# GET /api/submissions/student/{student_id} - Soumissions d'un élève
# POST /api/submissions - Soumettre un document (élève)
# PUT /api/submissions/{id}/review - Noter et commenter (prof)
# DELETE /api/submissions/{id} - Supprimer une soumission
```

### 2.3 Endpoints pour le Tableau de Bord

**Router** : `/api/dashboard`

```python
# GET /api/dashboard/teacher - Vue d'ensemble prof (tous élèves)
# GET /api/dashboard/student/{id} - Vue élève individuelle
# GET /api/dashboard/stats - Statistiques globales
```

### 2.4 Upload de Fichiers

```python
# POST /api/upload - Upload fichier (retourne URL)
# Stockage : Local ou Cloud (AWS S3, Google Cloud Storage)
```

---

## 🎨 Phase 3 : Interface Professeur (Backoffice)

### 3.1 Page "Planning Annuel"

**Composant** : `PlanningManager.tsx`

**Fonctionnalités** :
- ✅ Vue calendrier annuel
- ✅ Créer/Modifier/Supprimer des échéances
- ✅ Filtrer par type de document / examen
- ✅ Dupliquer une échéance pour tous les élèves
- ✅ Import/Export du planning (CSV/Excel)

**UI** :
```
┌─────────────────────────────────────────────┐
│  📅 Planning Annuel des Remises             │
├─────────────────────────────────────────────┤
│  [+ Nouvelle Échéance]  [Import] [Export]   │
│                                             │
│  Septembre 2024                             │
│  ┌──────┬──────┬──────┬──────┬──────┐      │
│  │ Lun  │ Mar  │ Mer  │ Jeu  │ Ven  │      │
│  ├──────┼──────┼──────┼──────┼──────┤      │
│  │  2   │  3   │  4   │  5   │  6   │      │
│  │      │      │ 📄CR │      │      │      │
│  ├──────┼──────┼──────┼──────┼──────┤      │
│  │  9   │ 10   │ 11   │ 12   │ 13   │      │
│  │      │      │      │ 📊PPT│      │      │
│  └──────┴──────┴──────┴──────┴──────┘      │
└─────────────────────────────────────────────┘
```

### 3.2 Page "Tableau de Bord Élèves"

**Composant** : `StudentDashboard.tsx`

**Fonctionnalités** :
- ✅ Vue tableau de tous les élèves
- ✅ Colonnes : Nom, Documents remis/attendus, Notes moyennes, Retards
- ✅ Filtres : Par classe, par examen, par statut
- ✅ Clic sur élève → Détail complet
- ✅ Export PDF/Excel du tableau

**UI** :
```
┌────────────────────────────────────────────────────────────┐
│  👥 Tableau de Bord Élèves                                 │
├────────────────────────────────────────────────────────────┤
│  Filtres: [Tous] [E4] [E6]  [En retard] [À jour]          │
│                                                            │
│  Nom          │ Docs Remis │ Notes Moy │ Retards │ Action │
│  ─────────────┼────────────┼───────────┼─────────┼────────│
│  MOREAU C.    │  12/15 ✅  │  14.5/20  │   2 ⚠️  │ [Voir] │
│  DUPONT M.    │   8/15 ⚠️  │  12.0/20  │   5 🔴  │ [Voir] │
│  MARTIN L.    │  15/15 ✅  │  16.2/20  │   0 ✅  │ [Voir] │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Page "Détail Élève"

**Composant** : `StudentDetailView.tsx`

**Fonctionnalités** :
- ✅ Liste de tous les documents attendus
- ✅ Statut de chaque document (Remis/En attente/En retard)
- ✅ Télécharger les documents soumis
- ✅ Noter et commenter chaque document
- ✅ Historique des soumissions

**UI** :
```
┌────────────────────────────────────────────────────────────┐
│  📁 MOREAU Camille - Suivi des Documents                   │
├────────────────────────────────────────────────────────────┤
│  Stage: SIMPLICAR (01/09/24 - 30/06/25)                   │
│                                                            │
│  Document                │ Échéance  │ Statut    │ Note   │
│  ────────────────────────┼───────────┼───────────┼────────│
│  📄 CR Hebdo Sem 1       │ 06/09/24  │ ✅ Remis  │ 15/20  │
│     └─ [Télécharger] [Noter/Commenter]                    │
│  📄 CR Hebdo Sem 2       │ 13/09/24  │ ✅ Remis  │ 14/20  │
│  📊 Diaporama E4         │ 20/09/24  │ ⚠️ Retard │  -     │
│  📄 Fiche Activité #1    │ 27/09/24  │ ⏳ Attend │  -     │
└────────────────────────────────────────────────────────────┘
```

---

## 👨‍🎓 Phase 4 : Interface Élève

### 4.1 Page "Mes Échéances"

**Composant** : `StudentDeadlines.tsx`

**Fonctionnalités** :
- ✅ Liste des échéances à venir
- ✅ Upload de documents
- ✅ Voir les notes et feedbacks
- ✅ Historique des soumissions
- ✅ Notifications pour les échéances proches

**UI** :
```
┌────────────────────────────────────────────────────────────┐
│  📅 Mes Échéances et Documents                             │
├────────────────────────────────────────────────────────────┤
│  🔴 À rendre cette semaine (2)                             │
│                                                            │
│  📊 Diaporama E4 - Négociation Vente                       │
│  Échéance: 20/09/2024 (dans 2 jours)                      │
│  [📎 Choisir un fichier] [Soumettre]                      │
│                                                            │
│  📄 Compte Rendu Hebdomadaire - Semaine 3                  │
│  Échéance: 22/09/2024 (dans 4 jours)                      │
│  [📎 Choisir un fichier] [Soumettre]                      │
│                                                            │
│  ─────────────────────────────────────────────────────────│
│  ✅ Documents remis (12)                                   │
│                                                            │
│  📄 CR Hebdo Sem 1 - Remis le 05/09/24                    │
│  Note: 15/20 ⭐ Feedback: "Très bon travail, continuez!"  │
│  [📥 Télécharger]                                          │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Phase 5 : Fonctionnalités Avancées

### 5.1 Notifications
- Email automatique 7 jours avant échéance
- Email de rappel 1 jour avant
- Notification en retard
- Notification quand note publiée

### 5.2 Statistiques
- Taux de remise à temps
- Moyenne des notes par type de document
- Évolution des notes dans le temps
- Comparaison avec la classe

### 5.3 Export et Rapports
- Export PDF du bilan élève
- Export Excel du tableau de bord
- Génération de rapports de stage

---

## 🚀 Plan d'Exécution

### Sprint 1 : Base de données et API (2-3 jours)
1. ✅ Créer les modèles SQLAlchemy
2. ✅ Créer les migrations Alembic
3. ✅ Implémenter les endpoints API
4. ✅ Tester avec Postman/curl

### Sprint 2 : Interface Prof - Planning (2 jours)
1. ✅ Créer PlanningManager.tsx
2. ✅ Intégrer un calendrier (react-big-calendar)
3. ✅ Formulaires de création/modification
4. ✅ Connexion à l'API

### Sprint 3 : Interface Prof - Tableau de Bord (2 jours)
1. ✅ Créer StudentDashboard.tsx
2. ✅ Vue tableau avec filtres
3. ✅ Page détail élève
4. ✅ Système de notation et feedback

### Sprint 4 : Interface Élève (2 jours)
1. ✅ Créer StudentDeadlines.tsx
2. ✅ Upload de fichiers
3. ✅ Affichage des notes/feedbacks
4. ✅ Historique

### Sprint 5 : Notifications et Polish (1-2 jours)
1. ✅ Système de notifications email
2. ✅ Tests end-to-end
3. ✅ Corrections de bugs
4. ✅ Documentation

---

## 📦 Technologies Utilisées

**Backend** :
- FastAPI (API REST)
- SQLAlchemy (ORM)
- Alembic (Migrations)
- Python-multipart (Upload fichiers)
- SendGrid/SMTP (Emails)

**Frontend** :
- React + TypeScript
- TailwindCSS (Styling)
- react-big-calendar (Calendrier)
- lucide-react (Icônes)
- date-fns (Manipulation dates)

**Stockage Fichiers** :
- Option 1 : Local (backend/uploads/)
- Option 2 : AWS S3 / Google Cloud Storage

---

## ✅ Checklist de Validation

- [ ] Le prof peut créer des échéances
- [ ] Le prof voit tous les documents de tous les élèves
- [ ] Le prof peut noter et commenter
- [ ] L'élève voit ses échéances
- [ ] L'élève peut uploader des documents
- [ ] L'élève voit ses notes et feedbacks
- [ ] Notifications email fonctionnelles
- [ ] Export PDF/Excel fonctionne
- [ ] Interface responsive (mobile/tablet)
- [ ] Tests de sécurité (upload, permissions)

---

## 🎯 Prochaines Étapes

**Voulez-vous que je commence par :**
1. **Créer les modèles de base de données** (Phase 1) ?
2. **Implémenter l'API backend** (Phase 2) ?
3. **Créer l'interface de planning** (Phase 3.1) ?

Ou préférez-vous ajuster le plan avant de commencer ?
