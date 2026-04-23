export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  positive?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  value?: number;
}

export function validateNumber(
  value: string | number,
  fieldName: string,
  rules: ValidationRule = {}
): ValidationResult {
  // Handle empty values
  if (value === '' || value === null || value === undefined) {
    if (rules.required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, value: 0 };
  }

  // Parse the value
  let numValue: number;
  if (typeof value === 'string') {
    numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { valid: false, error: `${fieldName} must be a valid number` };
    }
  } else {
    numValue = value;
  }

  // Validate integer
  if (rules.integer && !Number.isInteger(numValue)) {
    return { valid: false, error: `${fieldName} must be a whole number` };
  }

  // Validate positive
  if (rules.positive && numValue <= 0) {
    return { valid: false, error: `${fieldName} must be greater than 0` };
  }

  // Validate min
  if (rules.min !== undefined && numValue < rules.min) {
    return { valid: false, error: `${fieldName} must be at least ${rules.min}` };
  }

  // Validate max
  if (rules.max !== undefined && numValue > rules.max) {
    return { valid: false, error: `${fieldName} must be at most ${rules.max}` };
  }

  // Validate step (for decimals)
  if (rules.step !== undefined) {
    const remainder = numValue % rules.step;
    const tolerance = 0.0001;
    if (remainder > tolerance && rules.step - remainder > tolerance) {
      return { valid: false, error: `${fieldName} must be a multiple of ${rules.step}` };
    }
  }

  return { valid: true, value: numValue };
}

export function validateWorkoutSet(
  weight: string | number,
  reps: string | number,
  rpe: string | number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const weightResult = validateNumber(weight, 'Weight', {
    min: 0,
    max: 1000,
    positive: false,
  });

  const repsResult = validateNumber(reps, 'Reps', {
    min: 1,
    max: 100,
    integer: true,
    positive: true,
  });

  const rpeResult = validateNumber(rpe, 'RPE', {
    min: 1,
    max: 10,
    step: 0.5,
  });

  if (!weightResult.valid && weightResult.error) errors.push(weightResult.error);
  if (!repsResult.valid && repsResult.error) errors.push(repsResult.error);
  if (!rpeResult.valid && rpeResult.error) errors.push(rpeResult.error);

  return { valid: errors.length === 0, errors };
}

export function validateReadinessScore(
  value: string | number,
  fieldName: string,
  min: number = 1,
  max: number = 10
): ValidationResult {
  return validateNumber(value, fieldName, {
    min,
    max,
    step: 0.5,
  });
}
