/**
 * Trial period utility functions
 */

export interface TrialStatus {
  isExpired: boolean;
  daysRemaining: number;
  trialStartDate: string | null;
}

/**
 * Calculate trial status based on trial_start_date
 * @param trialStartDate - ISO string of trial start date or null
 * @returns TrialStatus object with expiration info
 */
export function getTrialStatus(trialStartDate: string | null): TrialStatus {
  if (!trialStartDate) {
    // If no trial start date, assume trial hasn't started yet
    return {
      isExpired: false,
      daysRemaining: 14,
      trialStartDate: null
    };
  }

  const trialStart = new Date(trialStartDate);
  const now = new Date();
  const trialEnd = new Date(trialStart);
  trialEnd.setDate(trialEnd.getDate() + 14);

  const diffInMs = trialEnd.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  return {
    isExpired: diffInDays <= 0,
    daysRemaining: Math.max(0, diffInDays),
    trialStartDate
  };
}

/**
 * Check if ROI modal should be shown (D-3, D-2, D-1)
 * @param daysRemaining - Number of days remaining in trial
 * @returns boolean indicating if modal should show
 */
export function shouldShowRoiModal(daysRemaining: number): boolean {
  // Use Math.floor to handle decimal time differences safely
  const floorDays = Math.floor(daysRemaining);
  return floorDays >= 1 && floorDays <= 3;
}

/**
 * Check if ROI modal should be shown today (respecting session storage)
 * @param daysRemaining - Number of days remaining in trial
 * @returns boolean indicating if modal should show today
 */
export function shouldShowRoiModalToday(daysRemaining: number): boolean {
  // First check if it's within the D-3 window
  if (!shouldShowRoiModal(daysRemaining)) {
    return false;
  }

  // Check session storage to prevent showing multiple times per day
  const today = new Date().toDateString();
  const lastShown = sessionStorage.getItem('roiModalLastShown');
  
  if (lastShown === today) {
    return false;
  }

  return true;
}

/**
 * Mark ROI modal as shown for today
 */
export function markRoiModalShown(): void {
  const today = new Date().toDateString();
  sessionStorage.setItem('roiModalLastShown', today);
}

/**
 * Clear ROI modal session storage (for testing)
 */
export function clearRoiModalSession(): void {
  sessionStorage.removeItem('roiModalLastShown');
}
