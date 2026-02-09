
import os
from pathlib import Path
import docx
from .gemini_service import gemini_service

# HARDCODED PATH TO V1 KNOWLEDGE (To share the same KB)
KNOWLEDGE_DIR = Path('/Users/imac2jacques/Desktop/antigravity/profvirtuel/backend/knowledge')

if not KNOWLEDGE_DIR.exists():
    print(f"⚠️ Knowledge directory does not exist: {KNOWLEDGE_DIR}")
else:
    print(f"✅ Knowledge directory found at: {KNOWLEDGE_DIR}")

class KnowledgeBase:
    def __init__(self):
        self.files = []
        print(f"📚 Knowledge Base initialized. Root: {KNOWLEDGE_DIR}")

    def get_file_ids_by_category(self, category: str):
        # Placeholder: returning empty list for now to avoid complex file loading logic here 
        # unless user asks for it. The V1 logic uploaded files. Here we might just want to 
        # let Gemini read them if needed or use RAG later.
        # For scenario generation, we just need the PROMPT templates.
        # The V1 logic was uploading files to Gemini on startup. Let's skip that heavy process for now
        # to ensure fast startup, and rely on prompts.
        # If we need specific files, we can add them later.
        return []

knowledge_base = KnowledgeBase()
