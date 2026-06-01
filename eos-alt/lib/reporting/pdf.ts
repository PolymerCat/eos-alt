import type { GeneratedReport } from "@/types/reporting";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT_MARGIN = 54;
const TOP_MARGIN = 64;
const LINE_HEIGHT = 15;
const MAX_LINE_LENGTH = 82;

function escapePdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(value: string, maxLength = MAX_LINE_LENGTH): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [""];
}

function pushText(commands: string[], text: string, x: number, y: number, size = 10): void {
  commands.push(`BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
}

function pushWrappedText(commands: string[], text: string, cursor: { y: number }, size = 10): void {
  for (const line of wrapLine(text)) {
    if (cursor.y < 72) break;
    pushText(commands, line, LEFT_MARGIN, cursor.y, size);
    cursor.y -= LINE_HEIGHT;
  }
}

function pushWrappedBullet(commands: string[], text: string, cursor: { y: number }, size = 10): void {
  const lines = wrapLine(text, MAX_LINE_LENGTH - 4);

  lines.forEach((line, index) => {
    if (cursor.y < 72) return;
    pushText(commands, `${index === 0 ? "- " : "  "}${line}`, LEFT_MARGIN, cursor.y, size);
    cursor.y -= LINE_HEIGHT;
  });
}

function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildPdfObjects(content: string): string[] {
  return [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
}

function assemblePdf(objects: string[]): string {
  const parts = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(parts.join("").length);
    parts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = parts.join("").length;
  parts.push(`xref\n0 ${objects.length + 1}\n`);
  parts.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    parts.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`);
  parts.push(`startxref\n${xrefOffset}\n%%EOF`);

  return parts.join("");
}

/**
 * Creates a lightweight, single-page PDF for the first reporting prototype.
 * This avoids adding a PDF dependency while the report scope is still small.
 */
export function createReportPdfBlob(report: GeneratedReport): Blob {
  const commands: string[] = [];
  const cursor = { y: PAGE_HEIGHT - TOP_MARGIN };

  pushText(commands, report.title, LEFT_MARGIN, cursor.y, 18);
  cursor.y -= 24;
  pushText(commands, `Generated: ${formatReportDate(report.generatedAt)}`, LEFT_MARGIN, cursor.y, 10);
  cursor.y -= LINE_HEIGHT;
  pushText(commands, `Mode: ${report.mode} | Audience: ${report.audience} | Type: ${report.type}`, LEFT_MARGIN, cursor.y, 10);
  cursor.y -= 26;

  pushText(commands, "Summary", LEFT_MARGIN, cursor.y, 13);
  cursor.y -= LINE_HEIGHT;
  pushWrappedText(commands, report.summary, cursor);
  cursor.y -= 10;

  pushText(commands, "Key Metrics", LEFT_MARGIN, cursor.y, 13);
  cursor.y -= LINE_HEIGHT;
  report.metrics.forEach((metric) => {
    pushText(commands, `${metric.label}: ${metric.value}`, LEFT_MARGIN, cursor.y, 10);
    cursor.y -= LINE_HEIGHT;
  });
  cursor.y -= 10;

  report.sections.forEach((section) => {
    if (cursor.y < 96) return;
    pushText(commands, section.heading, LEFT_MARGIN, cursor.y, 13);
    cursor.y -= LINE_HEIGHT;
    section.points.forEach((point) => pushWrappedBullet(commands, point, cursor));
    cursor.y -= 8;
  });

  if (cursor.y > 88) {
    pushText(commands, "Disclaimer", LEFT_MARGIN, cursor.y, 13);
    cursor.y -= LINE_HEIGHT;
    pushWrappedText(commands, report.disclaimer, cursor, 9);
  }

  const content = commands.join("\n");
  const pdf = assemblePdf(buildPdfObjects(content));
  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadReportPdf(report: GeneratedReport): void {
  const blob = createReportPdfBlob(report);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${report.id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
