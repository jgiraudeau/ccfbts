from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_PARAGRAPH_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from io import BytesIO
import os

router = APIRouter()

class ScenarioExportRequest(BaseModel):
    title: str
    scenario_type: str
    content: str
    exam_type: str = "E4"
    student_name: str = ""

def add_checkbox(paragraph, checked=False):
    """Add a checkbox (Wingdings) to a paragraph"""
    run = paragraph.add_run()
    run.font.name = 'Wingdings'
    run.font.size = Pt(10)
    run.text = 'þ' if checked else 'o'  # þ = checked box, o = empty box
    return run

@router.post("/export-scenario/docx")
async def export_scenario_docx(request: ScenarioExportRequest):
    """Export scenario as Word using official template"""
    
    # Create new document with official formatting
    doc = Document()
    
    # Set margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.98)
        section.bottom_margin = Inches(0.98)
        section.left_margin = Inches(0.98)
        section.right_margin = Inches(0.98)
    
    # Header - Line 1
    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p1.add_run('BTS Négociation et Digitalisation de la Relation Client')
    run.font.name = 'Calibri Light'
    run.font.size = Pt(10)
    run.font.bold = True
    
    # Header - Line 2
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p2.add_run('Session 2024')
    run.font.name = 'Calibri Light'
    run.font.size = Pt(10)
    run.font.bold = True
    
    # Header - Line 3
    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    exam_num = request.exam_type[-1] if request.exam_type else '4'
    run = p3.add_run(f'E{exam_num} – RELATION CLIENT et NEGOCIATION VENTE')
    run.font.name = 'Calibri Light'
    run.font.size = Pt(10)
    run.font.bold = True
    
    doc.add_paragraph()  # Empty line
    
    # Fiche sujet
    p4 = doc.add_paragraph()
    p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    student_text = request.student_name if request.student_name else "CANDIDAT"
    run = p4.add_run(f'FICHE SUJET – {student_text}')
    run.font.name = 'Calibri Light'
    run.font.size = Pt(10)
    run.font.bold = True
    
    doc.add_paragraph()  # Empty line
    
    # Checkboxes for scenario type
    p5 = doc.add_paragraph()
    p5.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    # Add checkbox
    run_check = p5.add_run()
    run_check.font.name = 'Wingdings'
    run_check.font.size = Pt(10)
    is_negociation = 'negociation' in request.scenario_type.lower()
    run_check.text = 'þ' if is_negociation else 'o'
    # Add text
    run = p5.add_run(' Négociation Vente et Accompagnement de la Relation Client')
    run.font.name = 'Calibri Light'
    run.font.size = Pt(10)
    
    p6 = doc.add_paragraph()
    p6.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    # Add checkbox
    run_check = p6.add_run()
    run_check.font.name = 'Wingdings'
    run_check.font.size = Pt(10)
    is_event = 'evenement' in request.scenario_type.lower() or 'event' in request.scenario_type.lower()
    run_check.text = 'þ' if is_event else 'o'
    # Add text
    run = p6.add_run(' Organisation et Animation d\'un Evènement commercial')
    run.font.name = 'Calibri Light'
    run.font.size = Pt(10)
    
    doc.add_paragraph()  # Empty line
    doc.add_paragraph()  # Empty line
    
    # Title of the scenario
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p_title.add_run(request.title)
    run.font.name = 'Calibri Light'
    run.font.size = Pt(12)
    run.font.bold = True
    
    doc.add_paragraph()  # Empty line
    
    # Content
    for line in request.content.split('\n'):
        if line.strip():
            if line.startswith('#'):
                # Section header
                clean_line = line.replace('#', '').strip()
                p = doc.add_paragraph()
                run = p.add_run(clean_line)
                run.font.name = 'Calibri Light'
                run.font.size = Pt(11)
                run.font.bold = True
            else:
                p = doc.add_paragraph(line)
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                for run in p.runs:
                    run.font.name = 'Calibri Light'
                    run.font.size = Pt(10)
        else:
            doc.add_paragraph()  # Empty line
    
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
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
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
    p.drawCentredString(width/2, y, f"E{request.exam_type[-1]} – RELATION CLIENT et NEGOCIATION VENTE")
    y -= 30
    
    p.drawCentredString(width/2, y, f"FICHE SUJET – {request.student_name or 'CANDIDAT'}")
    y -= 30
    
    # Checkboxes
    p.setFont("Helvetica", 10)
    checkbox_checked = "☑" if request.scenario_type == 'jeu_de_role_negociation' else "☐"
    p.drawString(left_margin, y, f"{checkbox_checked} Négociation Vente et Accompagnement de la Relation Client")
    y -= 15
    
    checkbox_checked = "☑" if request.scenario_type == 'jeu_de_role_evenement' else "☐"
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
