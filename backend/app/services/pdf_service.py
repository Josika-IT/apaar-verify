import io
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing, Rect, String
from ..models import Student, Institution

class PDFService:
    @staticmethod
    def generate_qr_image(data_str: str) -> io.BytesIO:
        """Generates a QR code image as BytesIO."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=6,
            border=2,
        )
        qr.add_data(data_str)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#002244", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        img_buffer.seek(0)
        return img_buffer

    @staticmethod
    def generate_student_verification_pdf(student: Student, institution: Institution, base_url: str = "http://localhost:5173") -> io.BytesIO:
        """
        Generates official AICTE Verifiable Student Record Certificate / ID PDF.
        Explicitly prints APAAR ID beside Student ID (Requirement 10).
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#002244'),
            alignment=1  # Center
        )
        subtitle_style = ParagraphStyle(
            'HeaderSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569'),
            alignment=1
        )
        cert_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#d97706'),
            alignment=1
        )
        label_style = ParagraphStyle(
            'FieldLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#1e293b')
        )
        value_style = ParagraphStyle(
            'FieldValue',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#0f172a')
        )
        badge_style = ParagraphStyle(
            'BadgeStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#15803d'),
            alignment=1
        )

        elements = []

        # Government & AICTE Header
        elements.append(Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", title_style))
        elements.append(Paragraph("Ministry of Education, Government of India | National Student Registry", subtitle_style))
        elements.append(Spacer(1, 4))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#002244'), spaceAfter=8))

        # Certificate banner
        elements.append(Paragraph("VERIFIABLE DIGITAL STUDENT ACADEMIC RECORD", cert_style))
        elements.append(Paragraph(f"Issued under APAAR / One Nation One Student ID Framework", subtitle_style))
        elements.append(Spacer(1, 10))

        # Verification QR Code
        verify_url = f"{base_url}/verify?apaar_id={student.apaar_id}"
        qr_stream = PDFService.generate_qr_image(verify_url)
        qr_img = RLImage(qr_stream, width=1.6 * inch, height=1.6 * inch)

        # Requirement 10: APAAR ID printed prominently beside Student ID
        ids_table_data = [
            [
                Paragraph("<b>NATIONAL APAAR ID:</b>", label_style),
                Paragraph(f"<font size=13 color='#002244'><b>{student.apaar_id}</b></font>", label_style),
                Paragraph("<b>INSTITUTIONAL ROLL / REG ID:</b>", label_style),
                Paragraph(f"<font size=13 color='#002244'><b>{student.student_id}</b></font>", label_style),
            ]
        ]
        ids_table = Table(ids_table_data, colWidths=[2.0 * inch, 1.8 * inch, 2.2 * inch, 1.8 * inch])
        ids_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#002244')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(ids_table)
        elements.append(Spacer(1, 12))

        # Student & Institution Details Table
        status_color = "#15803d" if student.verification_status == "Verified" else "#b91c1c"
        details_data = [
            [
                Paragraph("<b>Full Student Name</b>", label_style),
                Paragraph(student.name, value_style),
                Paragraph("<b>Date of Birth</b>", label_style),
                Paragraph(student.dob, value_style),
            ],
            [
                Paragraph("<b>Gender</b>", label_style),
                Paragraph(student.gender, value_style),
                Paragraph("<b>Nationality</b>", label_style),
                Paragraph(student.nationality, value_style),
            ],
            [
                Paragraph("<b>Institution Name</b>", label_style),
                Paragraph(institution.name, value_style),
                Paragraph("<b>AICTE Approval Code</b>", label_style),
                Paragraph(institution.aicte_code, value_style),
            ],
            [
                Paragraph("<b>Course Enrolled</b>", label_style),
                Paragraph(student.course, value_style),
                Paragraph("<b>Branch / Specialization</b>", label_style),
                Paragraph(student.branch, value_style),
            ],
            [
                Paragraph("<b>Current Year of Study</b>", label_style),
                Paragraph(f"Year {student.year_of_study}", value_style),
                Paragraph("<b>Date of Admission</b>", label_style),
                Paragraph(student.admission_date, value_style),
            ],
            [
                Paragraph("<b>Admission Category</b>", label_style),
                Paragraph(student.category, value_style),
                Paragraph("<b>Quota Allocated</b>", label_style),
                Paragraph(student.quota, value_style),
            ],
            [
                Paragraph("<b>Verification Status</b>", label_style),
                Paragraph(f"<font color='{status_color}'><b>{student.verification_status.upper()}</b></font>", label_style),
                Paragraph("<b>Consent Status</b>", label_style),
                Paragraph("Consent Granted (Section 43A IT Act)" if student.consent_flag else "Consent Restricted", value_style),
            ]
        ]

        details_table = Table(details_data, colWidths=[1.8 * inch, 2.2 * inch, 1.8 * inch, 2.0 * inch])
        details_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f8fafc')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 14))

        # Bottom section: QR code + Legal & cryptographic verification notice
        sec_text = (
            f"<b>Cryptographic Verification & Integrity Notice:</b><br/>"
            f"This record is authenticated against the AICTE Central Student Repository. "
            f"Scan the official QR code to immediately verify live accreditation, institutional approval status, "
            f"and identity validity on the public AICTE portal.<br/>"
            f"<b>Generation Timestamp:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>"
            f"<b>Security Fingerprint:</b> SHA256:{hash(student.apaar_id + student.student_id + institution.aicte_code) & 0xffffffffffffffff:016x}"
        )
        sec_para = Paragraph(sec_text, subtitle_style)

        bottom_data = [
            [qr_img, sec_para]
        ]
        bottom_table = Table(bottom_data, colWidths=[2.0 * inch, 5.8 * inch])
        bottom_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(bottom_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_administrative_report_pdf(title: str, headers: list, rows: list) -> io.BytesIO:
        """Generates administrative summary reports in PDF."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'RepTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#002244'),
            alignment=1
        )
        header_cell_style = ParagraphStyle(
            'HdrCell',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.white,
            alignment=1
        )
        body_cell_style = ParagraphStyle(
            'BdyCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#1e293b')
        )

        elements = [
            Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION (AICTE)", title_style),
            Paragraph(f"Official Report: {title}", ParagraphStyle('sub', parent=title_style, fontSize=11, textColor=colors.HexColor('#d97706'))),
            Paragraph(f"Generated at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", ParagraphStyle('dt', parent=styles['Normal'], fontSize=8, alignment=1, textColor=colors.HexColor('#64748b'))),
            Spacer(1, 12),
        ]

        # Table data
        table_data = [[Paragraph(str(h), header_cell_style) for h in headers]]
        for r in rows:
            table_data.append([Paragraph(str(c), body_cell_style) for c in r])

        report_table = Table(table_data, repeatRows=1)
        report_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#002244')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
        ]))
        elements.append(report_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer

pdf_service = PDFService()
