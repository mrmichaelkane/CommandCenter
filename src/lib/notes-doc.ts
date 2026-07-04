// Builds a minimal Tiptap JSON document from plain text, one paragraph per
// non-empty line. Used when the capture bar routes free text into a note.
export function plainTextToTiptapDoc(text: string) {
  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    type: "doc",
    content:
      paragraphs.length > 0
        ? paragraphs.map((line) => ({
            type: "paragraph",
            content: [{ type: "text", text: line }],
          }))
        : [{ type: "paragraph" }],
  };
}
