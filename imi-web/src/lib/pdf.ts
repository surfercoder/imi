import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface GenerateInformePDFOptions {
  patientName: string;
  patientPhone: string;
  date: string;
  content: string;
}

function sanitizeForPdf(text: string): string {
  return text.replace(/[^\x00-\xFF]/g, "").replace(/\s+/g, " ").trim();
}

export async function generateInformePDF({
  patientName,
  patientPhone,
  date,
  content,
}: GenerateInformePDFOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  patientName = sanitizeForPdf(patientName);
  patientPhone = sanitizeForPdf(patientPhone);
  content = content.replace(/[^\x00-\xFF]/g, " ");

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawText = (
    text: string,
    x: number,
    currentY: number,
    font: typeof helvetica,
    size: number,
    color = rgb(0.1, 0.1, 0.1)
  ) => {
    page.drawText(text, { x, y: currentY, font, size, color });
  };

  const wrapText = (text: string, maxWidth: number, font: typeof helvetica, size: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const primaryColor = rgb(0.08, 0.35, 0.65);
  const lightGray = rgb(0.95, 0.95, 0.97);

  page.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: primaryColor,
  });

  drawText("IMI", margin, pageHeight - 40, helveticaBold, 22, rgb(1, 1, 1));
  drawText("Informe Médico", margin, pageHeight - 60, helvetica, 12, rgb(0.85, 0.9, 1));
  drawText(date, pageWidth - margin - 80, pageHeight - 50, helvetica, 10, rgb(0.85, 0.9, 1));

  y = pageHeight - 110;

  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: contentWidth,
    height: 50,
    color: lightGray,
    borderColor: rgb(0.88, 0.88, 0.92),
    borderWidth: 1,
  });

  drawText("Paciente:", margin + 12, y - 18, helveticaBold, 10, rgb(0.4, 0.4, 0.5));
  drawText(patientName, margin + 12, y - 32, helveticaBold, 13, rgb(0.08, 0.08, 0.12));
  drawText(`Tel: ${patientPhone}`, margin + 12, y - 44, helvetica, 9, rgb(0.5, 0.5, 0.6));

  y -= 70;

  const paragraphs = content.split(/\n+/);

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      y -= 8;
      continue;
    }

    const trimmed = paragraph.trim();
    const isSectionHeader =
      trimmed.endsWith(":") ||
      trimmed.startsWith("##") ||
      trimmed.startsWith("**") ||
      /^[A-ZÁÉÍÓÚÑ\s]{4,}:/.test(trimmed);

    const cleanText = trimmed
      .replace(/^#+\s*/, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "");

    if (isSectionHeader) {
      ensureSpace(30);
      y -= 10;

      page.drawRectangle({
        x: margin,
        y: y - 18,
        width: 3,
        height: 18,
        color: primaryColor,
      });

      drawText(cleanText, margin + 10, y - 14, helveticaBold, 11, primaryColor);
      y -= 26;
    } else {
      const lines = wrapText(cleanText, contentWidth, helvetica, 10);
      for (const line of lines) {
        ensureSpace(16);
        drawText(line, margin, y, helvetica, 10);
        y -= 14;
      }
      y -= 4;
    }
  }

  y -= 20;
  ensureSpace(60);

  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.85),
  });

  y -= 20;
  drawText(
    "Este informe fue generado automáticamente por IMI.",
    margin,
    y,
    helvetica,
    8,
    rgb(0.6, 0.6, 0.65)
  );
  y -= 12;
  drawText(
    "Ante cualquier duda, consulte a su médico.",
    margin,
    y,
    helvetica,
    8,
    rgb(0.6, 0.6, 0.65)
  );

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
