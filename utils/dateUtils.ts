export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

export const getDayOfWeek = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

export const getRelativeDate = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return formatShortDate(date);
};

/**
 * Calculate smart progress tracking for weight loss/gain/maintenance
 * @param startWeight - The user's onboarding weight
 * @param currentWeight - The latest logged weight
 * @param goal - 'lose' | 'gain' | 'maintain'
 * @param targetWeight - The user's target weight (optional)
 * @returns { percentToGoal, kgToGo, direction, onTrack }
 */
export function calculateWeightProgress({
  startWeight,
  currentWeight,
  goal,
  targetWeight,
}: {
  startWeight: number;
  currentWeight: number;
  goal: 'lose' | 'gain' | 'maintain';
  targetWeight?: number;
}) {
  // Ensure all values are numbers and have defaults
  const safeStartWeight = startWeight || 0;
  const safeCurrentWeight = currentWeight || 0;
  const safeGoal = goal || 'maintain';
  const safeTargetWeight = targetWeight || 0;
  
  if (!safeStartWeight || !safeCurrentWeight) {
    return { 
      percentToGoal: 0, 
      kgToGo: 0, 
      direction: 'none', 
      onTrack: false 
    };
  }
  
  let direction = 'none';
  let kgToGo = 0;
  let percentToGoal = 0;
  let onTrack = false;
  
  if (safeGoal === 'lose' && safeTargetWeight && safeStartWeight > safeTargetWeight) {
    direction = 'down';
    kgToGo = Math.max(0, safeCurrentWeight - safeTargetWeight);
    percentToGoal = Math.min(100, ((safeStartWeight - safeCurrentWeight) / (safeStartWeight - safeTargetWeight)) * 100);
    onTrack = safeCurrentWeight <= safeStartWeight && safeCurrentWeight >= safeTargetWeight;
  } else if (safeGoal === 'gain' && safeTargetWeight && safeStartWeight < safeTargetWeight) {
    direction = 'up';
    kgToGo = Math.max(0, safeTargetWeight - safeCurrentWeight);
    percentToGoal = Math.min(100, ((safeCurrentWeight - safeStartWeight) / (safeTargetWeight - safeStartWeight)) * 100);
    onTrack = safeCurrentWeight >= safeStartWeight && safeCurrentWeight <= safeTargetWeight;
  } else if (safeGoal === 'maintain') {
    direction = 'maintain';
    kgToGo = Math.abs(safeCurrentWeight - safeStartWeight);
    percentToGoal = 100 - Math.min(100, (kgToGo / safeStartWeight) * 100);
    onTrack = kgToGo < 2; // within 2kg is considered on track
  }
  
  return { percentToGoal, kgToGo, direction, onTrack };
} 