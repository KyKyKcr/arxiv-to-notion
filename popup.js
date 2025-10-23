// popup.js
document.getElementById("save").addEventListener("click", () => {
  const token = document.getElementById("token").value.trim();
  const database = document.getElementById("database").value.trim();
  chrome.storage.local.set({ token, database }, () => {
    alert("Saved configuration!");
  });
});

document.getElementById("send").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: sendArxivToNotion
  });
});

async function sendArxivToNotion() {
  const meta = {
    title: document.querySelector('meta[name="citation_title"]')?.content || document.title,
    author: document.querySelector('meta[name="citation_author"]')?.content || "",
    date: document.querySelector('meta[name="citation_online_date"]')?.content || "",
    url: document.querySelector('link[rel="canonical"]')?.href || location.href,
    abs: document.querySelector('meta[name="citation_abstract"]')?.content || "",
    subject: document.querySelector('.primary-subject')?.textContent || ""
  };

  chrome.runtime.sendMessage({ type: "sendToNotion", data: meta });
}
