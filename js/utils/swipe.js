/**
 * 터치(touchstart/move/end) + 마우스 드래그를 하나의 콜백으로 묶는 스와이프 유틸.
 * 처음 움직인 방향으로 축을 고정(lock)해서, 가로 스와이프 중에는 세로 스크롤을 막고
 * 세로 스크롤 중에는 슬라이드가 흔들리지 않게 한다.
 *
 * @param {HTMLElement} el
 * @param {{ onStart?, onMove?, onEnd?, preventY?: boolean }} handlers
 *   preventY: 세로 드래그도 직접 처리할 때(true) 브라우저 스크롤을 막는다.
 */
export function attachSwipe(el, { onStart, onMove, onEnd, preventY = false } = {}) {
  const LOCK_THRESHOLD = 6;
  let active = false;
  let startX = 0;
  let startY = 0;
  let startT = 0;
  let dx = 0;
  let dy = 0;
  let lock = null;

  const point = (e) => (e.touches ? e.touches[0] : e);

  function start(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    if (e.touches && e.touches.length > 1) return; // 핀치 줌은 무시
    const p = point(e);
    active = true;
    startX = p.clientX;
    startY = p.clientY;
    startT = performance.now();
    dx = dy = 0;
    lock = null;
    onStart?.();
  }

  function move(e) {
    if (!active) return;
    const p = point(e);
    dx = p.clientX - startX;
    dy = p.clientY - startY;
    if (!lock) {
      if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
      lock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }
    if ((lock === 'x' || preventY) && e.cancelable) e.preventDefault();
    onMove?.({ dx, dy, lock });
  }

  function end() {
    if (!active) return;
    active = false;
    const dt = Math.max(1, performance.now() - startT);
    onEnd?.({ dx, dy, lock, vx: dx / dt, vy: dy / dt });
  }

  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchmove', move, { passive: false });
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
  el.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);

  // window에 붙인 리스너는 요소가 사라져도 남으므로 해제 함수를 돌려준다
  return function destroy() {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', end);
  };
}
