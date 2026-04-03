let lastVideoUrl = null;

document.addEventListener('contextmenu', (e) => {
  const video = e.target.closest('video');
  if (video) {
    lastVideoUrl = video.currentSrc || video.src;
  } else {
    lastVideoUrl = null;
  }
}, true); // capture phase for accuracy

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getVideoUrl') {
    sendResponse({ url: lastVideoUrl });
  }
});