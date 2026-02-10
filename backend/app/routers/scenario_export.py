from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

router = APIRouter()

class ScenarioExportRequest(BaseModel):
    title: str
    scenario_type: str
    content: str
    exam_type: str = "E4"

@router.post("/export-scenario/pdf")
async def export_scenario_pdf(request: ScenarioExportRequest):
    """Export scenario as PDF with official exam formatting"""
    buffer = BytesIO()
    
    # Create PDF
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                           rightMargin=2*cm, leftMargin=2*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=RGBColor(0, 0, 128),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=RGBColor(64, 64, 64),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        spaceAfter=12,
        leading=14
    )
    
    # Header
    story.append(Paragraph("BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT", title_style))
    story.append(Paragraph(f"ÉPREUVE {request.exam_type}", subtitle_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Title
    story.append(Paragraph(request.title, subtitle_style))
    story.append(Spacer(1, 0.3*cm))
    
    # Content
    for line in request.content.split('\n'):
        if line.strip():
            if line.startswith('#'):
                # Section header
                clean_line = line.replace('#', '').strip()
                story.append(Paragraph(clean_line, subtitle_style))
            else:
                story.append(Paragraph(line, body_style))
        else:
            story.append(Spacer(1, 0.2*cm))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Sujet_{request.exam_type}.pdf"}
    )

@router.post("/export-scenario/docx")
async def export_scenario_docx(request: ScenarioExportRequest):
    """Export scenario as Word document with official exam formatting"""
    doc = Document()
    
    # Set margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
    
    # Header
    header = doc.add_heading('BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT', level=1)
    header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    header.runs[0].font.color.rgb = RGBColor(0, 0, 128)
    
    exam_header = doc.add_heading(f'ÉPREUVE {request.exam_type}', level=2)
    exam_header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    exam_header.runs[0].font.color.rgb = RGBColor(64, 64, 64)
    
    doc.add_paragraph()  # Spacer
    
    # Title
    title_para = doc.add_heading(request.title, level=2)
    title_para.runs[0].font.size = Pt(14)
    title_para.runs[0].font.color.rgb = RGBColor(0, 0, 0)
    
    doc.add_paragraph()  # Spacer
    
    # Content
    for line in request.content.split('\n'):
        if line.strip():
            if line.startswith('#'):
                # Section header
                clean_line = line.replace('#', '').strip()
                heading = doc.add_heading(clean_line, level=3)
                heading.runs[0].font.size = Pt(12)
                heading.runs[0].font.color.rgb = RGBColor(51, 51, 51)
            else:
                para = doc.add_paragraph(line)
                para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                para_format = para.paragraph_format
                para_format.space_after = Pt(6)
        else:
            doc.add_paragraph()  # Empty line
    
    # Save to buffer
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=Sujet_{request.exam_type}.docx"}
    )
