const { run } = require('../../database');
const { generateStructuredJson } = require('../../services/aiService');
const {
  ALLOWED_CATEGORIES,
  ALLOWED_FILTERS,
  validateProductClassification,
} = require('../utils/productValidation');

async function classifyProduct(req, res) {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({
      success: false,
      error: 'name and description are required',
    });
  }

  const prompt = `
Classify this product and return strict JSON with this exact schema:
{
  "category": string,
  "subCategory": string,
  "seoTags": string[],
  "sustainabilityFilters": string[]
}

Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}
Allowed sustainabilityFilters: ${ALLOWED_FILTERS.join(', ')}

Product name: ${name}
Product description: ${description}
  `;

  try {
    const aiResult = await generateStructuredJson({
      moduleName: 'Module-1 Product Categorization',
      prompt,
    });

    const validation = validateProductClassification(aiResult);
    if (!validation.valid) {
      return res.status(422).json({
        success: false,
        error: 'AI output validation failed',
        details: validation.errors,
      });
    }

    const createdAt = new Date().toISOString();
    const insert = await run(
      `INSERT INTO Products (name, description, category, subCategory, seoTags, sustainabilityFilters)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        aiResult.category,
        aiResult.subCategory,
        JSON.stringify(aiResult.seoTags),
        JSON.stringify(aiResult.sustainabilityFilters),
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        id: insert.id,
        name,
        description,
        category: aiResult.category,
        subCategory: aiResult.subCategory,
        seoTags: aiResult.seoTags,
        sustainabilityFilters: aiResult.sustainabilityFilters,
        createdAt,
      },
    });
  } catch (error) {
    console.error('Product classification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to classify product',
      details: error.message,
    });
  }
}

module.exports = {
  classifyProduct,
};
