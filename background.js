function createMenus() {
  chrome.contextMenus.create({
    id: 'open-x-video',
    title: 'Open Video in New Tab',
    contexts: ['video'],
    documentUrlPatterns: ['*://*.x.com/*', '*://x.com/*', '*://*.twitter.com/*', '*://twitter.com/*']
  });

  chrome.contextMenus.create({
    id: 'download-x-video',
    title: 'Save Video',
    contexts: ['video'],
    documentUrlPatterns: ['*://*.x.com/*', '*://x.com/*', '*://*.twitter.com/*', '*://twitter.com/*']
  });
}

chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'getVideoUrl' }, (res) => {
    const url = res?.url;
    if (!url) {
      console.warn('[ezXSave] Could not find video URL.');
      return;
    }

    if (info.menuItemId === 'open-x-video') {
      chrome.tabs.create({ url: url });
    } else if (info.menuItemId === 'download-x-video') {
      chrome.downloads.download({
        url: url,
        filename: `x-video-${Date.now()}.mp4`,
        saveAs: true
      });
    }
  });
});