import "server-only";

/** Plain text from an uploaded CV (PDF, DOCX, TXT/MD). Returns "" when nothing readable is found. */
export async function extractText(buf: Buffer, filename: string, mime = ""): Promise<string> {
  const name = filename.toLowerCase();
  try {
    if (name.endsWith(".txt") || name.endsWith(".md") || mime.startsWith("text/")) return buf.toString("utf8");
    if (name.endsWith(".pdf") || mime === "application/pdf") {
      const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const { text } = await pdfText(pdf, { mergePages: true });
      return Array.isArray(text) ? text.join("\n") : text;
    }
    if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      return (await mammoth.extractRawText({ buffer: buf })).value;
    }
  } catch (e) {
    console.warn("[jev] could not read CV", filename, e);
  }
  return "";
}
