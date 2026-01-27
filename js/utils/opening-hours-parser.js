/**
 * OpeningHoursParser - Parse and Check Opening Hours
 *
 * Handles opening hours validation, formatting, and "open now" checking.
 */

import { DAYS_OF_WEEK_FULL, DAY_NAMES_IT, OPENING_HOURS_PATTERNS } from '../config/constants.js';

export class OpeningHoursParser {
  constructor() {
    this.daysOfWeek = DAYS_OF_WEEK_FULL;
    this.dayNamesIT = DAY_NAMES_IT;
    this.patterns = OPENING_HOURS_PATTERNS;
  }

  /**
   * Check if place is currently open
   * @param {Object} place - Place object with openingHours
   * @returns {boolean} True if place is open now
   */
  isOpenNow(place) {
    if (!place.openingHours) {
      return false;
    }

    const now = new Date();
    const currentDay = this.daysOfWeek[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes from midnight

    const dayHours = place.openingHours[currentDay];

    // No hours for today = closed
    if (!dayHours) {
      return false;
    }

    // By appointment - consider it "available"
    if (dayHours.toLowerCase() === 'su appuntamento') {
      return true;
    }

    // Parse hours
    const timeRanges = this._parseTimeRanges(dayHours);

    // Check if current time falls within any range
    return timeRanges.some(range => {
      return currentTime >= range.start && currentTime <= range.end;
    });
  }

  /**
   * Parse time ranges from hours string
   * @param {string} hoursStr - Hours string (e.g., "10:30-13:30" or "10:30-13:30 - 16:00-18:00")
   * @returns {Array} Array of {start, end} in minutes
   */
  _parseTimeRanges(hoursStr) {
    const ranges = [];

    // Split by " - " for double opening
    const parts = hoursStr.split(' - ');

    parts.forEach(part => {
      const match = part.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
      if (match) {
        const startHour = parseInt(match[1], 10);
        const startMin = parseInt(match[2], 10);
        const endHour = parseInt(match[3], 10);
        const endMin = parseInt(match[4], 10);

        ranges.push({
          start: startHour * 60 + startMin,
          end: endHour * 60 + endMin
        });
      }
    });

    return ranges;
  }

  /**
   * Validate opening hours format
   * @param {string} hoursStr - Hours string to validate
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateFormat(hoursStr) {
    // Empty string is valid (closed)
    if (hoursStr === '') {
      return { valid: true };
    }

    // Check for "su appuntamento"
    if (this.patterns.appointment.test(hoursStr)) {
      return { valid: true };
    }

    // Check single opening pattern
    if (this.patterns.single.test(hoursStr)) {
      return { valid: true };
    }

    // Check double opening pattern
    if (this.patterns.double.test(hoursStr)) {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Formato non valido. Usa: "10:30-13:30" o "10:30-13:30 - 16:00-18:00" o "su appuntamento"'
    };
  }

  /**
   * Format opening hours for display
   * @param {Object} hours - Opening hours object { lunedi: "...", martedi: "...", ... }
   * @returns {string} HTML string with formatted hours
   */
  formatForDisplay(hours) {
    if (!hours) {
      return '<p style="color: #666;">Orari non disponibili</p>';
    }

    const daysOrder = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];

    return daysOrder.map(day => {
      const dayName = this.dayNamesIT[day];
      const dayHours = hours[day] || 'Chiuso';

      return `
        <div class="hours-row">
          <span class="day-name">${dayName}</span>
          <span class="day-hours">${dayHours}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Get compact hours summary (e.g., "Lun-Ven: 9:00-18:00")
   * @param {Object} hours - Opening hours object
   * @returns {string} Compact summary
   */
  getCompactSummary(hours) {
    if (!hours) {
      return 'Orari non disponibili';
    }

    // Find most common pattern
    const hoursArray = Object.entries(hours);
    if (hoursArray.length === 0) {
      return 'Chiuso';
    }

    // Group consecutive days with same hours
    const groups = [];
    let currentGroup = null;

    const daysOrder = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];

    daysOrder.forEach(day => {
      const dayHours = hours[day] || 'Chiuso';

      if (!currentGroup || currentGroup.hours !== dayHours) {
        currentGroup = { days: [day], hours: dayHours };
        groups.push(currentGroup);
      } else {
        currentGroup.days.push(day);
      }
    });

    // Format groups
    return groups.map(group => {
      const dayNames = group.days.map(d => this.dayNamesIT[d]);
      const daysStr = group.days.length > 2
        ? `${dayNames[0]}-${dayNames[dayNames.length - 1]}`
        : dayNames.join(', ');

      return `${daysStr}: ${group.hours}`;
    }).join(' • ');
  }

  /**
   * Check if hours are valid for all days
   * @param {Object} hours - Opening hours object
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validateAllDays(hours) {
    if (!hours) {
      return { valid: true, errors: [] };
    }

    const errors = [];

    Object.entries(hours).forEach(([day, hoursStr]) => {
      const validation = this.validateFormat(hoursStr);
      if (!validation.valid) {
        errors.push({
          day: this.dayNamesIT[day] || day,
          error: validation.error,
          value: hoursStr
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get current status message
   * @param {Object} place - Place object
   * @returns {string} Status message (e.g., "Aperto ora", "Chiuso", "Su appuntamento")
   */
  getStatusMessage(place) {
    if (!place.openingHours) {
      return 'Orari non disponibili';
    }

    const now = new Date();
    const currentDay = this.daysOfWeek[now.getDay()];
    const dayHours = place.openingHours[currentDay];

    if (!dayHours) {
      return 'Chiuso oggi';
    }

    if (dayHours.toLowerCase() === 'su appuntamento') {
      return 'Su appuntamento';
    }

    return this.isOpenNow(place) ? 'Aperto ora' : 'Chiuso ora';
  }

  /**
   * Get next opening time
   * @param {Object} place - Place object
   * @returns {string|null} Next opening time message or null
   */
  getNextOpeningTime(place) {
    if (!place.openingHours || this.isOpenNow(place)) {
      return null;
    }

    const now = new Date();
    const currentDay = this.daysOfWeek[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const dayHours = place.openingHours[currentDay];

    if (dayHours && dayHours.toLowerCase() !== 'su appuntamento') {
      const timeRanges = this._parseTimeRanges(dayHours);

      // Check if there's a later opening today
      const nextToday = timeRanges.find(range => range.start > currentTime);
      if (nextToday) {
        const hours = Math.floor(nextToday.start / 60);
        const minutes = nextToday.start % 60;
        return `Apre alle ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }

    // Check next days (up to 7 days)
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (now.getDay() + i) % 7;
      const nextDay = this.daysOfWeek[nextDayIndex];
      const nextDayHours = place.openingHours[nextDay];

      if (nextDayHours && nextDayHours.toLowerCase() !== 'su appuntamento') {
        const timeRanges = this._parseTimeRanges(nextDayHours);
        if (timeRanges.length > 0) {
          const dayName = this.dayNamesIT[nextDay];
          const hours = Math.floor(timeRanges[0].start / 60);
          const minutes = timeRanges[0].start % 60;
          return `Apre ${dayName} alle ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const openingHoursParser = new OpeningHoursParser();
