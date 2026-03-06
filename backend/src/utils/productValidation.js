const ALLOWED_CATEGORIES = [
  'Packaging',
  'Bags',
  'Cutlery',
  'Containers',
  'Stationery',
  'Hygiene',
  'Hospitality',
  'Industrial',
];

const ALLOWED_FILTERS = [
  'compostable',
  'biodegradable',
  'recyclable',
  'fsc-certified',
  'plastic-free',
  'food-safe',
  'reusable',
  'water-based-ink',
];

function validateProductClassification(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['AI output must be a JSON object'] };
  }

  if (!payload.category || !ALLOWED_CATEGORIES.includes(payload.category)) {
    errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  if (!payload.subCategory || typeof payload.subCategory !== 'string') {
    errors.push('subCategory must be a non-empty string');
  }

  if (!Array.isArray(payload.seoTags)) {
    errors.push('seoTags must be an array of strings');
  } else if (!payload.seoTags.every((tag) => typeof tag === 'string' && tag.trim())) {
    errors.push('seoTags must contain only non-empty strings');
  }

  if (!Array.isArray(payload.sustainabilityFilters)) {
    errors.push('sustainabilityFilters must be an array of strings');
  } else {
    const invalidFilter = payload.sustainabilityFilters.find(
      (filter) => !ALLOWED_FILTERS.includes(filter)
    );
    if (invalidFilter) {
      errors.push(
        `invalid sustainability filter: ${invalidFilter}. Allowed: ${ALLOWED_FILTERS.join(', ')}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_FILTERS,
  validateProductClassification,
};
