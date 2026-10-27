import { CONFIG } from './config.js?v=202610271608';
import { initMusic } from './components/music.js?v=202610271608';
import { initHero } from './components/hero.js?v=202610271608';
import { initGreeting } from './components/greeting.js?v=202610271608';
import { initCalendar } from './components/calendar.js?v=202610271608';
import { initMap } from './components/map.js?v=202610271608';
import { initGallery } from './components/gallery.js?v=202610271608';
import { initAccount } from './components/account.js?v=202610271608';
import { initGuestbook } from './components/guestbook.js?v=202610271608';
import { initFooter } from './components/footer.js?v=202610271608';

/**
 * 섹션 id → 초기화 함수. 위에서부터 스크롤 순서대로.
 * lazy: 화면 근처에 왔을 때 초기화 (지도 SDK, 서버 요청 등 무거운 작업을 늦춤)
 */
const SECTIONS = [
  { id: 'hero', init: initHero },
  { id: 'greeting', init: initGreeting },
  { id: 'calendar', init: initCalendar },
  { id: 'location', init: initMap, lazy: true },
  { id: 'gallery', init: initGallery },
  { id: 'account', init: initAccount, lazy: true },
  { id: 'guestbook', init: initGuestbook, lazy: true },
  { id: 'footer', init: initFooter },
];

function mountOf(id) {
  return document.querySelector(`#${id} [data-mount]`);
}

function init() {
  document.title = `${CONFIG.groom.name} ♥ ${CONFIG.bride.name} 결혼합니다`;
  initMusic(document.getElementById('music-toggle'));

  const lazy = new Map();
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        lazy.get(entry.target)?.();
      });
    }, { rootMargin: '600px 0px' })
    : null;

  SECTIONS.forEach(({ id, init: run, lazy: isLazy }) => {
    const mount = mountOf(id);
    if (!mount) return;
    if (isLazy && observer) {
      lazy.set(mount, () => run(mount));
      observer.observe(mount);
    } else {
      run(mount);
    }
  });
}

init();
