/**
 * CalendarRenderer - Calendar UI Rendering
 *
 * Renders the monthly calendar with event indicators and handles
 * date selection for filtering events.
 *
 * Dependencies: EventBus, StateManager, DateFormatter, DateFilter
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { dateFormatter } from '../utils/date-formatter.js';
import { dateFilter } from '../filters/date-filter.js';
import { DAYS_OF_WEEK_SHORT } from '../config/constants.js';

export class CalendarRenderer {
  constructor(eventBusInstance, stateManager, formatter, dateFilterInstance) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.dateFormatter = formatter;
    this.dateFilter = dateFilterInstance;
    this.daysOfWeek = DAYS_OF_WEEK_SHORT;
  }

  /**
   * Initialize calendar renderer
   */
  initialize() {
    // Subscribe to filter events
    this.eventBus.on('filters:applied', () => {
      this.render();
    });

    // Subscribe to month changes
    this.state.subscribe('currentMonth', () => {
      this.render();
    });

    // Subscribe to date selection
    this.state.subscribe('selectedDate', () => {
      this.render();
    });

    // Expose changeMonth to window for onclick handlers
    window.changeMonth = (offset) => this.changeMonth(offset);

    console.log('✅ CalendarRenderer initialized');
  }

  /**
   * Render calendar
   */
  render() {
    const calendar = document.getElementById('calendar');
    const monthYearEl = document.getElementById('monthYear');

    if (!calendar || !monthYearEl) {
      console.warn('⚠️ Calendar elements not found');
      return;
    }

    const currentMonth = this.state.get('currentMonth');
    const selectedDateStr = this.state.get('selectedDate');
    const filteredEvents = this.state.get('filteredEvents');

    // Clear calendar
    calendar.innerHTML = '';

    // Update month/year header
    monthYearEl.textContent = this.dateFormatter.formatMonthYear(currentMonth);

    // Render day headers
    this.daysOfWeek.forEach(day => {
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = day;
      calendar.appendChild(header);
    });

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Render empty days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      calendar.appendChild(emptyDay);
    }

    // Render days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = this._createDayElement(year, month, day, selectedDateStr, filteredEvents);
      calendar.appendChild(dayElement);
    }
  }

  /**
   * Create a calendar day element
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @param {number} day - Day of month
   * @param {string|null} selectedDateStr - Selected date string (YYYY-MM-DD)
   * @param {Array} events - Filtered events
   * @returns {HTMLElement} Day element
   */
  _createDayElement(year, month, day, selectedDateStr, events) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Mark selected date
    if (selectedDateStr === dateStr) {
      dayElement.classList.add('selected');
    }

    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);

    // Count events on this day
    const dayEvents = this._getEventsOnDate(events, dateStr);

    if (dayEvents.length > 0) {
      const eventElement = document.createElement('div');
      eventElement.className = 'calendar-event';
      eventElement.textContent = `${dayEvents.length} event${dayEvents.length === 1 ? 'o' : 'i'}`;
      dayElement.appendChild(eventElement);
    }

    // Click handler
    dayElement.onclick = () => this._handleDayClick(dateStr);

    return dayElement;
  }

  /**
   * Get events on a specific date
   * @param {Array} events - Events array
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {Array} Events on this date
   */
  _getEventsOnDate(events, dateStr) {
    return events.filter(event => {
      // Handle multi-day events
      if (event.dateEnd) {
        return dateStr >= event.date && dateStr <= event.dateEnd;
      }
      // Single day event
      return event.date === dateStr;
    });
  }

  /**
   * Handle day click
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   */
  _handleDayClick(dateStr) {
    const currentSelectedDate = this.state.get('selectedDate');

    if (currentSelectedDate === dateStr) {
      // Deselect date
      this.dateFilter.clearDate();
    } else {
      // Select date
      const date = this.dateFormatter.parseYYYYMMDD(dateStr);
      this.dateFilter.selectDate(date);
    }
  }

  /**
   * Change month
   * @param {number} offset - Month offset (-1 for previous, +1 for next)
   */
  changeMonth(offset) {
    const currentMonth = this.state.get('currentMonth');
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);

    this.state.set('currentMonth', newMonth);

    this.eventBus.emit('calendar:monthChanged', {
      month: newMonth,
      offset
    });

    console.log('📅 Month changed:', this.dateFormatter.formatMonthYear(newMonth));
  }

  /**
   * Go to today
   */
  goToToday() {
    const today = this.dateFormatter.getToday();
    this.state.set('currentMonth', new Date(today));
    this.render();
  }

  /**
   * Go to specific month
   * @param {Date} date - Date in target month
   */
  goToMonth(date) {
    this.state.set('currentMonth', new Date(date));
    this.render();
  }

  /**
   * Highlight today in calendar
   */
  highlightToday() {
    const today = this.dateFormatter.getToday();
    const todayStr = this.dateFormatter.formatYYYYMMDD(today);

    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    const days = calendar.querySelectorAll('.calendar-day');
    days.forEach(day => {
      const dayNumber = day.querySelector('.calendar-day-number');
      if (!dayNumber) return;

      const dayNum = parseInt(dayNumber.textContent, 10);
      const currentMonth = this.state.get('currentMonth');
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

      if (dateStr === todayStr) {
        day.classList.add('today');
      }
    });
  }
}

// Export singleton instance
export const calendarRenderer = new CalendarRenderer(eventBus, state, dateFormatter, dateFilter);
