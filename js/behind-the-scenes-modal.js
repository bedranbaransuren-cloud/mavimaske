(function () {
  // Minimal, dependency-free modal + video injector
  const openBtn = document.getElementById('bts-open');
  const modal = document.getElementById('bts-modal');
  const overlay = modal.querySelector('.bts-modal-overlay');
  const closeBtn = document.getElementById('bts-close');
  const videoContainer = document.getElementById('bts-video-container');

  let lastFocused = null;

  if (!openBtn || !modal || !closeBtn || !videoContainer) return;

  function trapFocus(event) {
    // Keep focus inside the modal (simple tab-cycling)
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      closeModal();
    }
  }

  function openModal() {
    lastFocused = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    // prevent background scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    // focus the close button
    closeBtn.focus();
    // attach keyboard listeners
    document.addEventListener('keydown', trapFocus);
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    // allow background scroll
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    // remove keyboard listener
    document.removeEventListener('keydown', trapFocus);
    // stop and remove video
    if (videoContainer.firstChild) {
      // If it's an <iframe>, remove src to stop playback and then remove element
      const node = videoContainer.firstChild;
      if (node.tagName === 'IFRAME') {
        node.src = '';
      } else if (node.tagName === 'VIDEO') {
        try { node.pause(); node.removeAttribute('src'); node.load(); } catch (e) { /* ignore */ }
      }
      videoContainer.innerHTML = '';
    }
    // restore focus
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function createYouTubeIframe(id) {
    const iframe = document.createElement('iframe');
    const params = [
      'autoplay=1',
      'mute=0',
      'rel=0',
      'modestbranding=1',
      'iv_load_policy=3',
      'playsinline=1'
    ].join('&');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params}`;
    iframe.title = 'Behind the Scenes — Mavi Maske Tiyatro';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('aria-label', 'Behind the Scenes video');
    return iframe;
  }

  function createSelfHostedVideo(mp4, webm, vtt) {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.style.width = '100%';
    video.style.height = '100%';
    if (webm) {
      const s1 = document.createElement('source'); s1.src = webm; s1.type = 'video/webm'; video.appendChild(s1);
    }
    if (mp4) {
      const s2 = document.createElement('source'); s2.src = mp4; s2.type = 'video/mp4'; video.appendChild(s2);
    }
    if (vtt) {
      const track = document.createElement('track');
      track.kind = 'captions';
      track.label = 'Turkish';
      track.srclang = 'tr';
      track.src = vtt;
      video.appendChild(track);
    }
    return video;
  }

  // Open button click - inject video and open modal
  openBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const type = openBtn.getAttribute('data-video-type') || 'youtube';
    if (type === 'youtube') {
      const id = openBtn.getAttribute('data-video-id');
      if (!id) { console.warn('Missing data-video-id'); return openModal(); }
      const frame = createYouTubeIframe(id);
      videoContainer.innerHTML = '';
      videoContainer.appendChild(frame);
    } else if (type === 'selfhost') {
      const mp4 = openBtn.getAttribute('data-video-mp4');
      const webm = openBtn.getAttribute('data-video-webm');
      const vtt = openBtn.getAttribute('data-caption-src');
      const vid = createSelfHostedVideo(mp4, webm, vtt);
      videoContainer.innerHTML = '';
      videoContainer.appendChild(vid);
      // play (user click allows autoplay)
      const playPromise = vid.play();
      if (playPromise !== undefined) playPromise.catch(()=>{/* may be blocked on some devices */});
    } else {
      console.warn('Unsupported data-video-type:', type);
    }
    openModal();
  });

  // Close handlers
  closeBtn.addEventListener('click', function (e) { e.preventDefault(); closeModal(); });
  overlay.addEventListener('click', function (e) { if (e.target.dataset.close === 'overlay' || e.target === overlay) closeModal(); });
  // also close on overlay pointerdown outside panel
  modal.addEventListener('pointerdown', function (e) {
    if (e.target === modal.querySelector('.bts-modal-overlay')) closeModal();
  });
})();
