function scrapeArxivMeta() {
  try {
    const authorElements = document.querySelectorAll('meta[name="citation_author"]');
    const authors = Array.from(authorElements).map(el => el.content).join('; ');
    let dateString = document.querySelector('meta[name="citation_online_date"]')?.content || "";
    dateString = dateString.replace(/\//g, '-');
    
    const meta = {    
        title: document.querySelector('meta[name="citation_title"]')?.content || document.title,
        url: document.querySelector('link[rel="canonical"]')?.href || location.href,
        date: dateString,
        author: authors,
        subject: document.querySelector('.primary-subject')?.textContent || "",
        abs: document.querySelector('meta[name="citation_abstract"]')?.content || ""
    };

    // 取得した情報をオブジェクトとして返す
    return meta
  } catch (e) {
    // ページに必要な要素がなかった場合 (例: arXivのトップページなど)
    console.error("Error scraping arXiv metadata:", e);
    return null;
  }
}

function showError(message = "This does not seem to be a valid arXiv abstract page.") {
    const contentDiv = document.getElementById('content');
    const errorDiv = document.getElementById('error');
    if (contentDiv) contentDiv.style.display = 'none';
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');

  saveButton.addEventListener('click', () => {
    statusDiv.textContent = '保存中...';
    statusDiv.style.color = ''; // エラースタイルをリセット
    saveButton.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        showError('アクティブなタブが見つかりません。');
        console.error("Tab query error:", chrome.runtime.lastError?.message);
        return;
      }
      
      const tab = tabs[0];
      const url = tab.url;
      const title = tab.title;

      // arXiv の論文ページかどうかを判定 (URL構造に基づく)
      if (url && url.includes("arxiv.org/abs/")) {
        // --- arXivページの場合 ---
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            function: scrapeArxivMeta, // scrapeArxivMeta関数を注入
          },
          (injectionResults) => {
            if (chrome.runtime.lastError || !injectionResults || injectionResults.length === 0 || !injectionResults[0].result) {
              showError("arXivメタデータの取得に失敗しました。");
              console.error("Script injection error or no result:", chrome.runtime.lastError?.message, injectionResults);
              saveButton.disabled = false; // エラー時はボタンを有効に戻す
              return;
            }

            const metadata = injectionResults[0].result;
            // メタデータが見つかった場合のみbackgroundへ送信
            if (metadata && metadata.title) {
                chrome.runtime.sendMessage(
                    { action: "saveArxivToNotion", metadata: metadata },
                    handleResponse // 共通のレスポンスハンドラを使用
                );
            } else {
                 showError("arXivページから必要なメタデータを抽出できませんでした。");
                 saveButton.disabled = false;
            }
          }
        );
      } else {
        // --- arXivページ以外の場合 ---
        chrome.runtime.sendMessage(
          { action: "savePageToNotion", title: title, url: url },
          handleResponse // 共通のレスポンスハンドラを使用
        );
      }
    });
  });

  // background.jsからのレスポンスを処理する共通関数
  function handleResponse(response) {
     if (chrome.runtime.lastError) {
        showError(`接続エラー: ${chrome.runtime.lastError.message}`);
        console.error("Message sending error:", chrome.runtime.lastError.message);
        saveButton.disabled = false; // エラー時はボタンを有効に戻す
        return;
      }
      
      if (response && response.success) {
        statusDiv.textContent = 'Notionに保存しました！';
        statusDiv.style.color = 'green';
      } else {
        const errorMessage = response ? response.error : '不明なエラー';
        showError(`保存失敗: ${errorMessage}。オプションページの設定を確認してください。`);
        console.error("Save failure:", response?.error);
      }

      saveButton.disabled = false; // 処理完了後ボタンを有効化

      // メッセージを数秒後に消去
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
  }
});