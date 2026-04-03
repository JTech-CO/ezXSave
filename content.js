let downloadBtn = null;

function createDownloadButton() {
  if (downloadBtn) return;
  downloadBtn = document.createElement('button');
  downloadBtn.className = 'ezxsave-btn';
  downloadBtn.innerHTML = '⬇️ Save Video';
  downloadBtn.onclick = () => downloadHighestQualityVideo();
  document.body.appendChild(downloadBtn);
}

function positionButton(video) {
  createDownloadButton();
  const rect = video.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;

  downloadBtn.style.top = `${rect.top + scrollY + 20}px`;
  downloadBtn.style.left = `${rect.right + scrollX - 150}px`;
  downloadBtn.classList.add('show');
}

async function downloadHighestQualityVideo() {
  if (!downloadBtn) return;
  const originalText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '⏳ 최고 화질 찾는 중...';
  downloadBtn.style.opacity = '0.6';

  try {
    const resources = performance.getEntriesByType('resource');
    let masterM3U8 = null;

    // master playlist 찾기
    for (let i = resources.length - 1; i >= 0; i--) {
      const name = resources[i].name.toLowerCase();
      if (name.includes('.m3u8') && (name.includes('master') || name.includes('playlist'))) {
        masterM3U8 = resources[i].name;
        break;
      }
    }

    if (!masterM3U8) {
      alert('m3u8을 찾을 수 없습니다.\n동영상을 10초 이상 재생한 후 다시 시도해주세요.');
      return;
    }

    // master.m3u8 파싱하여 최고 화질 variant 찾기
    const response = await fetch(masterM3U8, { credentials: 'include' });
    const text = await response.text();

    let bestUrl = null;
    let bestBandwidth = 0;

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
        const bandwidthMatch = lines[i].match(/BANDWIDTH=(\d+)/);
        const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;
        if (bandwidth > bestBandwidth && lines[i + 1] && !lines[i + 1].startsWith('#')) {
          bestBandwidth = bandwidth;
          bestUrl = new URL(lines[i + 1], masterM3U8).href;
        }
      }
    }

    if (!bestUrl) bestUrl = masterM3U8; // fallback

    console.log('[ezXSave] 최고 화질 m3u8:', bestUrl);

    // 최고 화질 m3u8 다운로드 (브라우저가 .ts 병합 시도)
    const bestResponse = await fetch(bestUrl, { credentials: 'include' });
    const blob = await bestResponse.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `x-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    alert('✅ 최고 화질 다운로드 시작!\n(파일명: x-video-....mp4)');
  } catch (err) {
    console.error('[ezXSave] 오류:', err);
    alert('다운로드 실패\n동영상을 충분히 재생한 후 다시 시도해주세요.\n\n문제가 지속되면 F12 콘솔의 [ezXSave] 로그를 알려주세요.');
  } finally {
    if (downloadBtn) {
      downloadBtn.innerHTML = originalText;
      downloadBtn.style.opacity = '1';
    }
  }
}

// 동영상 감지 및 버튼 표시
const observer = new MutationObserver(() => {
  document.querySelectorAll('video').forEach(video => {
    if (video.dataset.ezxsave) return;
    video.dataset.ezxsave = 'true';

    video.addEventListener('play', () => {
      setTimeout(() => positionButton(video), 1200);
    });

    video.addEventListener('pause', () => {
      if (downloadBtn) downloadBtn.classList.remove('show');
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('video').forEach(v => {
      if (!v.paused && v.currentTime > 2) positionButton(v);
    });
  }, 2500);
});