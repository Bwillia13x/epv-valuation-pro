import { NextApiRequest, NextApiResponse } from 'next';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'EPV Valuation Pro API',
    version: '1.0.0',
    description: 'Professional financial valuation platform API for earnings power value analysis',
    contact: {
      name: 'EPV Valuation Pro Support',
      email: 'support@epvvaluationpro.com'
    }
  },
  servers: [
    {
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      description: 'Production server'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check endpoint',
        description: 'Returns the health status of the API and connected services',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    services: {
                      type: 'object',
                      properties: {
                        database: { type: 'string', example: 'connected' },
                        redis: { type: 'string', example: 'connected' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'User authentication',
        description: 'Authenticate user with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['ANALYST', 'SENIOR_ANALYST', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'] }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials'
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'User registration',
        description: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  organization: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Registration successful'
          },
          '400': {
            description: 'Validation error or user already exists'
          }
        }
      }
    },
    '/api/cases': {
      get: {
        summary: 'List valuation cases',
        description: 'Get a list of valuation cases for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of cases',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      status: { type: 'string', enum: ['DRAFT', 'ANALYZING', 'REVIEW', 'COMPLETE', 'ARCHIVED'] },
                      industry: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create new case',
        description: 'Create a new valuation case',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'financialData'],
                properties: {
                  name: { type: 'string' },
                  industry: { type: 'string' },
                  analysisType: { type: 'string', default: 'EPV' },
                  financialData: { type: 'object' },
                  assumptions: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Case created successfully'
          }
        }
      }
    },
    '/api/exports/pdf': {
      post: {
        summary: 'Generate PDF/PNG reports',
        description: 'Generate professional PDF or PNG reports from case data',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['caseData', 'title', 'ttm'],
                properties: {
                  caseData: { type: 'object', description: 'Financial case data' },
                  title: { type: 'string', description: 'Report title' },
                  ttm: { type: 'string', description: 'TTM period description' },
                  template: { 
                    type: 'string', 
                    enum: ['onepager', 'bridge', 'matrix', 'epv', 'lbo'],
                    default: 'onepager'
                  },
                  format: { 
                    type: 'string', 
                    enum: ['pdf', 'png'],
                    default: 'pdf'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Report generated successfully',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' }
              },
              'image/png': {
                schema: { type: 'string', format: 'binary' }
              }
            }
          },
          '400': {
            description: 'Invalid request data'
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return Swagger UI HTML
  const swaggerHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>EPV Valuation Pro API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(swaggerHtml);
} 