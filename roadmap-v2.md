# Feuille de Route - Professeur Virtuel V2 (Back to Basics)

## Philosophie
"D'abord le fond, ensuite la forme" (First make it work, then make it pretty).
On se concentre sur l'architecture robuste du Backend (FastAPI + Gemini) et une structure de données claire pour les examens (CCF). Le Frontend viendra se brancher sur une API solide.

## Phase 1 : Le Cœur (Backend + Modèle de Données)
- [ ] **Initialisation Backend** : FastAPI propre, structure modulaire.
- [ ] **Modèle de Données (SQLAlchemy)** : 
    - Utilisateurs (Profs/Élèves)
    - Examens (CCF E4 : Situation A, Situation B)
    - Résultats
- [ ] **Service "Cerveau" (Gemini)** :
    - Ingestion robuste des PDF (Knowledge Base)
    - Chat optimisé (System Instructions claires)

## Phase 2 : L'Interface (Frontend Minimaliste mais Fonctionnel)
- [ ] **Setup Next.js** : Configuration de base.
- [ ] **Connexion API** : S'assurer que le front parle bien au back.
- [ ] **Composants Clés** : Chat, Tableau de bord simple.

## Phase 3 : Fonctionnalités Spécifiques (Le vif du sujet)
- [ ] **Module CCF E4** : L'implémentation propre des deux situations A et B.
- [ ] **Génération de Scénarios** : Le script de roleplay.
