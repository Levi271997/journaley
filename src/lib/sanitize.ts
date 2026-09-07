import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * The editor is the only thing that writes this HTML, but it arrives over the
 * network like any other form field, so it is treated as untrusted. The tag
 * list is exactly what the editor's toolbar can produce — anything else is
 * dropped rather than escaped.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "s", "code", "pre", "blockquote",
    "h1", "h2", "h3", "ul", "ol", "li", "hr", "a",
  ],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  // A link in a journal entry is still a link to somewhere else; it opens in
  // its own tab and hands the destination no reference back to this page.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer nofollow",
    }),
  },
};

export function sanitizeEntryHtml(html: string) {
  return sanitizeHtml(html, OPTIONS);
}
