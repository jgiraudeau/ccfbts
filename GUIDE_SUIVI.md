# 🚀 Guide de Démarrage - Système de Suivi BTS NDRC

## ✅ Système Opérationnel !

Le système de suivi des élèves est maintenant complètement intégré et fonctionnel.

---

## 🎯 Accès au Système

### **Frontend (Interface)**
- **Local**: http://localhost:3000
- **Production**: https://votre-app.vercel.app

### **Backend (API)**
- **Local**: http://localhost:8000
- **Production**: https://applicompndrc-production.up.railway.app
- **Documentation API**: http://localhost:8000/docs

---

## 👥 Comptes de Test

### **1. Créer un Compte Admin** (première fois)
```bash
# Dans le backend
cd backend
source venv/bin/activate
python
```

```python
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

db = SessionLocal()

# Créer un admin
admin = User(
    name="Admin Principal",
    email="admin@ndrc.fr",
    hashed_password=get_password_hash("admin123"),
    role="admin",
    is_active=True
)

db.add(admin)
db.commit()
print("✅ Admin créé !")
```

### **2. Se Connecter**
1. Ouvrez http://localhost:3000
2. Connectez-vous avec:
   - **Email**: admin@ndrc.fr
   - **Mot de passe**: admin123

---

## 🎨 Navigation dans l'Interface

### **Barre de Navigation Supérieure**
Vous verrez deux boutons pour basculer entre les modes :

1. **📊 Évaluations** - Ancien système (E4/E6 CCF)
2. **📚 Suivi Élèves** - Nouveau système de suivi

### **Mode: Suivi Élèves** (par défaut)

#### **👨‍🏫 Interface Professeur**
Menu latéral avec 3 sections :
- **Tableau de Bord** - Vue d'ensemble, notation
- **Mes Classes** - Gestion des classes
- **Planning Annuel** - Échéances de documents

#### **🛡️ Interface Admin**
Menu latéral avec 2 sections :
- **Administration** - Gestion des professeurs
- **Tableau de Bord** - Vue globale

#### **👨‍🎓 Interface Élève**
- **Mes Échéances** - Documents à rendre, notes

---

## 📋 Workflow Complet

### **Étape 1: Admin crée un Professeur**
1. Connectez-vous en tant qu'admin
2. Cliquez sur "Administration" dans le menu
3. Cliquez sur "Créer un Professeur"
4. Remplissez:
   - Nom: Jean Dupont
   - Email: prof@ndrc.fr
   - Mot de passe: prof123
5. Cliquez sur "Créer"

### **Étape 2: Professeur crée une Classe**
1. Déconnectez-vous et reconnectez-vous avec prof@ndrc.fr
2. Cliquez sur "Mes Classes"
3. Cliquez sur "Nouvelle Classe"
4. Remplissez:
   - Nom: BTS NDRC 1A
   - Description: Première année
   - Année scolaire: 2024-2025
5. Cliquez sur "Créer"

### **Étape 3: Professeur ajoute des Élèves**
1. Sélectionnez la classe créée
2. Cliquez sur "Ajouter des élèves"
3. Sélectionnez les élèves (créez-les d'abord si besoin)
4. Cliquez sur "Ajouter"

### **Étape 4: Professeur crée une Échéance**
1. Cliquez sur "Planning Annuel"
2. Cliquez sur "Nouvelle Échéance"
3. Remplissez:
   - Titre: Compte rendu semaine 1
   - Type: Compte Rendu Hebdo
   - Date limite: 2026-02-15
   - Examen: E6
   - Description: Premier compte rendu
4. Cliquez sur "Créer"

### **Étape 5: Élève soumet un Document**
1. Connectez-vous en tant qu'élève
2. Vous verrez l'échéance dans "À rendre"
3. Cliquez sur "Choisir un fichier"
4. Sélectionnez un fichier
5. Cliquez sur "Soumettre"

### **Étape 6: Professeur note le Document**
1. Reconnectez-vous en tant que professeur
2. Cliquez sur "Tableau de Bord"
3. Vous verrez la soumission en "En attente"
4. Cliquez sur "Noter"
5. Remplissez:
   - Statut: Approuvé
   - Note: 15/20
   - Commentaire: Bon travail !
6. Cliquez sur "Enregistrer"

### **Étape 7: Élève voit sa Note**
1. Reconnectez-vous en tant qu'élève
2. Cliquez sur l'onglet "Rendus"
3. Vous verrez votre note et le commentaire

---

## 🔧 Commandes Utiles

### **Démarrer le Backend**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### **Démarrer le Frontend**
```bash
cd frontend
npm run dev
```

### **Créer les Tables (si besoin)**
```bash
cd backend
python create_tracking_tables.py
```

### **Voir les Logs**
```bash
# Backend
tail -f backend/logs/app.log

# Frontend
# Les logs s'affichent dans le terminal où npm run dev tourne
```

---

## 📊 Endpoints API Disponibles

### **Classes**
- `GET /api/classes` - Lister mes classes
- `POST /api/classes` - Créer une classe
- `POST /api/classes/{id}/students` - Ajouter des élèves
- `DELETE /api/classes/{id}/students/{student_id}` - Retirer un élève

### **Échéances**
- `GET /api/deadlines` - Lister les échéances
- `POST /api/deadlines` - Créer une échéance
- `GET /api/deadlines/calendar/{year}/{month}` - Vue calendrier

### **Soumissions**
- `GET /api/submissions` - Lister les soumissions
- `POST /api/submissions/upload` - Upload un fichier
- `POST /api/submissions` - Créer une soumission
- `PUT /api/submissions/{id}/review` - Noter une soumission

### **Administration**
- `GET /api/admin/teachers` - Lister les professeurs
- `POST /api/admin/teachers` - Créer un professeur
- `PUT /api/admin/teachers/{id}/activate` - Activer/Désactiver
- `GET /api/admin/stats` - Statistiques globales

### **Élèves**
- `GET /api/students` - Lister mes élèves
- `POST /api/students` - Créer un élève
- `PUT /api/students/{id}` - Modifier un élève

---

## 🎨 Composants Frontend

### **Créés et Intégrés**
1. ✅ **ClassManager** - Gestion des classes
2. ✅ **PlanningManager** - Gestion des échéances
3. ✅ **TeacherDashboard** - Tableau de bord prof
4. ✅ **StudentDeadlines** - Interface élève
5. ✅ **AdminPanel** - Interface admin
6. ✅ **TrackingSystem** - Navigation principale

---

## 🐛 Dépannage

### **Problème: "Unauthorized" lors de l'accès à l'API**
- Vérifiez que vous êtes bien connecté
- Vérifiez que le token JWT est valide dans localStorage

### **Problème: Les tables n'existent pas**
```bash
cd backend
python create_tracking_tables.py
```

### **Problème: Le frontend ne se connecte pas au backend**
- Vérifiez que le backend tourne sur http://localhost:8000
- Vérifiez la variable d'environnement `NEXT_PUBLIC_API_URL`

### **Problème: Erreur CORS**
- Le backend est configuré pour accepter toutes les origines en développement
- En production, configurez les origines autorisées dans `main.py`

---

## 🚀 Déploiement

### **Backend (Railway)**
Le backend est déjà configuré pour Railway. À chaque push sur `main`, il se déploie automatiquement.

### **Frontend (Vercel)**
```bash
cd frontend
vercel
```

---

## 📝 Notes Importantes

1. **Sécurité**: En production, changez tous les mots de passe par défaut
2. **Fichiers**: Les uploads sont stockés dans `backend/uploads/submissions/`
3. **Base de données**: PostgreSQL en production, SQLite possible en local
4. **Authentification**: JWT avec expiration de 7 jours

---

## ✨ Fonctionnalités Principales

- ✅ Gestion multi-professeurs
- ✅ Classes personnalisées
- ✅ Planning annuel d'échéances
- ✅ Upload de documents
- ✅ Notation et feedback
- ✅ Dashboard avec statistiques
- ✅ Interface admin complète
- ✅ Responsive design
- ✅ Filtres et tri
- ✅ Indicateurs visuels (urgent, en retard)

---

**Le système est prêt à l'emploi ! 🎉**
