import { escapeHtml } from '../utils/dom.js';
import { createCarousel } from './carousel.js';

/**
 * 전체화면 사진 보기. 좌우 스와이프로 넘기고, 아래로 끌어내리거나 X/배경/ESC로 닫는다.
 * @param {{full:string, alt:string}[]} photos
 * @param {number} start
 * @param {(lastIndex:number)=>void} [onClose]
 */
export function openLightbox(photos, start, onClose) {
  const root = document.getElementById('lightbox');
  const lastFocus = document.activeElement;

  root.innerHTML = `
    <div class="lightbox__backdrop"></div>
    <div class="lightbox__viewport" role="dialog" aria-modal="true" aria-label="사진 크게 보기">
      <div class="lightbox__track" data-track>
        ${photos.map((p, i) => `
          <div class="lightbox__slide">
            <img src="${escapeHtml(p.full)}" alt="${escapeHtml(p.alt)}" ${Math.abs(i - start) > 1 ? 'loading="lazy"' : ''} draggable="false">
          </div>`).join('')}
      </div>
    </div>
    <p class="lightbox__counter"><b data-current>${start + 1}</b> / ${photos.length}</p>
    <button type="button" class="lightbox__close" aria-label="닫기">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
    </button>
    <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="이전 사진">‹</button>
    <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="다음 사진">›</button>`;

  root.hidden = false;
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => root.classList.add('is-open'));

  const viewport = root.querySelector('.lightbox__viewport');
  const backdrop = root.querySelector('.lightbox__backdrop');
  const counter = root.querySelector('[data-current]');

  function setDrag(dy) {
    const progress = Math.min(1, Math.abs(dy) / 300);
    viewport.style.transition = 'none';
    viewport.style.transform = `translateY(${dy}px) scale(${1 - progress * 0.15})`;
    backdrop.style.opacity = String(1 - progress);
  }
  function resetDrag() {
    viewport.style.transition = '';
    viewport.style.transform = '';
    backdrop.style.opacity = '';
  }

  const carousel = createCarousel(viewport, {
    count: photos.length,
    start,
    onChange: (i) => { counter.textContent = i + 1; },
    onVerticalDrag: setDrag,
    onVerticalEnd: ({ dy, vy }) => {
      if (Math.abs(dy) > 120 || Math.abs(vy) > 0.6) close();
      else resetDrag();
    },
    // 사진 바깥의 빈 영역을 탭하면 닫기 (사진 자체를 탭하면 유지)
    onTap: (_, e) => {
      if (e.target.tagName !== 'IMG') close();
    },
  });

  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') carousel.prev();
    else if (e.key === 'ArrowRight') carousel.next();
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    carousel.destroy();
    root.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => {
      root.hidden = true;
      root.innerHTML = '';
      resetDrag();
      lastFocus?.focus?.();
    }, 250);
    onClose?.(carousel.index);
  }

  document.addEventListener('keydown', onKey);
  root.querySelector('.lightbox__close').addEventListener('click', close);
  root.querySelector('.lightbox__nav--prev').addEventListener('click', carousel.prev);
  root.querySelector('.lightbox__nav--next').addEventListener('click', carousel.next);
  root.querySelector('.lightbox__close').focus();
}
