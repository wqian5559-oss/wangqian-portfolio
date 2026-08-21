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

const copyToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.appendChild(helper);
  helper.select();
  document.execCommand('copy');
  helper.remove();
};

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const status = button.querySelector('[data-copy-status]');
    const originalStatus = status?.textContent || '复制';

    try {
      await copyToClipboard(button.dataset.copy);
      button.classList.add('is-copied');
      if (status) status.textContent = '已复制';
      window.setTimeout(() => {
        button.classList.remove('is-copied');
        if (status) status.textContent = originalStatus;
      }, 1600);
    } catch (error) {
      if (status) status.textContent = '请手动复制';
      window.setTimeout(() => {
        if (status) status.textContent = originalStatus;
      }, 1800);
    }
  });
});

const initImageHover = (selector) => {
  document.querySelectorAll(selector).forEach((zone) => {
    if (zone.dataset.hoverReady) return;
    zone.dataset.hoverReady = 'true';
    zone.classList.add('image-hover-zone');

    const dim = document.createElement('span');
    dim.className = 'image-hover-dim';
    dim.setAttribute('aria-hidden', 'true');

    const cursor = document.createElement('span');
    cursor.className = 'image-hover-button';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span>→</span>';
    zone.append(dim, cursor);

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = null;

    const animateCursor = () => {
      current.x += (target.x - current.x) * .16;
      current.y += (target.y - current.y) * .16;
      zone.style.setProperty('--hover-x', `${current.x}px`);
      zone.style.setProperty('--hover-y', `${current.y}px`);

      const distance = Math.abs(target.x - current.x) + Math.abs(target.y - current.y);
      if (zone.classList.contains('is-hovered') || distance > .4) {
        frame = window.requestAnimationFrame(animateCursor);
      } else {
        frame = null;
      }
    };

    const updateTarget = (event) => {
      const rect = zone.getBoundingClientRect();
      target.x = event.clientX - rect.left;
      target.y = event.clientY - rect.top;
      if (frame === null) frame = window.requestAnimationFrame(animateCursor);
    };

    zone.addEventListener('pointerenter', (event) => {
      zone.classList.add('is-hovered');
      updateTarget(event);
    });
    zone.addEventListener('pointermove', updateTarget);
    zone.addEventListener('pointerleave', () => {
      zone.classList.remove('is-hovered');
      target.x = current.x;
      target.y = current.y;
      if (frame === null) frame = window.requestAnimationFrame(animateCursor);
    });
  });
};

initImageHover('.about-fact-visual, .home-carousel-art');

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

const driftWall = document.querySelector('[data-drift-wall]');

if (driftWall) {
  const plane = driftWall.querySelector('.drift-wall__plane');
  const photoItems = [
    { image: 'assets/photos/DSCF0153-4.jpg', title: 'Food / detail' },
    { image: 'assets/photos/DSCF0149-1.jpg', title: 'A place to eat' },
    { image: 'assets/photos/_DSC0985-1.jpg', title: 'Two figures' },
    { image: 'assets/photos/_DSC1034-1.jpg', title: 'Tenderness' },
    { image: 'assets/photos/_DSC1037-1.jpg', title: 'Light and shadow' },
    { image: 'assets/photos/_DSC1038-1.jpg', title: 'An afternoon room' },
    { image: 'assets/photos/_DSC1073-1.jpg', title: 'Falling notes' },
    { image: 'assets/photos/_DSC1120-1.jpg', title: 'Printed face' },
    { image: 'assets/photos/_DSC1205-1.jpg', title: 'Passing by' },
    { image: 'assets/photos/_DSC1237-1.jpg', title: 'Inside the frame' },
    { image: 'assets/photos/_DSC1151-1.jpg', title: 'A bright gathering' },
    { image: 'assets/photos/_DSC1091-1.jpg', title: 'Concrete geometry' },
    { image: 'assets/photos/_DSC1554-2-2.jpg', title: 'A quiet animal' },
    { image: 'assets/photos/_DSC1248-1.jpg', title: 'Green machine' },
    { image: 'assets/photos/_DSC1030-1.jpg', title: 'Soft reflection' }
  ];
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    containerHeight: 600,
    columns: 0,
    tileWidth: 200,
    tileHeight: 132,
    gap: 18,
    columnItems: [],
    columnMeta: [],
    offsets: [],
    velocities: [],
    baseVelocities: [],
    tracks: [],
    hoveredColumn: -1,
    wallHovered: false,
    activeId: null,
    pointer: { x: 0, y: 0 },
    pointerDamped: { x: 0, y: 0 },
    lastTime: null,
    raf: null,
    reduced: reducedMotionQuery.matches
  };

  const getLayout = () => {
    if (window.innerWidth <= 640) return { columns: 2, tileWidth: 160, tileHeight: 108, gap: 18 };
    if (window.innerWidth <= 900) return { columns: 4, tileWidth: 180, tileHeight: 120, gap: 18 };
    return { columns: 5, tileWidth: 200, tileHeight: 132, gap: 18 };
  };

  const getPhotoItems = () => photoItems.map((item, index) => ({
    id: String(index + 1).padStart(2, '0'),
    ...item
  }));

  const setActiveTile = (id, column) => {
    state.activeId = id;
    state.hoveredColumn = column;
    state.tracks.forEach((track) => {
      track.querySelectorAll('.drift-wall__tile').forEach((tile) => {
        tile.classList.toggle('is-active', tile.dataset.tileId === id);
      });
    });
  };

  const releaseTile = () => {
    state.activeId = null;
    state.hoveredColumn = -1;
    state.tracks.forEach((track) => {
      track.querySelectorAll('.drift-wall__tile').forEach((tile) => tile.classList.remove('is-active'));
    });
  };

  const renderTile = (item, column) => {
    const tile = document.createElement('div');
    tile.className = 'drift-wall__tile';
    tile.tabIndex = 0;
    tile.setAttribute('role', 'img');
    tile.setAttribute('aria-label', item.title);
    tile.dataset.tileId = item.id;
    tile.dataset.col = String(column);
    tile.innerHTML = `<span class="drift-wall__inner"><img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" draggable="false"><span class="drift-wall__overlay" aria-hidden="true"></span><span class="drift-wall__caption">${item.id} / ${item.title}</span></span>`;
    tile.addEventListener('focus', () => setActiveTile(item.id, column));
    tile.addEventListener('blur', releaseTile);
    return tile;
  };

  const buildWall = () => {
    const layout = getLayout();
    state.columns = layout.columns;
    state.tileWidth = layout.tileWidth;
    state.tileHeight = layout.tileHeight;
    state.gap = layout.gap;
    state.columnItems = Array.from({ length: state.columns }, () => []);
    getPhotoItems().forEach((item, index) => state.columnItems[index % state.columns].push(item));
    state.columnMeta = state.columnItems.map((items) => ({ copyHeight: Math.max(state.tileHeight + state.gap, items.length * (state.tileHeight + state.gap)) }));
    state.offsets = state.columnMeta.map((meta, index) => meta.copyHeight * ((index * .37) % 1));
    state.velocities = state.columnItems.map(() => 0);
    state.baseVelocities = state.columnItems.map((_, index) => {
      const pseudo = (((index * .6180339887 + .35) % 1) * 2) - 1;
      const columnFactor = 1 + .45 * pseudo;
      return 42 * columnFactor * (index % 2 === 0 ? 1 : -1);
    });

    driftWall.style.setProperty('--dw-columns', String(state.columns));
    driftWall.style.setProperty('--dw-tile-w', `${state.tileWidth}px`);
    driftWall.style.setProperty('--dw-tile-h', `${state.tileHeight}px`);
    driftWall.style.setProperty('--dw-gap', `${state.gap}px`);
    plane.replaceChildren();
    state.tracks = [];

    state.columnItems.forEach((items, column) => {
      const columnElement = document.createElement('div');
      columnElement.className = 'drift-wall__col';
      const track = document.createElement('div');
      track.className = 'drift-wall__track';
      for (let copy = 0; copy < 4; copy += 1) {
        items.forEach((item) => track.appendChild(renderTile(item, column)));
      }
      columnElement.appendChild(track);
      plane.appendChild(columnElement);
      state.tracks.push(track);
    });
  };

  const applyPlaneTransform = (x, y) => {
    const scale = window.innerWidth <= 640 ? 1.16 : window.innerWidth <= 900 ? 1.26 : 1.46;
    const tilt = window.innerWidth <= 640 ? 8 : window.innerWidth <= 900 ? 10 : 12;
    const turn = window.innerWidth <= 640 ? -8 : window.innerWidth <= 900 ? -11 : -14;
    const depth = window.innerWidth <= 640 ? -80 : window.innerWidth <= 900 ? -100 : -120;
    plane.style.transform = `translate(-50%, -50%) scale(${scale}) rotateX(${tilt + y}deg) rotateY(${turn + x}deg) translateZ(${depth}px)`;
  };

  const animate = (time) => {
    if (state.lastTime === null) state.lastTime = time;
    const delta = Math.min(.05, Math.max(0, time - state.lastTime) / 1000);
    state.lastTime = time;
    const maxTilt = 4.8;
    const targetX = state.pointer.x * maxTilt;
    const targetY = -state.pointer.y * maxTilt;
    const damp = 1 - Math.exp(-delta / .12);
    state.pointerDamped.x += (targetX - state.pointerDamped.x) * damp;
    state.pointerDamped.y += (targetY - state.pointerDamped.y) * damp;
    applyPlaneTransform(state.pointerDamped.x, state.pointerDamped.y);

    state.tracks.forEach((track, column) => {
      const meta = state.columnMeta[column];
      if (!meta) return;
      const target = state.reduced || state.hoveredColumn === column ? 0 : state.baseVelocities[column];
      const ease = 1 - Math.exp(-delta / (target === 0 ? .16 : .28));
      state.velocities[column] += (target - state.velocities[column]) * ease;
      let next = (state.offsets[column] || 0) + state.velocities[column] * delta;
      next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
      state.offsets[column] = next;
      track.style.transform = `translate3d(0, ${-next}px, 0)`;
    });
    state.raf = window.requestAnimationFrame(animate);
  };

  const onPointerMove = (event) => {
    const rect = driftWall.getBoundingClientRect();
    state.pointer = { x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 };
    const tile = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-tile-id]');
    if (tile) setActiveTile(tile.dataset.tileId, Number(tile.dataset.col));
  };

  const resizeObserver = new ResizeObserver(([entry]) => {
    state.containerHeight = entry.contentRect.height || 600;
  });
  resizeObserver.observe(driftWall);
  driftWall.addEventListener('pointerenter', () => { state.wallHovered = true; });
  driftWall.addEventListener('pointermove', onPointerMove);
  driftWall.addEventListener('pointerleave', () => {
    state.wallHovered = false;
    state.pointer = { x: 0, y: 0 };
    releaseTile();
  });
  reducedMotionQuery.addEventListener('change', (event) => { state.reduced = event.matches; });

  let lastColumns = 0;
  const handleResize = () => {
    const nextColumns = getLayout().columns;
    if (nextColumns !== lastColumns) {
      lastColumns = nextColumns;
      buildWall();
    }
  };
  window.addEventListener('resize', handleResize, { passive: true });
  handleResize();
  state.raf = window.requestAnimationFrame(animate);
}
