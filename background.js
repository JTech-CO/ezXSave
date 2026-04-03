function createMenus() {
  chrome.contextMenus.create({
    id: 'open-x-video',
    title: 'Open Video in New Tab',
    contexts: ['all'],
    documentUrlPatterns: ['*://*.x.com/*', '*://x.com/*', '*://*.twitter.com/*', '*://twitter.com/*']
  });

  chrome.contextMenus.create({
    id: 'download-x-video',
    title: 'Save Video',
    contexts: ['all'],
    documentUrlPatterns: ['*://*.x.com/*', '*://x.com/*', '*://*.twitter.com/*', '*://twitter.com/*']
  });
}

chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'getVideoUrl' }, (res) => {
    if (!res) return;

    if (info.menuItemId === 'open-x-video') {
      // blob URL 대신 트윗 주소 열기 (더 안정적)
      const urlToOpen = res.tweetUrl || res.url || tab.url;
      chrome.tabs.create({ url: urlToOpen });
    } 
    else if (info.menuItemId === 'download-x-video') {
      chrome.tabs.sendMessage(tab.id, { action: 'downloadVideo' });
    }
  });
});