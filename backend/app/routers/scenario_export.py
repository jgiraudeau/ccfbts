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

def extract_table_from_markdown(content: str, table_index: int = 0) -> dict:
    """Extract a markdown table and return field-value pairs"""
    # Find all markdown tables
    table_pattern = r'\|([^\n]+)\|([^\n]+)\|'
    matches = re.findall(table_pattern, content)
    
    if not matches:
        return {}
    
    # Skip header and separator rows
    data_rows = [m for m in matches if not m[0].strip().startswith(':') and not m[0].strip().startswith('**MODIFICATION')]
    
    # Split into two tables (candidat and jury)
    # First table is before "PAGE 2" or "FICHE SUJET – nom du JURY"
    split_marker = content.find('FICHE SUJET – nom du JURY')
    if split_marker == -1:
        split_marker = content.find('PAGE 2')
    
    result = {}
    
    for row in data_rows:
        field = row[0].strip().strip('*').strip()
        value = row[1].strip().strip('*').strip()
        
        # Clean up field names
        field_clean = field.lower()
        
        # Only include rows from the correct table
        row_pos = content.find(f"|{row[0]}|{row[1]}|")
        if table_index == 0 and split_marker > 0 and row_pos > split_marker:
            continue  # Skip jury table for candidat
        if table_index == 1 and split_marker > 0 and row_pos < split_marker:
            continue  # Skip candidat table for jury
        
        # Map to standardized keys
        if 'objet' in field_clean:
            result['objet'] = value
        elif 'date' in field_clean and 'durée' in field_clean:
            result['date_duree'] = value
        elif 'lieu' in field_clean:
            result['lieu'] = value
        elif 'délimitation' in field_clean or 'delimitation' in field_clean:
            result['delimitation'] = value
        elif 'acteur' in field_clean:
            result['acteurs'] = value
        elif 'historique' in field_clean:
            result['historique'] = value
        elif 'objectif' in field_clean and 'simulation' in field_clean:
            result['objectifs'] = value
        elif 'information' in field_clean:
            result['informations'] = value
        elif 'contrainte' in field_clean:
            result['contraintes'] = value
        elif 'identité' in field_clean or 'identite' in field_clean:
            result['identite'] = value
        elif 'relation' in field_clean and 'entreprise' in field_clean:
            result['relation_entreprise'] = value
        elif 'date' in field_clean and 'rencontre' in field_clean:
            result['date_rencontre'] = value
        elif 'motivation' in field_clean:
            result['motivations'] = value
        elif 'frein' in field_clean:
            result['freins'] = value
        elif 'objection' in field_clean:
            result['objections'] = value
        elif 'contexte' in field_clean:
            result['contexte'] = value
    
    return result

@router.post("/export-scenario/docx")
async def export_scenario_docx(request: ScenarioExportRequest):
    """Export scenario as Word using official template"""
    
    # Load template
    template_path = os.path.join(os.path.dirname(__file__), '..', '..', 'templates', 'PARAMETRES MODIFIES 2024 vierge- Copie copie.docx')
    
    if not os.path.exists(template_path):
        raise HTTPException(status_code=500, detail="Template not found")
    
    doc = Document(template_path)
    
    # Extract data from markdown tables in generated content
    candidat_fields = extract_table_from_markdown(request.content, table_index=0)
    jury_fields = extract_table_from_markdown(request.content, table_index=1)
    
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
            table.rows[1].cells[1].text = candidat_fields.get('objet', request.title)[:200]
        
        # Row 3: Date(s) et durée
        if len(table.rows) > 2 and len(table.rows[2].cells) > 1:
            table.rows[2].cells[1].text = candidat_fields.get('date_duree', 'À définir')[:150]
        
        # Row 4: Lieu
        if len(table.rows) > 3 and len(table.rows[3].cells) > 1:
            table.rows[3].cells[1].text = candidat_fields.get('lieu', 'À définir')[:150]
        
        # Row 5: Délimitation de Séquence(s)
        if len(table.rows) > 4 and len(table.rows[4].cells) > 1:
            table.rows[4].cells[1].text = candidat_fields.get('delimitation', 'Durée: 30-40 minutes')[:200]
        
        # Row 6: Acteur(s) concernés
        if len(table.rows) > 5 and len(table.rows[5].cells) > 1:
            table.rows[5].cells[1].text = candidat_fields.get('acteurs', 'Client/Prospect')[:250]
        
        # Row 7: Historique de la relation
        if len(table.rows) > 6 and len(table.rows[6].cells) > 1:
            table.rows[6].cells[1].text = candidat_fields.get('historique', 'Première prise de contact')[:300]
        
        # Row 8: Objectifs de la simulation
        if len(table.rows) > 7 and len(table.rows[7].cells) > 1:
            table.rows[7].cells[1].text = candidat_fields.get('objectifs', 'Réaliser la simulation selon le scénario')[:300]
        
        # Row 9: Informations à exploiter
        if len(table.rows) > 8 and len(table.rows[8].cells) > 1:
            table.rows[8].cells[1].text = candidat_fields.get('informations', 'Voir le scénario détaillé')[:400]
        
        # Row 10: Contrainte(s)
        if len(table.rows) > 9 and len(table.rows[9].cells) > 1:
            table.rows[9].cells[1].text = candidat_fields.get('contraintes', 'Respecter le cadre professionnel')[:250]
    
    # Fill Table 2 (Jury) - 13 rows
    if len(doc.tables) >= 2:
        table = doc.tables[1]
        
        # Row 2: Objet de l'activité
        if len(table.rows) > 1 and len(table.rows[1].cells) > 1:
            table.rows[1].cells[1].text = jury_fields.get('objet', candidat_fields.get('objet', request.title))[:200]
        
        # Row 3: Identité
        if len(table.rows) > 2 and len(table.rows[2].cells) > 1:
            table.rows[2].cells[1].text = jury_fields.get('identite', 'Profil à définir')[:250]
        
        # Row 4: Relation à l'entreprise
        if len(table.rows) > 3 and len(table.rows[3].cells) > 1:
            table.rows[3].cells[1].text = jury_fields.get('relation_entreprise', 'Client potentiel')[:200]
        
        # Row 5: Date de la rencontre
        if len(table.rows) > 4 and len(table.rows[4].cells) > 1:
            table.rows[4].cells[1].text = jury_fields.get('date_rencontre', candidat_fields.get('date_duree', 'À définir'))[:150]
        
        # Row 6: Lieu
        if len(table.rows) > 5 and len(table.rows[5].cells) > 1:
            table.rows[5].cells[1].text = jury_fields.get('lieu', candidat_fields.get('lieu', 'À définir'))[:150]
        
        # Row 7: Historique de la relation
        if len(table.rows) > 6 and len(table.rows[6].cells) > 1:
            table.rows[6].cells[1].text = jury_fields.get('historique', candidat_fields.get('historique', 'Première prise de contact'))[:300]
        
        # Row 8: Objectifs de la simulation
        if len(table.rows) > 7 and len(table.rows[7].cells) > 1:
            table.rows[7].cells[1].text = jury_fields.get('objectifs', 'Jouer le rôle selon le profil défini')[:300]
        
        # Row 9: Délimitation de Séquence(s)
        if len(table.rows) > 8 and len(table.rows[8].cells) > 1:
            table.rows[8].cells[1].text = jury_fields.get('delimitation', candidat_fields.get('delimitation', '30-40 minutes'))[:200]
        
        # Row 10: Motivations
        if len(table.rows) > 9 and len(table.rows[9].cells) > 1:
            table.rows[9].cells[1].text = jury_fields.get('motivations', 'À définir selon le profil')[:250]
        
        # Row 11: Freins
        if len(table.rows) > 10 and len(table.rows[10].cells) > 1:
            table.rows[10].cells[1].text = jury_fields.get('freins', 'À définir selon le profil')[:250]
        
        # Row 12: Contrainte(s)
        if len(table.rows) > 11 and len(table.rows[11].cells) > 1:
            table.rows[11].cells[1].text = jury_fields.get('contraintes', candidat_fields.get('contraintes', 'Respecter le cadre professionnel'))[:250]
        
        # Row 13: Objections
        if len(table.rows) > 12 and len(table.rows[12].cells) > 1:
            table.rows[12].cells[1].text = jury_fields.get('objections', 'À définir selon le contexte')[:300]
    
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
    """Export scenario as PDF matching the Word template structure"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                           rightMargin=2.5*cm, leftMargin=2.5*cm,
                           topMargin=2.5*cm, bottomMargin=2.5*cm)
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=6
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        fontSize=9,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT
    )
    
    cell_style = ParagraphStyle(
        'CellStyle',
        fontSize=9,
        fontName='Helvetica',
        alignment=TA_LEFT
    )
    
    # Extract data from markdown tables
    candidat_fields = extract_table_from_markdown(request.content, table_index=0)
    jury_fields = extract_table_from_markdown(request.content, table_index=1)
    
    # Header
    story.append(Paragraph("BTS Négociation et Digitalisation de la Relation Client", title_style))
    story.append(Paragraph("Session 2024", title_style))
    exam_num = request.exam_type[-1] if request.exam_type else '4'
    story.append(Paragraph(f"E{exam_num} – RELATION CLIENT et NEGOCIATION VENTE", title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Fiche sujet
    story.append(Paragraph(f"FICHE SUJET – {request.student_name or 'CANDIDAT'}", title_style))
    story.append(Spacer(1, 0.3*cm))
    
    # Checkboxes
    is_negociation = 'negociation' in request.scenario_type.lower()
    is_event = 'evenement' in request.scenario_type.lower() or 'event' in request.scenario_type.lower()
    checkbox_neg = "☑" if is_negociation else "☐"
    checkbox_evt = "☑" if is_event else "☐"
    
    story.append(Paragraph(f"{checkbox_neg} Négociation Vente et Accompagnement de la Relation Client", cell_style))
    story.append(Paragraph(f"{checkbox_evt} Organisation et Animation d'un Evènement commercial", cell_style))
    story.append(Spacer(1, 0.5*cm))
    
    # TABLE 1: FICHE CANDIDAT
    story.append(Paragraph("FICHE CANDIDAT", title_style))
    story.append(Spacer(1, 0.2*cm))
    
    table1_data = [
        [Paragraph("Objet de l'activité", header_style), 
         Paragraph(candidat_fields.get('objet', request.title)[:200], cell_style)],
        [Paragraph("Date(s) et durée", header_style), 
         Paragraph(candidat_fields.get('date_duree', 'À définir')[:150], cell_style)],
        [Paragraph("Lieu", header_style), 
         Paragraph(candidat_fields.get('lieu', 'À définir')[:150], cell_style)],
        [Paragraph("Délimitation de Séquence(s)", header_style), 
         Paragraph(candidat_fields.get('delimitation', 'Durée: 30-40 minutes')[:200], cell_style)],
        [Paragraph("Acteur(s) concernés", header_style), 
         Paragraph(candidat_fields.get('acteurs', 'Client/Prospect')[:250], cell_style)],
        [Paragraph("Historique de la relation", header_style), 
         Paragraph(candidat_fields.get('historique', 'Première prise de contact')[:300], cell_style)],
        [Paragraph("Objectifs de la simulation", header_style), 
         Paragraph(candidat_fields.get('objectifs', 'Réaliser la simulation selon le scénario')[:300], cell_style)],
        [Paragraph("Informations à exploiter", header_style), 
         Paragraph(candidat_fields.get('informations', 'Voir le scénario détaillé')[:400], cell_style)],
        [Paragraph("Contrainte(s)", header_style), 
         Paragraph(candidat_fields.get('contraintes', 'Respecter le cadre professionnel')[:250], cell_style)],
    ]
    
    table1 = Table(table1_data, colWidths=[5*cm, 11*cm])
    table1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    story.append(table1)
    story.append(PageBreak())
    
    # TABLE 2: FICHE JURY
    story.append(Paragraph("FICHE JURY", title_style))
    story.append(Spacer(1, 0.2*cm))
    
    table2_data = [
        [Paragraph("Objet de l'activité", header_style), 
         Paragraph(jury_fields.get('objet', candidat_fields.get('objet', request.title))[:200], cell_style)],
        [Paragraph("Identité", header_style), 
         Paragraph(jury_fields.get('identite', 'Profil à définir')[:250], cell_style)],
        [Paragraph("Relation à l'entreprise", header_style), 
         Paragraph(jury_fields.get('relation_entreprise', 'Client potentiel')[:200], cell_style)],
        [Paragraph("Date de la rencontre", header_style), 
         Paragraph(jury_fields.get('date_rencontre', candidat_fields.get('date_duree', 'À définir'))[:150], cell_style)],
        [Paragraph("Lieu", header_style), 
         Paragraph(jury_fields.get('lieu', candidat_fields.get('lieu', 'À définir'))[:150], cell_style)],
        [Paragraph("Historique de la relation", header_style), 
         Paragraph(jury_fields.get('historique', candidat_fields.get('historique', 'Première prise de contact'))[:300], cell_style)],
        [Paragraph("Objectifs de la simulation", header_style), 
         Paragraph(jury_fields.get('objectifs', 'Jouer le rôle selon le profil défini')[:300], cell_style)],
        [Paragraph("Délimitation de Séquence(s)", header_style), 
         Paragraph(jury_fields.get('delimitation', candidat_fields.get('delimitation', '30-40 minutes'))[:200], cell_style)],
        [Paragraph("Motivations", header_style), 
         Paragraph(jury_fields.get('motivations', 'À définir selon le profil')[:250], cell_style)],
        [Paragraph("Freins", header_style), 
         Paragraph(jury_fields.get('freins', 'À définir selon le profil')[:250], cell_style)],
        [Paragraph("Contrainte(s)", header_style), 
         Paragraph(jury_fields.get('contraintes', candidat_fields.get('contraintes', 'Respecter le cadre professionnel'))[:250], cell_style)],
        [Paragraph("Objections", header_style), 
         Paragraph(jury_fields.get('objections', 'À définir selon le contexte')[:300], cell_style)],
    ]
    
    table2 = Table(table2_data, colWidths=[5*cm, 11*cm])
    table2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    story.append(table2)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Sujet_{request.exam_type}_{request.student_name or 'CANDIDAT'}.pdf"}
    )
