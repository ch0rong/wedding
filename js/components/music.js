import { CONFIG } from '../config.js?v=202610271608';
import { escapeHtml, toast } from '../utils/dom.js?v=202610271608';

// 브라우저가 "사용자 동작"으로 인정해 재생을 허용하는 이벤트들
const ACTIVATION_EVENTS = ['pointerup', 'touchend', 'click', 'keydown'];

const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>';

/**
 * 배경음악.
 * - 들어올 때마다 CONFIG.music.tracks 중 하나를 무작위로 고른다.
 * - 브라우저 Autoplay 정책 때문에 바로 재생되지 않으면, 화면을 처음 터치하는 순간 재생한다.
 * - 우측 상단 ♪ 버튼 → 곡 선택 / 끄기·다시 재생 메뉴. 사용자가 직접 끈 뒤에는 자동 재생하지 않는다.
 */
export function initMusic(button) {
  const tracks = CONFIG.music.tracks.filter((t) => t.src);
  if (!tracks.length) {
    button.hidden = true;
    return;
  }

  let current = Math.floor(Math.random() * tracks.length);
  const audio = new Audio(tracks[current].src);
  audio.loop = true;
  audio.volume = CONFIG.music.volume;
  audio.preload = 'metadata'; // 곡 전체를 미리 받지 않고, 재생할 때 스트리밍

  let userPaused = false;
  let resumeOnVisible = false;

  /* ---------- 메뉴 ---------- */
  const menu = document.createElement('div');
  menu.className = 'music-menu';
  menu.id = 'music-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  document.body.appendChild(menu);
  button.setAttribute('aria-haspopup', 'menu');
  button.setAttribute('aria-controls', 'music-menu');
  button.setAttribute('aria-expanded', 'false');

  function renderMenu() {
    const playing = !audio.paused;
    menu.innerHTML = `
      <p class="music-menu__title">배경음악</p>
      ${tracks.map((t, i) => `
        <button type="button" role="menuitemradio" class="music-menu__item${i === current ? ' is-current' : ''}"
          aria-checked="${i === current}" data-track="${i}">
          <span class="music-menu__eq${i === current && playing ? ' is-on' : ''}" aria-hidden="true"><i></i><i></i><i></i></span>
          ${escapeHtml(t.title)}
        </button>`).join('')}
      <button type="button" role="menuitem" class="music-menu__toggle" data-toggle>
        ${playing ? `${ICON_PAUSE} 음악 끄기` : `${ICON_PLAY} 음악 켜기`}
      </button>`;
  }

  function openMenu() {
    renderMenu();
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => menu.classList.add('is-open'));
  }
  function closeMenu() {
    menu.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 180);
  }
  const isMenuOpen = () => !menu.hidden && menu.classList.contains('is-open');

  /* ---------- 재생 ---------- */
  const render = () => {
    const playing = !audio.paused;
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', playing ? `배경음악: ${tracks[current].title} 재생 중` : '배경음악 (꺼짐)');
    if (!menu.hidden) renderMenu();
  };
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('error', () => {
    // 지금 곡 파일을 못 읽으면 다른 곡으로, 모두 실패하면 버튼을 숨김
    tracks.splice(current, 1);
    if (!tracks.length) {
      button.hidden = true;
      closeMenu();
      return;
    }
    current = Math.floor(Math.random() * tracks.length);
    audio.src = tracks[current].src;
    if (!userPaused) play();
  });

  const play = () => audio.play().then(() => true, () => false);

  async function selectTrack(i) {
    removeActivationListeners();
    userPaused = false;
    if (i !== current) {
      current = i;
      audio.src = tracks[i].src;
    }
    if (!(await play())) toast('음악을 재생할 수 없습니다.');
    render();
  }

  async function togglePlay() {
    removeActivationListeners();
    if (audio.paused) {
      userPaused = false;
      if (!(await play())) toast('음악을 재생할 수 없습니다.');
    } else {
      userPaused = true;
      audio.pause();
    }
  }

  /* ---------- 첫 터치 시 자동 재생 ---------- */
  function removeActivationListeners() {
    ACTIVATION_EVENTS.forEach((type) => document.removeEventListener(type, onFirstInteraction, true));
  }
  async function onFirstInteraction(e) {
    // 첫 터치가 음악 버튼/메뉴면 그쪽 동작에 맡김
    if (button.contains(e.target) || menu.contains(e.target)) return removeActivationListeners();
    if (userPaused || !audio.paused) return removeActivationListeners();
    if (await play()) removeActivationListeners();
  }

  /* ---------- 이벤트 ---------- */
  button.addEventListener('click', () => (isMenuOpen() ? closeMenu() : openMenu()));
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-track]');
    if (item) return void selectTrack(Number(item.dataset.track));
    if (e.target.closest('[data-toggle]')) togglePlay();
  });
  document.addEventListener('click', (e) => {
    if (isMenuOpen() && !menu.contains(e.target) && !button.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen()) {
      closeMenu();
      button.focus();
    }
  });

  // 다른 앱으로 전환하거나 화면이 꺼지면 일시정지, 돌아오면 이어서 재생
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeOnVisible = !audio.paused;
      audio.pause();
    } else if (resumeOnVisible && !userPaused) {
      play();
    }
  });

  play().then((ok) => {
    if (!ok) ACTIVATION_EVENTS.forEach((type) => document.addEventListener(type, onFirstInteraction, true));
  });
  render();
}
