// Keep short hyphenated words in headings together, so product names like
// "ZBT-2" or "Z-Wave" don't wrap as "ZBT-" / "2".

const HEADING_SELECTOR = "main h1, main h2, main h3, main h4, .category-card-title";
// Long hyphenated strings (IDs, hostnames) can still wrap
const HYPHENATED_WORD = /[^\s-]+(?:-[^\s-]+)+/g;
const MAX_LENGTH = 20;

function keepHyphenatedWordsTogether(heading) {
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const text = node.nodeValue;
    const matches = [...text.matchAll(HYPHENATED_WORD)].filter(
      (match) => match[0].length <= MAX_LENGTH
    );

    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    let last = 0;

    matches.forEach((match) => {
      fragment.append(text.slice(last, match.index));
      const span = document.createElement("span");
      span.className = "nowrap";
      span.textContent = match[0];
      fragment.append(span);
      last = match.index + match[0].length;
    });

    fragment.append(text.slice(last));
    node.replaceWith(fragment);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(HEADING_SELECTOR).forEach(keepHyphenatedWordsTogether);
});
