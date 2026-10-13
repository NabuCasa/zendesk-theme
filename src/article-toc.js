// Article table of contents: builds an "On this page" navigation from the
// headings in the article body and highlights the section being read.

const HEADING_SELECTOR = "h2, h3";
const MIN_HEADINGS = 2;
const DESKTOP_QUERY = "(min-width: 1200px)";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

function ensureId(heading, usedIds) {
  if (heading.id) {
    usedIds.add(heading.id);
    return heading.id;
  }

  const base = slugify(heading.textContent) || "section";
  let id = base;
  let suffix = 2;

  while (usedIds.has(id) || document.getElementById(id)) {
    id = `${base}-${suffix++}`;
  }

  heading.id = id;
  usedIds.add(id);
  return id;
}

function buildList(headings, list) {
  const usedIds = new Set();
  const links = new Map();
  let currentSublist = null;

  headings.forEach((heading) => {
    const id = ensureId(heading, usedIds);
    const item = document.createElement("li");
    const link = document.createElement("a");

    link.href = `#${id}`;
    link.textContent = heading.textContent.trim();
    link.className = "article-toc-link";
    item.className = "article-toc-item";
    item.appendChild(link);
    links.set(heading, link);

    if (heading.tagName === "H3" && list.lastElementChild) {
      if (!currentSublist) {
        currentSublist = document.createElement("ol");
        currentSublist.className = "article-toc-sublist";
        list.lastElementChild.appendChild(currentSublist);
      }
      item.classList.add("article-toc-item-sub");
      currentSublist.appendChild(item);
    } else {
      currentSublist = null;
      list.appendChild(item);
    }
  });

  return links;
}

function setActive(links, activeHeading) {
  links.forEach((link, heading) => {
    if (heading === activeHeading) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function observeHeadings(headings, links) {
  if (!("IntersectionObserver" in window)) return;

  const visible = new Set();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      });

      // Prefer the first heading in view; otherwise the last one scrolled past.
      let active = headings.find((heading) => visible.has(heading));

      if (!active) {
        active = headings
          .filter((heading) => heading.getBoundingClientRect().top < 0)
          .pop();
      }

      setActive(links, active || headings[0]);
    },
    { rootMargin: "-90px 0px -55% 0px" }
  );

  headings.forEach((heading) => observer.observe(heading));
}

function syncOpenState(details) {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  const update = () => {
    details.open = mediaQuery.matches;
  };

  update();
  mediaQuery.addEventListener("change", update);

  // On desktop the list is always shown, so the summary is not a toggle.
  details.querySelector("summary").addEventListener("click", (event) => {
    if (mediaQuery.matches) event.preventDefault();
  });
}

function initArticleToc() {
  const toc = document.querySelector("[data-article-toc]");
  const body = document.querySelector(".article-body");

  if (!toc || !body) return;

  const headings = Array.from(body.querySelectorAll(HEADING_SELECTOR)).filter(
    (heading) => heading.textContent.trim() !== ""
  );

  if (headings.length < MIN_HEADINGS) return;

  const list = toc.querySelector(".article-toc-list");
  const details = toc.querySelector(".article-toc-details");
  const links = buildList(headings, list);

  toc.hidden = false;
  document.querySelector(".article-layout")?.classList.add("has-toc");

  list.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    const heading = document.getElementById(link.hash.slice(1));
    if (heading) setActive(links, heading);

    if (!window.matchMedia(DESKTOP_QUERY).matches) details.open = false;
  });

  syncOpenState(details);
  observeHeadings(headings, links);
}

window.addEventListener("DOMContentLoaded", initArticleToc);
