import { CONFIG } from '../config.js?v=202610271551';
import { toast } from '../utils/dom.js?v=202610271551';

// 브라우저가 "사용자 동작"으로 인정해 재생을 허용하는 이벤트들
const ACTIVATION_EVENTS = ['pointerup', 'touchend', 'click', 'keydown'];

/**
 * 배경음악. 브라우저 Autoplay 정책 때문에 바로 재생되지 않으면,
 * 화면을 처음 터치하는 순간 재생을 시도한다. 사용자가 직접 끈 뒤에는 자동 재생하지 않는다.
 */
export function initMusic(button) {
  const audio = new Audio(CONFIG.music.src);
  audio.loop = true;
  audio.volume = CONFIG.music.volume;
  audio.preload = 'metadata'; // 곡 전체를 미리 받지 않고, 재생할 때 스트리밍

  let userPaused = false;
  let resumeOnVisible = false;

  const render = () => {
    const playing = !audio.paused;
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? '배경음악 끄기' : '배경음악 켜기');
  };
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('error', () => {
    button.hidden = true; // 음악 파일이 없으면 버튼 자체를 숨김
  });

  const play = () => audio.play().then(() => true, () => false);

  function removeActivationListeners() {
    ACTIVATION_EVENTS.forEach((type) => document.removeEventListener(type, onFirstInteraction, true));
  }
  async function onFirstInteraction(e) {
    // 첫 터치가 음악 버튼이면 버튼의 클릭 핸들러가 처리하도록 양보
    if (button.contains(e.target)) return removeActivationListeners();
    if (userPaused || !audio.paused) return removeActivationListeners();
    if (await play()) removeActivationListeners();
  }

  button.addEventListener('click', async () => {
    removeActivationListeners();
    if (audio.paused) {
      userPaused = false;
      if (!(await play())) toast('음악을 재생할 수 없습니다.');
    } else {
      userPaused = true;
      audio.pause();
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
