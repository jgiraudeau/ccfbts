
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pathlib import Path

# Load env vars safely by finding the backend root (2 levels up from services)
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
print(f"DEBUG: Loading .env from {env_path}")
API_KEY = os.getenv("GOOGLE_API_KEY")

# DEBUG: Print loaded keys to debug logs (masked)
if API_KEY:
    print(f"DEBUG: GOOGLE_API_KEY found, length: {len(API_KEY)}")
    print(f"DEBUG: GOOGLE_API_KEY prefix: {API_KEY[:4]}...")
else:
    print("❌ ERROR: GOOGLE_API_KEY is MISSING in Environment.")

REGULATORY_GROUNDINGS = {
    "NDRC": """
RÈGLES OFFICIELLES BTS NDRC (Source : Circulaire 2024) - À APPLIQUER STRICTEMENT :
- E4 (Relation client et négociation-vente) : Peut être en CCF ou Ponctuel Oral.
- E5 A (Relation client à distance et digitalisation) : Épreuve exclusivement PONCTUELLE ÉCRITE (3h). Ne peut JAMAIS être au format CCF.
- E5 B (Relation client à distance et digitalisation) : Épreuve exclusivement PONCTUELLE PRATIQUE (Poste informatique).
- E6 (Relation client et animation de réseaux) : Peut être en CCF ou Ponctuel Oral.
- E11 (Culture Générale) & E3 (CEJM) : Épreuves exclusivement PONCTUELLES ÉCRITES.
- Bloc 2 (Animation Réseaux / Digitalisation) : Soumis à des règles de non-CCF pour certaines parties.

CONSIGNE : Ne jamais inventer de modalités d'examen. Si une demande de l'utilisateur contredit ces règles (ex: demander un CCF pour l'E5), refuse poliment en citant le règlement.
""",
    # Other tracks can be added here
}

class LegacyCompatibleModel:
    """Wraps the new google-genai Client to mimic the old GenerativeModel behavior."""
    def __init__(self, client: genai.Client, model_name: str, system_instruction: str):
        self.client = client
        self.model_name = model_name
        self.system_instruction = system_instruction

    def generate_content(self, contents):
        config = types.GenerateContentConfig(system_instruction=self.system_instruction)
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            return response
        except Exception as e:
            print(f"❌ Gemini generate_content failed: {e}")
            raise e
    
    def start_chat(self, history=None):
        return LegacyCompatibleChat(self.client, self.model_name, self.system_instruction, history)

class LegacyCompatibleChat:
    def __init__(self, client, model_name, system_instruction, history):
        self.client = client
        self.model_name = model_name
        self.config = types.GenerateContentConfig(system_instruction=system_instruction)
        self.chat = self.client.chats.create(
            model=model_name,
            config=self.config,
            history=history or []
        )

    def send_message(self, message):
        return self.chat.send_message(message)

class GeminiService:
    def __init__(self):
        self._model_name = None
        self.client = None
        if not API_KEY:
             print("⚠️ WARNING: GOOGLE_API_KEY is missing. Gemini features will fail.")
             return
        
        try:
            self.client = genai.Client(api_key=API_KEY)
        except Exception as e:
            print(f"❌ Gemini config failed: {e}")

    @property
    def model_name(self):
        if self._model_name:
            return self._model_name
        
        try:
            # Simple fallback for now since list call might fail if not authenticated
            self._model_name = "gemini-2.0-flash" 
        except Exception as e:
             self._model_name = "gemini-1.5-flash"
        
        return self._model_name

    def get_model(self, custom_system_instruction: str = "", track: str = "NDRC"):
        """Returns a LegacyCompatibleModel with regulatory grounding and custom instructions."""
        grounding = REGULATORY_GROUNDINGS.get(track, REGULATORY_GROUNDINGS["NDRC"])
        full_system_instruction = grounding
        if custom_system_instruction:
            full_system_instruction += "\n" + custom_system_instruction
        
        return LegacyCompatibleModel(
            client=self.client,
            model_name=self.model_name,
            system_instruction=full_system_instruction
        )

gemini_service = GeminiService()
