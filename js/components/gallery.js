import { CONFIG } from '../config.js';
import { escapeHtml } from '../utils/dom.js';
import { createCarousel } from './carousel.js';
import { openLightbox } from './lightbox.js';

const ARROW_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Section 5: 큰 사진(스와이프) + 썸네일 줄 + 전체화면 라이트박스 */
export function initGallery(panel) {
  const photos = CONFIG.gallery;

  panel.innerHTML = `
    <div class="gallery">
      <div class="carousel" aria-roledescription="carousel" aria-label="웨딩 사진">
        <div class="carousel__viewport">
          <div class="carousel__track" data-track>
            ${photos.map((p, i) => `
              <div class="carousel__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${photos.length}">
                <img src="${escapeHtml(p.thumb)}" alt="${escapeHtml(p.alt)}" ${i > 1 ? 'loading="lazy"' : ''} draggable="false">
              </div>`).join('')}
          </div>
          <button type="button" class="carousel__nav carousel__nav--prev" aria-label="이전 사진">${ARROW_LEFT}</button>
          <button type="button" class="carousel__nav carousel__nav--next" aria-label="다음 사진">${ARROW_RIGHT}</button>
        </div>
        <p class="carousel__counter" aria-live="polite"><b data-current>1</b> / ${photos.length}</p>
      </div>

      <div class="thumbs" role="list">
        ${photos.map((p, i) => `
          <button type="button" class="thumbs__item" role="listitem" data-index="${i}" aria-label="${i + 1}번째 사진 보기">
            <img src="${escapeHtml(p.thumb)}" alt="" loading="lazy" draggable="false">
          </button>`).join('')}
      </div>
      <p class="hint">사진을 누르면 크게 볼 수 있어요</p>
    </div>`;

  const counter = panel.querySelector('[data-current]');
  const thumbStrip = panel.querySelector('.thumbs');
  const thumbs = [...thumbStrip.children];
  const prevBtn = panel.querySelector('.carousel__nav--prev');
  const nextBtn = panel.querySelector('.carousel__nav--next');

  function sync(index) {
    counter.textContent = index + 1;
    thumbs.forEach((t, i) => t.classList.toggle('is-active', i === index));
    // scrollIntoView는 패널 전체를 세로로 움직일 수 있어서 썸네일 줄만 가로로 스크롤
    const t = thumbs[index];
    thumbStrip.scrollTo({ left: t.offsetLeft - (thumbStrip.clientWidth - t.clientWidth) / 2, behavior: 'smooth' });
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === photos.length - 1;
  }

  const carousel = createCarousel(panel.querySelector('.carousel__viewport'), {
    count: photos.length,
    onChange: sync,
    // 라이트박스에서 넘긴 위치를 슬라이더에도 반영
    onTap: (index) => openLightbox(photos, index, (last) => carousel.go(last, { animate: false })),
  });

  prevBtn.addEventListener('click', carousel.prev);
  nextBtn.addEventListener('click', carousel.next);
  thumbs.forEach((t) => t.addEventListener('click', () => carousel.go(Number(t.dataset.index))));

  sync(0);
}
