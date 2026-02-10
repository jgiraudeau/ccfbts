from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_PARAGRAPH_ALIGNMENT
from io import BytesIO
import os
import re

router = APIRouter()

class ScenarioExportRequest(BaseModel):
    title: str
    scenario_type: str
    content: str
    exam_type: str = "E4"
    student_name: str = ""

def extract_field_value(content: str, field_name: str) -> str:
    """Extract a field value from the generated content"""
    patterns = [
        rf"{field_name}\s*:?\s*([^\n]+)",
        rf"#{1,3}\s*{field_name}\s*\n([^\n#]+)",
        rf"\*\*{field_name}\*\*\s*:?\s*([^\n]+)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""

def parse_scenario_content(content: str) -> dict:
    """Parse the generated scenario content into structured fields"""
    fields = {
        'objet': '',
        'date_duree': '',
        'lieu': '',
        'delimitation': '',
        'acteurs': '',
        'historique': '',
        'objectifs': '',
        'informations': '',
        'contraintes': '',
        'identite_client': '',
        'relation_entreprise': '',
        'date_rencontre': '',
        'motivations': '',
        'freins': '',
        'objections': ''
    }
    
    # Try to extract structured information
    lines = content.split('\n')
    current_section = None
    section_content = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if it's a section header
        if line.startswith('#'):
            # Save previous section
            if current_section and section_content:
                content_text = ' '.join(section_content)
                
                # Map sections to fields
                section_lower = current_section.lower()
                if 'objet' in section_lower or 'contexte' in section_lower:
                    fields['objet'] = content_text
                elif 'date' in section_lower or 'durée' in section_lower:
                    fields['date_duree'] = content_text
                elif 'lieu' in section_lower:
                    fields['lieu'] = content_text
                elif 'acteur' in section_lower or 'client' in section_lower or 'identité' in section_lower:
                    fields['acteurs'] = content_text
                    fields['identite_client'] = content_text
                elif 'historique' in section_lower or 'relation' in section_lower:
                    fields['historique'] = content_text
                    fields['relation_entreprise'] = content_text
                elif 'objectif' in section_lower:
                    fields['objectifs'] = content_text
                elif 'information' in section_lower or 'donnée' in section_lower:
                    fields['informations'] = content_text
                elif 'contrainte' in section_lower:
                    fields['contraintes'] = content_text
                elif 'motivation' in section_lower:
                    fields['motivations'] = content_text
                elif 'frein' in section_lower or 'obstacle' in section_lower:
                    fields['freins'] = content_text
                elif 'objection' in section_lower:
                    fields['objections'] = content_text
            
            # Start new section
            current_section = line.replace('#', '').strip()
            section_content = []
        else:
            section_content.append(line)
    
    # Save last section
    if current_section and section_content:
        content_text = ' '.join(section_content)
        section_lower = current_section.lower()
        if 'objet' in section_lower:
            fields['objet'] = content_text
        elif 'objectif' in section_lower:
            fields['objectifs'] = content_text
    
    # If no structured data found, use the title and full content
    if not any(fields.values()):
        fields['objet'] = content[:200] if len(content) > 200 else content
        fields['objectifs'] = "Réaliser la simulation selon le scénario fourni"
    
    return fields

@router.post("/export-scenario/docx")
async def export_scenario_docx(request: ScenarioExportRequest):
    """Export scenario as Word using official template"""
    
    # Load template
    template_path = os.path.join(os.path.dirname(__file__), '..', '..', 'templates', 'PARAMETRES MODIFIES 2024 vierge- Copie copie.docx')
    
    if not os.path.exists(template_path):
        raise HTTPException(status_code=500, detail="Template not found")
    
    doc = Document(template_path)
    
    # Parse the generated content
    fields = parse_scenario_content(request.content)
    
    # Update the student name in paragraphs
    for para in doc.paragraphs:
        if 'nom du CANDIDAT' in para.text:
            para.text = para.text.replace('nom du CANDIDAT :', request.student_name or 'CANDIDAT')
            # Restore formatting
            for run in para.runs:
                run.font.name = 'Calibri Light'
                run.font.size = Pt(10)
                run.font.bold = True
        
        # Update checkboxes based on scenario type
        if 'Négociation Vente' in para.text:
            for run in para.runs:
                if run.font.name == 'Wingdings':
                    is_negociation = 'negociation' in request.scenario_type.lower()
                    run.text = 'þ' if is_negociation else 'o'
        elif 'Evènement commercial' in para.text or 'Événement commercial' in para.text:
            for run in para.runs:
                if run.font.name == 'Wingdings':
                    is_event = 'evenement' in request.scenario_type.lower() or 'event' in request.scenario_type.lower()
                    run.text = 'þ' if is_event else 'o'
    
    # Fill Table 1 (Candidat) - 10 rows
    if len(doc.tables) >= 1:
        table = doc.tables[0]
        
        # Row 2: Objet de l'activité
        if len(table.rows) > 1 and len(table.rows[1].cells) > 1:
            table.rows[1].cells[1].text = request.title or fields['objet']
        
        # Row 3: Date(s) et durée
        if len(table.rows) > 2 and len(table.rows[2].cells) > 1:
            table.rows[2].cells[1].text = fields['date_duree'] or "À définir"
        
        # Row 4: Lieu
        if len(table.rows) > 3 and len(table.rows[3].cells) > 1:
            table.rows[3].cells[1].text = fields['lieu'] or "À définir"
        
        # Row 5: Délimitation de Séquence(s)
        if len(table.rows) > 4 and len(table.rows[4].cells) > 1:
            table.rows[4].cells[1].text = fields['delimitation'] or "Durée: 30-40 minutes"
        
        # Row 6: Acteur(s) concernés
        if len(table.rows) > 5 and len(table.rows[5].cells) > 1:
            table.rows[5].cells[1].text = fields['acteurs'] or fields['identite_client']
        
        # Row 7: Historique de la relation
        if len(table.rows) > 6 and len(table.rows[6].cells) > 1:
            table.rows[6].cells[1].text = fields['historique'] or fields['relation_entreprise']
        
        # Row 8: Objectifs de la simulation
        if len(table.rows) > 7 and len(table.rows[7].cells) > 1:
            table.rows[7].cells[1].text = fields['objectifs']
        
        # Row 9: Informations à exploiter
        if len(table.rows) > 8 and len(table.rows[8].cells) > 1:
            table.rows[8].cells[1].text = fields['informations'] or request.content[:300]
        
        # Row 10: Contrainte(s)
        if len(table.rows) > 9 and len(table.rows[9].cells) > 1:
            table.rows[9].cells[1].text = fields['contraintes'] or "Respecter le cadre professionnel"
    
    # Fill Table 2 (Jury) - 13 rows
    if len(doc.tables) >= 2:
        table = doc.tables[1]
        
        # Row 2: Objet de l'activité
        if len(table.rows) > 1 and len(table.rows[1].cells) > 1:
            table.rows[1].cells[1].text = request.title or fields['objet']
        
        # Row 3: Identité
        if len(table.rows) > 2 and len(table.rows[2].cells) > 1:
            table.rows[2].cells[1].text = fields['identite_client'] or fields['acteurs']
        
        # Row 4: Relation à l'entreprise
        if len(table.rows) > 3 and len(table.rows[3].cells) > 1:
            table.rows[3].cells[1].text = fields['relation_entreprise'] or "Client potentiel"
        
        # Row 5: Date de la rencontre
        if len(table.rows) > 4 and len(table.rows[4].cells) > 1:
            table.rows[4].cells[1].text = fields['date_rencontre'] or fields['date_duree']
        
        # Row 6: Lieu
        if len(table.rows) > 5 and len(table.rows[5].cells) > 1:
            table.rows[5].cells[1].text = fields['lieu'] or "À définir"
        
        # Row 7: Historique de la relation
        if len(table.rows) > 6 and len(table.rows[6].cells) > 1:
            table.rows[6].cells[1].text = fields['historique']
        
        # Row 8: Objectifs de la simulation
        if len(table.rows) > 7 and len(table.rows[7].cells) > 1:
            table.rows[7].cells[1].text = fields['objectifs']
        
        # Row 9: Délimitation de Séquence(s)
        if len(table.rows) > 8 and len(table.rows[8].cells) > 1:
            table.rows[8].cells[1].text = fields['delimitation'] or "30-40 minutes"
        
        # Row 10: Motivations
        if len(table.rows) > 9 and len(table.rows[9].cells) > 1:
            table.rows[9].cells[1].text = fields['motivations'] or "À définir selon le profil"
        
        # Row 11: Freins
        if len(table.rows) > 10 and len(table.rows[10].cells) > 1:
            table.rows[10].cells[1].text = fields['freins'] or "À définir selon le profil"
        
        # Row 12: Contrainte(s)
        if len(table.rows) > 11 and len(table.rows[11].cells) > 1:
            table.rows[11].cells[1].text = fields['contraintes'] or "Respecter le cadre professionnel"
        
        # Row 13: Objections
        if len(table.rows) > 12 and len(table.rows[12].cells) > 1:
            table.rows[12].cells[1].text = fields['objections'] or "À définir selon le contexte"
    
    # Save to buffer
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=Sujet_{request.exam_type}_{request.student_name or 'CANDIDAT'}.docx"}
    )

@router.post("/export-scenario/pdf")
async def export_scenario_pdf(request: ScenarioExportRequest):
    """Export scenario as PDF with official formatting"""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Margins
    left_margin = 2.5 * cm
    right_margin = width - 2.5 * cm
    top_margin = height - 2.5 * cm
    
    y = top_margin
    
    # Header (centered, bold)
    p.setFont("Helvetica-Bold", 10)
    p.drawCentredString(width/2, y, "BTS Négociation et Digitalisation de la Relation Client")
    y -= 15
    p.drawCentredString(width/2, y, "Session 2024")
    y -= 15
    exam_num = request.exam_type[-1] if request.exam_type else '4'
    p.drawCentredString(width/2, y, f"E{exam_num} – RELATION CLIENT et NEGOCIATION VENTE")
    y -= 30
    
    p.drawCentredString(width/2, y, f"FICHE SUJET – {request.student_name or 'CANDIDAT'}")
    y -= 30
    
    # Checkboxes
    p.setFont("Helvetica", 10)
    is_negociation = 'negociation' in request.scenario_type.lower()
    checkbox_checked = "☑" if is_negociation else "☐"
    p.drawString(left_margin, y, f"{checkbox_checked} Négociation Vente et Accompagnement de la Relation Client")
    y -= 15
    
    is_event = 'evenement' in request.scenario_type.lower() or 'event' in request.scenario_type.lower()
    checkbox_checked = "☑" if is_event else "☐"
    p.drawString(left_margin, y, f"{checkbox_checked} Organisation et Animation d'un Evènement commercial")
    y -= 30
    
    # Title
    p.setFont("Helvetica-Bold", 12)
    p.drawString(left_margin, y, request.title)
    y -= 25
    
    # Content
    p.setFont("Helvetica", 10)
    for line in request.content.split('\n'):
        if y < 3 * cm:  # New page if too low
            p.showPage()
            y = top_margin
            p.setFont("Helvetica", 10)
        
        if line.strip():
            if line.startswith('#'):
                # Section header
                clean_line = line.replace('#', '').strip()
                p.setFont("Helvetica-Bold", 11)
                p.drawString(left_margin, y, clean_line)
                p.setFont("Helvetica", 10)
                y -= 18
            else:
                # Wrap long lines
                max_width = right_margin - left_margin
                words = line.split()
                current_line = ""
                
                for word in words:
                    test_line = current_line + " " + word if current_line else word
                    if p.stringWidth(test_line, "Helvetica", 10) < max_width:
                        current_line = test_line
                    else:
                        if current_line:
                            p.drawString(left_margin, y, current_line)
                            y -= 14
                            if y < 3 * cm:
                                p.showPage()
                                y = top_margin
                                p.setFont("Helvetica", 10)
                        current_line = word
                
                if current_line:
                    p.drawString(left_margin, y, current_line)
                    y -= 14
        else:
            y -= 10  # Empty line spacing
    
    p.save()
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Sujet_{request.exam_type}_{request.student_name or 'CANDIDAT'}.pdf"}
    )
