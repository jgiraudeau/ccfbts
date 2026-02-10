from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from io import BytesIO
from reportlab.pdfgen import canvas

router = APIRouter()

class ScenarioExportRequest(BaseModel):
    title: str
    scenario_type: str
    content: str
    exam_type: str = "E4"

@router.post("/export-scenario/pdf")
async def export_scenario_pdf(request: ScenarioExportRequest):
    """Export scenario as PDF - simplified version"""
    buffer = BytesIO()
    
    # Create simple PDF
    p = canvas.Canvas(buffer)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 800, "BTS NDRC - ÉPREUVE " + request.exam_type)
    p.setFont("Helvetica", 12)
    p.drawString(100, 770, request.title)
    
    y = 740
    for line in request.content.split('\n'):
        if y < 50:
            p.showPage()
            y = 800
        p.drawString(100, y, line[:80])  # Limit line length
        y -= 20
    
    p.save()
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Sujet_{request.exam_type}.pdf"}
    )

@router.post("/export-scenario/docx")
async def export_scenario_docx(request: ScenarioExportRequest):
    """Export scenario as Word - simple version"""
    from docx import Document
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    
    doc = Document()
    
    # Header
    header = doc.add_heading('BTS NDRC - ÉPREUVE ' + request.exam_type, level=1)
    header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Title
    doc.add_heading(request.title, level=2)
    doc.add_paragraph()
    
    # Content
    for line in request.content.split('\n'):
        if line.strip():
            doc.add_paragraph(line)
    
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=Sujet_{request.exam_type}.docx"}
    )
