chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === "sendToNotion") {
    const { token, database } = await chrome.storage.local.get(["token", "database"]);
    if (!token || !database) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Missing Config",
        message: "Please set Notion token and database ID first."
      });
      return;
    }

    const { title, author, url, abs, subject } = msg.data;

    const payload = {
      parent: { database_id: database },
      properties: {
        "Title": { title: [{ text: { content: title } }] },
        "Author": { rich_text: [{ text: { content: author } }] },
        "URL": { url },
        "Subject": { rich_text: [{ text: { content: subject } }] },
        "Abstract": { rich_text: [{ text: { content: abs } }] }
      }
    };

    try {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon48.png",
          title: "Success!",
          message: "Paper added to Notion."
        });
      } else {
        const err = await res.text();
        console.error(err);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon48.png",
          title: "Error",
          message: "Failed to add paper. Check console."
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
});
