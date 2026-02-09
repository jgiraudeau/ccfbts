# Guide de Déploiement - CCFBTS

Votre application **CCFBTS** est prête pour la mise en ligne.
Voici les étapes pour déployer le Backend (API) et le Frontend (Interface).

## 1. Préparation GitHub
1. Créez un nouveau dépôt sur [GitHub](https://github.com/new) nommé `ccfbts`.
2. Poussez votre code local vers ce dépôt :
   ```bash
   git remote add origin https://github.com/VOTRE_USER/ccfbts.git
   git branch -M main
   git push -u origin main
   ```

## 2. Déploiement du Backend (API) sur Railway (ou Render)
Nous recommandons **Railway** pour sa simplicité avec Python et PostgreSQL.

1. Créez un compte sur [Railway.app](https://railway.app/).
2. Cliquez sur **"New Project"** -> **"Deploy from GitHub repo"**.
3. Sélectionnez votre repo `ccfbts`.
4. Ajoutez un service **Database** (PostgreSQL) si vous voulez une base de données persistante (recommandé pour la prod).
5. Configurez le service **Backend** :
   - **Root Directory** : `backend`
   - **Build Command** : (Laisser vide, Railway détecte `requirements.txt`)
   - **Start Command** : `uvicorn main:app --host 0.0.0.0 --port $PORT` (ou celle du Procfile)
   - **Variables d'Environnement** (dans l'onglet Variables) :
     - `GOOGLE_API_KEY` : (Votre clé API Gemini)
     - `DATABASE_URL` : (Lien vers la base Postgres Railway, ou laisser vide pour SQLite temporaire - *Attention, SQLite s'efface à chaque redémarrage sur Railway*)
     - `FRONTEND_URL` : (L'URL de votre frontend Vercel, à ajouter après l'étape 3)

## 3. Déploiement du Frontend sur Vercel
1. Créez un compte sur [Vercel.com](https://vercel.com).
2. Cliquez sur **"Add New..."** -> **"Project"**.
3. Importez votre repo `ccfbts`.
4. Configurez le projet :
   - **Root Directory** : Cliquez sur `Edit` et sélectionnez le dossier `frontend`.
   - **Framework Preset** : Next.js (détecté automatiquement).
   - **Variables d'Environnement** :
     - `NEXT_PUBLIC_API_URL` : Copiez l'URL publique de votre backend Railway (ex: `https://ccfbts-backend.up.railway.app`). **Attention : Ne mettez pas de slash `/` à la fin.**

## 4. Finalisation
1. Une fois le Frontend déployé, copiez son URL (ex: `https://ccfbts.vercel.app`).
2. Retournez sur **Railway** > Service Backend > Variables.
3. Ajoutez/Modifiez la variable `FRONTEND_URL` avec cette valeur.
4. Redémarrez le service Backend.

## 5. Vérification
Ouvrez votre site Vercel, testez la connexion et la génération de scénarios.
Tout devrait fonctionner comme en local !
