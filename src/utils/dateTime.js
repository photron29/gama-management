/**
 * Utility functions for date and time handling in IST (GMT +5:30)
 */

/**
 * Get current date in IST timezone as YYYY-MM-DD string
 */
export const getCurrentDateIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60; // IST is UTC + 5:30
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (istOffset * 60000));
    return ist.toISOString().split('T')[0];
};

/**
 * Get current date and time in IST timezone
 */
export const getCurrentDateTimeIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (istOffset * 60000));
    return ist;
};

/**
 * Get current month in YYYY-MM format (IST timezone)
 */
export const getCurrentMonthIST = () => {
    const now = getCurrentDateTimeIST();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

/**
 * Get fee due date (10th of the month) for a given month
 * @param {string} yearMonth - Format: YYYY-MM
 * @returns {string} - Format: YYYY-MM-10
 */
export const getFeeDueDate = (yearMonth) => {
    return `${yearMonth}-10`;
};

/**
 * Format date to readable string
 * @param {string} dateStr - Format: YYYY-MM-DD
 * @returns {string} - Format: DD/MM/YYYY
 */
export const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

/**
 * Check if a date is in the past (compared to IST current date)
 * @param {string} dateStr - Format: YYYY-MM-DD
 * @returns {boolean}
 */
export const isDatePast = (dateStr) => {
    const currentDate = getCurrentDateIST();
    return dateStr < currentDate;
};

/**
 * Check if a fee is overdue based on due date
 * @param {string} dueDate - Format: YYYY-MM-DD
 * @param {string} status - Fee status
 * @returns {boolean}
 */
export const isFeeOverdue = (dueDate, status) => {
    if (status === 'paid') return false;
    return isDatePast(dueDate);
};

