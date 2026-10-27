import { attachSwipe } from '../utils/swipe.js?v=202610271551';

/**
 * 좌우 스와이프 캐러셀. 사진첩 슬라이더와 라이트박스가 같이 쓴다.
 * 마크업: viewport > [data-track] > .slide * count
 *
 * @param {HTMLElement} viewport
 * @param {object} opts
 * @param {number} opts.count
 * @param {number} [opts.start]
 * @param {(index:number)=>void} [opts.onChange]
 * @param {(index:number, e:MouseEvent)=>void} [opts.onTap]  스와이프가 아닌 단순 탭
 * @param {(dy:number)=>void} [opts.onVerticalDrag]   세로 드래그 중 (라이트박스 닫기용)
 * @param {(e:{dy:number,vy:number})=>void} [opts.onVerticalEnd]
 */
export function createCarousel(viewport, opts) {
  const { count, onChange, onTap, onVerticalDrag, onVerticalEnd } = opts;
  const track = viewport.querySelector('[data-track]');
  let index = clamp(opts.start ?? 0);
  let suppressTap = false;

  function clamp(i) {
    return Math.max(0, Math.min(count - 1, i));
  }

  function render(offsetPx = 0, animate = true) {
    track.classList.toggle('is-dragging', !animate);
    track.style.transform = `translate3d(calc(${-index * 100}% + ${offsetPx}px), 0, 0)`;
  }

  function go(i, { animate = true } = {}) {
    const next = clamp(i);
    const changed = next !== index;
    index = next;
    render(0, animate);
    if (changed) onChange?.(index);
  }

  const destroySwipe = attachSwipe(viewport, {
    preventY: Boolean(onVerticalDrag),
    onStart() {
      suppressTap = false;
    },
    onMove({ dx, dy, lock }) {
      suppressTap = true;
      if (lock === 'x') {
        const atEdge = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
        render(atEdge ? dx / 3 : dx, false); // 처음/끝에서는 고무줄처럼 저항감
      } else if (lock === 'y') {
        onVerticalDrag?.(dy);
      }
    },
    onEnd({ dx, dy, vx, vy, lock }) {
      if (lock === 'x') {
        const passed = Math.abs(dx) > viewport.clientWidth * 0.2 || Math.abs(vx) > 0.45;
        if (passed) go(index + (dx < 0 ? 1 : -1));
        else render(0);
      } else if (lock === 'y') {
        onVerticalEnd?.({ dy, vy });
      }
    },
  });

  viewport.addEventListener('click', (e) => {
    if (suppressTap) return;
    if (e.target.closest('button')) return;
    onTap?.(index, e);
  });
  viewport.addEventListener('dragstart', (e) => e.preventDefault());

  render(0, false);

  return {
    go,
    next: () => go(index + 1),
    prev: () => go(index - 1),
    destroy: destroySwipe,
    get index() {
      return index;
    },
  };
}
