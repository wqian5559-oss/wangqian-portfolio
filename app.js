const filterButtons = document.querySelectorAll('[data-filter]');
const archiveItems = document.querySelectorAll('.archive-item');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    archiveItems.forEach((item) => {
      item.classList.toggle('is-hidden', filter !== 'all' && item.dataset.category !== filter);
    });
  });
});

document.querySelectorAll('[data-year]').forEach((year) => {
  year.textContent = new Date().getFullYear();
});

const homeCarousel = document.querySelector('[data-home-carousel]');

if (homeCarousel) {
  const viewport = homeCarousel.querySelector('.home-carousel-viewport');
  const track = homeCarousel.querySelector('.home-carousel-track');
  const cards = [...homeCarousel.querySelectorAll('.home-carousel-card')];
  const previousButton = homeCarousel.querySelector('[data-carousel-prev]');
  const nextButton = homeCarousel.querySelector('[data-carousel-next]');
  const progress = homeCarousel.querySelector('.home-carousel-progress span');
  let activeIndex = Math.floor(cards.length / 2);
  let dragging = false;
  let startX = 0;
  let dragDistance = 0;
  let preventClick = false;

  const clampIndex = (index) => Math.max(0, Math.min(index, cards.length - 1));

  const getCardStep = () => {
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return cards[0].offsetWidth + gap;
  };

  const renderCarousel = (dragOffset = 0, animate = true) => {
    const activeCard = cards[activeIndex];
    const offset = (viewport.clientWidth / 2) - activeCard.offsetLeft - (activeCard.offsetWidth / 2) + dragOffset;

    track.classList.toggle('is-dragging', !animate);
    track.style.transform = `translate3d(${offset}px, 0, 0)`;

    cards.forEach((card, index) => {
      const distance = Math.abs(index - activeIndex);
      card.classList.toggle('is-active', index === activeIndex);
      card.classList.toggle('is-near', distance === 1);
      card.classList.toggle('is-far', distance > 1);
      card.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
    });

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === cards.length - 1;
    progress.style.transform = `scaleX(${cards.length === 1 ? 1 : activeIndex / (cards.length - 1)})`;
  };

  const setActiveIndex = (index) => {
    activeIndex = clampIndex(index);
    renderCarousel();
  };

  previousButton.addEventListener('click', () => setActiveIndex(activeIndex - 1));
  nextButton.addEventListener('click', () => setActiveIndex(activeIndex + 1));

  cards.forEach((card, index) => {
    card.addEventListener('click', (event) => {
      if (preventClick) {
        event.preventDefault();
        preventClick = false;
        return;
      }

      if (index !== activeIndex) {
        event.preventDefault();
        setActiveIndex(index);
      }
    });
  });

  viewport.addEventListener('pointerdown', (event) => {
    dragging = true;
    startX = event.clientX;
    dragDistance = 0;
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dragDistance = event.clientX - startX;
    renderCarousel(dragDistance, false);
  });

  const finishDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    if (event?.pointerId !== undefined && viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(dragDistance) > 45) {
      preventClick = true;
      setActiveIndex(activeIndex + (dragDistance < 0 ? 1 : -1));
    } else {
      renderCarousel();
    }
  };

  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);

  homeCarousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') setActiveIndex(activeIndex - 1);
    if (event.key === 'ArrowRight') setActiveIndex(activeIndex + 1);
  });

  window.addEventListener('resize', () => renderCarousel(0, false));
  renderCarousel(0, false);
}
