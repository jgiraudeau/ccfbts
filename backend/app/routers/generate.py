
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Literal
from sqlalchemy.orm import Session
from ..database import get_db
# Remove missing model import
# from ..models import ActivityLog 
from ..services.gemini_service import gemini_service
from ..services.knowledge_service import knowledge_base
import re

router = APIRouter()

# Specialized prompt templates
PROMPT_TEMPLATES = {
    "jeu_de_role": """Tu es un expert créateur de sujets d'examen certifiants pour le BTS NDRC (Épreuve E4).
Ta mission est de générer les DEUX fiches (Candidat et Jury) pour une simulation de Négociation Vente (Situation A).
Le format doit être STRICTEMENT celui des documents officiels.

CONTEXTE SOURCE : L'utilisateur va te fournir le contenu d'une fiche situation étudiant. Tu dois extraire les informations pertinentes (Produit, Cible, Objectifs) pour construire le sujet.

RÈGLES D'OR :
1. AUCUN RÉCIT, AUCUNE PHRASE D'INTRO.
2. PAS DE MENTION "Voici le sujet".
3. Le document doit commencer immédiatement par l'entête du BTS.
4. Remplis la colonne de droite avec des informations réalistes et contextuelles basées sur la fiche étudiant fournie, MAIS en introduisant une variable/modification pour l'examen (le "paramètre modifié").
5. Ne modifie PAS la colonne de gauche (Intitulés).

---

**BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT**
**SESSION 2025**
**E4 – RELATION CLIENT ET NEGOCIATION VENTE**

**FICHE SUJET – nom du CANDIDAT :**

☑ Négociation Vente et Accompagnement de la Relation Client
☐ Organisation et Animation d’un Évènement commercial

| **MODIFICATION DES PARAMÈTRES À PRENDRE EN COMPTE PAR LE CANDIDAT POUR LA SIMULATION** | **DÉTAILS DE LA SITUATION** |
| :--- | :--- |
| **Objet de l’activité** | [Extrait de la fiche étudiant : Vente de...] |
| **Date(s) et durée** | [Date réaliste] - Durée : 20 minutes (dont 10 min de simulation) |
| **Lieu** | [Lieu précis : Showroom, Bureau client, Salon...] |
| **Délimitation de Séquence(s)** | [Début : Accueil... Fin : Prise de congé] |
| **Acteur(s) concernés (statut/rôle)** | [M./Mme X, fonction exacte (Jury)] |
| **Historique de la relation / Relation à l’entreprise**<br>*(Objectif : définir à quel moment de cette relation vous intervenez)* | [Contexte basé sur la fiche : Client depuis X temps, ou Prospect qualifié...] |
| **Objectifs de la simulation** | [Basé sur la fiche MAIS rendu plus difficile : Vendre le produit + Option, ou Faire signer le devis Z...] |
| **Informations à exploiter** | [Données chiffrées, Promo en cours, Besoins spécifiques décelés...] |
| **Contrainte(s)** | [Introduire une contrainte : Budget serré, Délai court, Décideur absent...] |

---

**PAGE 2**

**BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT**
**SESSION 2025**
**E4 – RELATION CLIENT ET NEGOCIATION VENTE**

**FICHE SUJET – nom du JURY**

☑ Négociation Vente et Accompagnement de la Relation Client
☐ Organisation et Animation d’un Évènement commercial

| **MODIFICATION DES PARAMÈTRES À PRENDRE EN COMPTE PAR LE JURY POUR LA SIMULATION** | **DÉTAILS POUR LE JURY** |
| :--- | :--- |
| **Objet de l’activité** | [Idem Candidat] |
| **Identité** | [Nom, Âge, Profil psychologique (ex: Sceptique, Pressé, Chaleureux)] |
| **Relation à l’entreprise** | [Ancienneté relationnelle, Niveau de satisfaction actuel] |
| **Date de la rencontre** | [Date] |
| **Lieu** | [Lieu] |
| **Historique de la relation** | [Rappel du contexte] |
| **Objectifs de la simulation** | [Ce que le vendeur doit réussir à faire] |
| **Délimitation de Séquence (s)** | [Idem Candidat] |
| **Motivations** | [Besoin de fiabilité, Gain de temps, Innovation, Image de marque...] |
| **Freins** | [Peur du risque, Budget, Complexité de mise en œuvre...] |
| **Contrainte(s)** | [Doit en parler à sa direction, Budget bloqué jusqu'en Janvier...] |
| **Objections** | 1. [Objection majeure sur le prix]<br>2. [Objection technique ou concurrentielle]<br>3. [Objection de principe ou de délai] |

---
""",
    "jeu_de_role_evenement": """Tu es un expert créateur de sujets d'examen certifiants pour le BTS NDRC (Épreuve E4).
Ta mission est de générer les DEUX fiches (Candidat et Jury) pour une simulation d'Organisation et Animation d’un Évènement Commercial.
Le format doit être STRICTEMENT celui des documents officiels.

RÈGLES D'OR :
1. AUCUN RÉCIT, AUCUNE PHRASE D'INTRO.
2. Le document doit commencer immédiatement par l'entête du BTS.
3. Remplis la colonne de droite avec des informations réalistes et contextuelles.
4. **NOUVEAU FOCUS** : Ne demande PAS de calculs financiers complexes (comme le Seuil de Rentabilité comptable).
   - Centre la simulation sur la **BUDGÉTISATION**, la **NÉGOCIATION DU BUDGET** et le **ROI (Retour sur Investissement)**.
   - Fournis des **Coûts Estimés** (Salle, Traiteur, Com) et des **Objectifs Commerciaux** (Nb de prospects, Panier moyen attendu, CA prévisionnel).
   - L'enjeu est de justifier l'efficacité (atteinte des objectifs) et l'efficience (coût par contact) de l'événement.

---

**BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT**
**SESSION 2025**
**E4 – RELATION CLIENT ET NEGOCIATION VENTE**

**FICHE SUJET – nom du CANDIDAT :**

☐ Négociation Vente et Accompagnement de la Relation Client
☑ Organisation et Animation d’un Évènement commercial

| **MODIFICATION DES PARAMÈTRES À PRENDRE EN COMPTE PAR LE CANDIDAT POUR LA SIMULATION** | **DÉTAILS DE LA SITUATION** |
| :--- | :--- |
| **Objet de l’activité** | [Type : Portes Ouvertes, Salon, Petit-déjeuner...] |
| **Date(s) et durée** | [Dates] - Durée simulation : 20 min |
| **Lieu** | [Lieu précis] |
| **Délimitation de Séquence(s)** | [Focus : Validation du Budget et des Objectifs Commerciaux] |
| **Acteur(s) concernés (statut/rôle)** | [M./Mme X, Manager (Jury)] |
| **Contexte de l'évènement** | [Pourquoi cet évènement ? Lancement produit, fidélisation, reconquête...] |
| **Objectifs de la simulation** | **1. Présenter le budget prévisionnel de l'opération.**<br>**2. Justifier la pertinence commerciale (ROI attendu, Cible).**<br>3. Convaincre le manager de valider l'enveloppe budgétaire. |
| **Données Budget (ANNEXE)** | **Postes de Dépenses** : [Lister 3-4 postes clés : Location, Traiteur, Pub... avec montants]<br>**Total Budget demandé** : [Montant Total]<br>**Objectifs attendus** : [Ex: 50 participants, 20 ventes, CA de X€] |
| **Contrainte(s)** | [Le manager trouve le budget Com trop élevé ou doute de l'impact sur les ventes.] |

---

**PAGE 2**

**BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT**
**SESSION 2025**
**E4 – RELATION CLIENT ET NEGOCIATION VENTE**

**FICHE SUJET – nom du JURY**

☐ Négociation Vente et Accompagnement de la Relation Client
☑ Organisation et Animation d’un Évènement commercial

| **MODIFICATION DES PARAMÈTRES À PRENDRE EN COMPTE PAR LE JURY POUR LA SIMULATION** | **DÉTAILS POUR LE JURY** |
| :--- | :--- |
| **Objet de l’activité** | [Idem Candidat] |
| **Identité** | [Rôle : Manager vigilant sur l'utilisation des ressources] |
| **Contexte Managérial** | [Attitude : Vous voulez investir, mais vous exigez des garanties de résultats. Vous challengez l'efficacité.] |
| **Date de la rencontre** | [Date] |
| **Objectifs de la simulation** | [Vérifier que le candidat maîtrise ses coûts et a des objectifs réalistes.] |
| **Consignes de jeu** | - Questionnez le budget : "Pourquoi mettre autant dans le traiteur ?"<br>- Challengez le ROI : "Combien de ventes ferez-vous vraiment ?"<br>- Demandez le "Coût par contact" (Budget / Nb participants). |
| **Éléments de réponse attendus** | - Le candidat doit défendre ses choix budgétaires par des bénéfices clients/image.<br>- Il doit connaître ses indicateurs : Coût Contact, CA prévisionnel.<br>- Il doit proposer un suivi post-événement (relance). |
| **Objections** | 1. "2000€ pour une matinée, c'est cher payé. Garantissez-moi le retour sur investissement."<br>2. "Est-ce qu'on ne pourrait pas réduire la communication ?"<br>3. "Comment allez-vous mesurer l'efficacité de cet événement ?" |

---
""",
    # Other prompts can be added here
}

class GenerateRequest(BaseModel):
    topic: str
    duration_hours: Optional[int] = 4
    target_block: Optional[str] = None
    document_type: Literal["dossier_prof", "dossier_eleve", "jeu_de_role", "jeu_de_role_evenement", "student_fiche_e4"] = "jeu_de_role_evenement" # simplified types for now
    category: Optional[str] = "NDRC"

PROMPT_TEMPLATES["student_fiche_e4"] = """Tu es un expert pédagogique en BTS NDRC.
Ta mission est d'aider un étudiant à rédiger sa **Fiche d'Activité Professionnelle E4 (Négociation Vente)** à partir de ses notes en vrac.

CONTEXTE DE L'ÉTUDIANT :
{topic}

CONSIGNES DE RÉDACTION :
1. Rédige une fiche structurée, professionnelle et conforme aux attentes du jury.
2. Structure attendue :
   - **Titre de la fiche** : Clair et accrocheur.
   - **Contexte** : Description de l'entreprise, de la cible et de l'offre.
   - **Analyse de la situation** : Problématique client, besoins décelés.
   - **Déroulement de la négociation** : Phases de découverte, argumentation, traitement des objections.
   - **Résultats** : Quantitatifs (CA, Marge) et Qualitatifs (Satisfaction client, fidélisation).
   - **Analyse Réflexive** : Ce qui a fonctionné, ce qui est à améliorer.

Ton ton doit être professionnel, précis et valorisant pour l'étudiant. N'invente pas de chiffres s'ils ne sont pas fournis, mets des crochets [A COMPLÉTER] si nécessaire.
"""

class GenerateResponse(BaseModel):
    content: str
    document_type: str
    filename: Optional[str] = None

@router.post("/course", response_model=GenerateResponse)
async def generate_document(request: GenerateRequest, db: Session = Depends(get_db)):
    """
    Generates a specific type of pedagogical document based on the selected BTS track.
    Currently focused on E4 scenario generation.
    """
    if not request.topic:
        raise HTTPException(status_code=400, detail="Topic is required")
    
    try:
        # Determine track, default to NDRC
        track = request.category or "NDRC"
        
        # Get template and format it
        # Fallback to empty string if not found, or default
        template = PROMPT_TEMPLATES.get(request.document_type, PROMPT_TEMPLATES["jeu_de_role_evenement"])
        
        # Format replacing {track} with the actual track name if needed (none in this specific prompt but good practice)
        system_prompt = template # .format(track=track) if needed
        
        user_prompt = f"""Génère le document demandé sur le thème suivant :

**Thème** : {request.topic}
**Durée souhaitée** : {request.duration_hours} heures
"""
        if request.target_block:
            user_prompt += f"**Bloc ciblé** : {request.target_block}\\n"

        user_prompt += f"\\nUtilise le référentiel BTS {track}."
        user_prompt += "\\n\\nIMPORTANT : La première ligne de ta réponse doit être un commentaire HTML caché contenant un nom de fichier court et simplifié (max 30 chars, pas d'espace, pas d'accents, use des underscores) basé sur le nom de l'entreprise ou le sujet principal. Format : `<!-- FILENAME: Nom_Entreprise_Court -->`."

        # Pass track to get_model to ensure correct regulatory grounding
        model = gemini_service.get_model(custom_system_instruction=system_prompt, track=track)
        
        content_parts = []
        
        # Add KB files if needed (skipped for now in knowledge_service)
        kb_files = knowledge_base.get_file_ids_by_category(track)
        # Add KB logic here if files are returned
        
        content_parts.append(user_prompt)
        
        response = model.generate_content(content_parts)
        
        # Extract Filename and Clean Content
        full_text = response.text
        filename = None
        
        # Regex to find <!-- FILENAME: ... -->
        match = re.search(r"<!--\s*FILENAME:\s*(.*?)\s*-->", full_text)
        if match:
            filename = match.group(1).strip()
            # Remove the line from content to avoid showing it
            full_text = full_text.replace(match.group(0), "").strip()
            
        return GenerateResponse(
            content=full_text, 
            document_type=request.document_type,
            filename=filename
        )
    
    except Exception as e:
        print(f"❌ Generation error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class RefineRequest(BaseModel):
    current_content: str
    instruction: str
    track: Optional[str] = "NDRC"

@router.post("/refine", response_model=GenerateResponse)
async def refine_document(request: RefineRequest, db: Session = Depends(get_db)):
    if not request.current_content or not request.instruction:
        raise HTTPException(status_code=400, detail="Content and instruction are required")
    
    try:
        track = request.track or "NDRC"
        
        # System Prompt for the Refinement Agent
        system_prompt = f"""Tu es un Éditeur Pédagogique Senior expert du BTS {track}.
Ta mission est d'améliorer ou de modifier le document pédagogique fourni en suivant STRICTEMENT les instructions de l'utilisateur.

RÈGLES D'OR :
1. CONSERVE la structure Markdown existante (titres, tableaux, listes) sauf si l'instruction demande de la changer.
2. RESPECTE les référentiels officiels du BTS {track}.
3. INTÈGRE les modifications de manière fluide et didactique.
4. NE SOIS PAS BAVARD : Renvoie uniquement le document modifié complet, prêt à l'emploi. Pas de phrase d'intro.
"""
        
        # We reuse the get_model from gemini_service but with our specific refinement system prompt
        model = gemini_service.get_model(custom_system_instruction=system_prompt, track=track)
        
        # The prompt sent to the model includes the content and the instruction
        user_message = f"""Instruction de modification : "{request.instruction}"

Voici le contenu actuel à modifier :

{request.current_content}
"""
        
        response = model.generate_content([user_message])
        
        return GenerateResponse(
            content=response.text,
            document_type="refined", 
            filename=None 
        )

    except Exception as e:
        print(f"❌ Refinement error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
