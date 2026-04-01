/**
 * FilterChipRenderer - Dynamic Category Filter Chips
 *
 * Rebuilds #eventCategoryFilters and #placeCategoryFilters from the
 * categories loaded by mapCategoriesLoader. This replaces the static
 * HTML chips so newly added categories (e.g. "pub") appear automatically.
 *
 * Dot colors for known categories are handled by CSS [data-cat] rules.
 * For custom/new categories the color is set via --dot-color CSS variable.
 */

import { eventBus } from '../core/event-bus.js';

// These have dedicated CSS [data-cat]::before rules in index.html
const KNOWN_EVENT_CATS = new Set([
  'live-music', 'open-mic', 'concerto', 'spettacolo-teatrale',
  'mostra', 'workshop', 'fiera', 'altro',
]);
const KNOWN_PLACE_CATS = new Set([
  'museo', 'galleria', 'parco', 'biblioteca', 'teatro',
  'coworking', 'ristorante', 'centro-sociale', 'fondazione', 'altro',
]);

class FilterChipRenderer {
  initialize() {
    eventBus.on('mapCategories:loaded', ({ eventCategories, placeCategories }) => {
      this._renderChips('eventCategoryFilters', eventCategories, 'toggleEventCategory', false, KNOWN_EVENT_CATS);
      this._renderChips('placeCategoryFilters', placeCategories, 'togglePlaceCategory', true, KNOWN_PLACE_CATS);
    });
  }

  _renderChips(containerId, categories, toggleFn, isPlaces, knownSet) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Preserve the title element
    const title = container.querySelector('.filters-title');
    container.innerHTML = '';
    if (title) container.appendChild(title);

    // "Qualsiasi" chip
    const allChip = this._makeChip('all', window.t ? window.t('filters.all') : 'Qualsiasi', null, toggleFn, isPlaces, true);
    allChip.setAttribute('data-i18n', 'filters.all');
    container.appendChild(allChip);

    // "altro" always last
    const sorted = [
      ...categories.filter(c => c.key !== 'altro'),
      ...categories.filter(c => c.key === 'altro'),
    ];

    for (const cat of sorted) {
      const label = cat.name;
      const chip = this._makeChip(cat.key, label, knownSet.has(cat.key) ? null : cat.color, toggleFn, isPlaces, false);
      container.appendChild(chip);
    }
  }

  _makeChip(key, label, dotColor, toggleFn, isPlaces, isAll) {
    const chip = document.createElement('div');
    chip.className = `filter-checkbox${isPlaces ? ' places-filter' : ''}${isAll ? ' checked' : ''}`;
    chip.setAttribute('data-cat', key);
    chip.setAttribute('onclick', `${toggleFn}('${key}')`);
    if (dotColor) chip.style.setProperty('--dot-color', dotColor);
    chip.textContent = label;
    return chip;
  }
}

export const filterChipRenderer = new FilterChipRenderer();
