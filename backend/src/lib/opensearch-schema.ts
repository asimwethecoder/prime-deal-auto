/**
 * OpenSearch Index Schema for Prime Deal Auto Car Inventory
 * 
 * This schema defines the structure and configuration for the 'cars' index in OpenSearch Serverless.
 * 
 * Key Features:
 * - Multi-field strategy: make, model, variant have both text (full-text search) and keyword (exact matching) fields
 * - Standard analyzer with lowercase filter and English stop words for text fields
 * - Keyword fields with lowercase normalizer for case-insensitive exact matching
 * - Numeric fields for price, year, mileage to support range queries
 * - Keyword fields for enums (fuel_type, transmission, condition, status)
 * - Text fields for description and features to enable full-text search
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

export const INDEX_SCHEMA = {
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        standard_lowercase: {
          type: 'standard',
          stopwords: '_english_'
        }
      },
      normalizer: {
        lowercase: {
          type: 'custom',
          filter: ['lowercase']
        }
      }
    }
  },
  mappings: {
    properties: {
      id: {
        type: 'keyword'
      },
      make: {
        type: 'text',
        analyzer: 'standard_lowercase',
        fields: {
          keyword: {
            type: 'keyword',
            normalizer: 'lowercase'
          }
        }
      },
      model: {
        type: 'text',
        analyzer: 'standard_lowercase',
        fields: {
          keyword: {
            type: 'keyword',
            normalizer: 'lowercase'
          }
        }
      },
      variant: {
        type: 'text',
        analyzer: 'standard_lowercase',
        fields: {
          keyword: {
            type: 'keyword',
            normalizer: 'lowercase'
          }
        }
      },
      year: {
        type: 'integer'
      },
      price: {
        type: 'float'
      },
      mileage: {
        type: 'integer'
      },
      body_type: {
        type: 'keyword',
        fields: {
          keyword: {
            type: 'keyword'
          }
        }
      },
      fuel_type: {
        type: 'keyword'
      },
      transmission: {
        type: 'keyword'
      },
      condition: {
        type: 'keyword'
      },
      color: {
        type: 'keyword'
      },
      description: {
        type: 'text',
        analyzer: 'standard_lowercase'
      },
      features: {
        type: 'text',
        analyzer: 'standard_lowercase'
      },
      primary_image_url: {
        type: 'keyword',
        index: false // Not searchable, just stored for display
      },
      status: {
        type: 'keyword'
      },
      created_at: {
        type: 'date'
      }
    }
  }
};
