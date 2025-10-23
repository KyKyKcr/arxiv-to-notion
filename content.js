console.log("[arXiv→Notion] content script loaded");

function getArxivMetadata() {
  const title = document.querySelector('meta[name="citation_title"]')?.content?.trim() || document.title;
  const authors = Array.from(document.querySelectorAll('meta[name="citation_author"]'))
    .map(m => m.content.trim())
    .join(', ');
  const url = document.querySelector('link[rel="canonical"]')?.href || location.href;
  const abs = document.querySelector('meta[name="citation_abstract"]')?.content?.trim() || "";
  const subject = document.querySelector('.primary-subject')?.textContent?.trim() || "";

  return { title, authors, url, abs, subject };
}

// Create floating button
function createButton() {
  const btn = document.createElement("button");
  btn.textContent = "➕ Add to Notion";
  Object.assign(btn.style, {
    position: "fixed",
    top: "10px",
    right: "10px",
    zIndex: 9999,
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "14px",
  });
  btn.addEventListener("mouseenter", () => (btn.style.opacity = "0.85"));
  btn.addEventListener("mouseleave", () => (btn.style.opacity = "1"));

  btn.addEventListener("click", () => {
    const meta = getArxivMetadata();
    btn.textContent = "Adding...";
    btn.disabled = true;

    chrome.runtime.sendMessage({ type: "sendToNotion", data: meta }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        btn.textContent = "❌ Error";
        return;
      }
      if (response && response.success) {
        btn.textContent = "✅ Added!";
      } else {
        btn.textContent = "❌ Error";
      }
      setTimeout(() => {
        btn.textContent = "➕ Add to Notion";
        btn.disabled = false;
      }, 2000);
    });
  });

  document.body.appendChild(btn);
}

createButton();
