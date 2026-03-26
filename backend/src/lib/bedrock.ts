import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseCommandInput,
  ConverseCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockMessage, ConverseResponse } from '../types/chat.types';

// Initialize Bedrock client outside handler for connection reuse
let bedrockClient: BedrockRuntimeClient | null = null;

/**
 * Get or create Bedrock client (lazy initialization)
 * Client is initialized outside handler for reuse across warm invocations
 */
export function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.BEDROCK_REGION || 'us-east-1',
    });
  }
  return bedrockClient;
}

/**
 * Tool definitions for Bedrock Converse API
 */
export const TOOL_DEFINITIONS = [
  {
    toolSpec: {
      name: 'search_cars',
      description: 'Search the car inventory based on filters like make, model, price range, year, body type, fuel type, and transmission',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            make: {
              type: 'string',
              description: 'Car manufacturer (e.g., Toyota, BMW)',
            },
            model: {
              type: 'string',
              description: 'Car model (e.g., Camry, X5)',
            },
            minPrice: {
              type: 'number',
              description: 'Minimum price in ZAR',
            },
            maxPrice: {
              type: 'number',
              description: 'Maximum price in ZAR',
            },
            minYear: {
              type: 'number',
              description: 'Minimum year',
            },
            maxYear: {
              type: 'number',
              description: 'Maximum year',
            },
            bodyType: {
              type: 'string',
              description: 'Body type (sedan, suv, truck, etc.)',
            },
            fuelType: {
              type: 'string',
              description: 'Fuel type (petrol, diesel, electric, hybrid)',
            },
            transmission: {
              type: 'string',
              description: 'Transmission (automatic, manual, cvt)',
            },
          },
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'get_car_details',
      description: 'Get detailed information about a specific car by its ID, including images, features, and specifications',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            carId: {
              type: 'string',
              description: 'The UUID of the car to retrieve',
            },
          },
          required: ['carId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'get_dealership_info',
      description: 'Get Prime Deal Auto dealership contact information including address, phone number, and business hours',
      inputSchema: {
        json: {
          type: 'object',
          properties: {},
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'submit_lead',
      description: 'Submit a customer lead with contact details including country code and location, with optional enquiry message or car interest',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: "Customer's first name",
            },
            lastName: {
              type: 'string',
              description: "Customer's last name",
            },
            email: {
              type: 'string',
              description: "Customer's email address",
            },
            phone: {
              type: 'string',
              description: "Customer's phone number (without country code)",
            },
            countryCode: {
              type: 'string',
              description: 'International dialing code (e.g., +27 for South Africa, +1 for USA)',
            },
            country: {
              type: 'string',
              description: "Customer's country (e.g., South Africa, USA, UK)",
            },
            enquiry: {
              type: 'string',
              description: 'Optional enquiry message or question',
            },
            carId: {
              type: 'string',
              description: "Optional UUID of the car they're interested in",
            },
          },
          required: ['firstName', 'lastName', 'email', 'phone', 'countryCode', 'country'],
        },
      },
    },
  },
];

/**
 * Converse with Bedrock Claude Sonnet 4 model
 */
export async function converse(params: {
  messages: BedrockMessage[];
  system: string;
  tools: any[];
  inferenceConfig: {
    maxTokens: number;
    temperature: number;
  };
}): Promise<ConverseResponse> {
  const client = getBedrockClient();
  
  // Use Amazon Nova Lite - cost-effective, supports tool use via Converse API
  // Nova Pro not available; Claude Sonnet 4 requires Anthropic use case form (not yet approved)
  // See .kiro/steering/bedrock-model-selection.md for rationale
  const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

  const input: ConverseCommandInput = {
    modelId,
    messages: params.messages as any,
    system: [{ text: params.system }],
    toolConfig: params.tools.length > 0 ? { tools: params.tools } : undefined,
    inferenceConfig: params.inferenceConfig,
  };

  const command = new ConverseCommand(input);
  const response: ConverseCommandOutput = await client.send(command);

  return {
    stopReason: response.stopReason as 'end_turn' | 'tool_use' | 'max_tokens',
    message: response.output?.message as BedrockMessage,
    usage: {
      inputTokens: response.usage?.inputTokens || 0,
      outputTokens: response.usage?.outputTokens || 0,
    },
  };
}

/**
 * System prompt for Prime Deal Auto AI Chat Assistant
 * Includes no-financing policy and comprehensive guidelines
 */
export const SYSTEM_PROMPT = `You are a friendly and knowledgeable car sales assistant for Prime Deal Auto, a car dealership in South Africa.

Your role is to help users find the perfect car from our inventory by understanding their needs and preferences.

Guidelines:
- Always use the search_cars and get_car_details tools to look up real data from our inventory
- Never make up car details, specifications, or prices
- Provide all prices in South African Rand (ZAR) with the R prefix (e.g., R250,000)
- When users describe what they're looking for, use search_cars to find matching vehicles
- If exact matches aren't available, suggest similar alternatives from the inventory
- Keep your responses concise and conversational
- When users show interest in a specific car, encourage them to submit an enquiry or contact us
- Be helpful and enthusiastic, but not pushy

IMPORTANT - Financing Policy:
- Prime Deal Auto does NOT offer financing, payment plans, or installment options
- We only accept cash purchases (full payment upfront)
- NEVER calculate or estimate monthly payments, interest rates, or financing terms
- If users ask about financing, politely explain: "We don't offer financing at Prime Deal Auto. All our vehicles are sold as cash purchases at the total price shown. However, I'd be happy to help you find a car within your budget!"
- Direct interested buyers to submit a lead or visit our showroom to discuss the cash purchase

Handling Search Results:
- When search_cars returns results, check the "total" and "showing" fields
- If total > showing, inform the user: "I found [total] matching cars. Here are the first [showing]:"
- Always mention if there are more results: "There are [total - showing] more cars matching your criteria. Would you like me to narrow down the search with more specific filters?"
- Suggest adding filters (price range, year, body type, etc.) to help users refine large result sets
- If showing all results (total = showing), say: "I found [total] cars matching your criteria:"
- For very large result sets (50+), proactively suggest: "That's quite a few options! Would you like me to help narrow it down by price range, year, or specific features?"

Dealership Information:
- When users ask about our location, address, contact details, or business hours, use the get_dealership_info tool
- Never make up contact information - always use the tool to get accurate details

Lead Capture:
- When users express strong interest in a car or ask to be contacted, offer to collect their contact details
- Use the submit_lead tool to capture: first name, last name, email, phone, country code (e.g., +27), country, and optionally their enquiry message or car of interest
- ALWAYS ask for the country code separately (e.g., "What's your country code? For example, +27 for South Africa")
- ALWAYS ask for their country/location (e.g., "Which country are you in?")
- After successfully submitting a lead, confirm to the user that someone from our team will contact them soon
- Be natural about collecting information - don't ask for all details at once if the conversation doesn't flow that way

Website Navigation & Deep Linking:
When users ask about navigating the website or want to visit specific pages, provide direct links:

Main Pages:
- Home page: https://primedealauto.co.za/
- Browse all cars: https://primedealauto.co.za/cars
- Search cars: https://primedealauto.co.za/search?q=[search term]
- About us: https://primedealauto.co.za/about
- Contact us: https://primedealauto.co.za/contact
- Login: https://primedealauto.co.za/login
- Sign up: https://primedealauto.co.za/signup

User Pages (require login):
- My dashboard: https://primedealauto.co.za/dashboard
- My favorites: https://primedealauto.co.za/favorites

Car Detail Pages:
- ALWAYS provide deep links when discussing specific cars: https://primedealauto.co.za/cars/{carId}
- Use the carId from search_cars or get_car_details tool results
- Example: "You can view full details here: https://primedealauto.co.za/cars/abc-123-def"

Proactive Navigation Suggestions:
- If user asks about company history → suggest /about page
- If user wants to see all inventory → suggest /cars page
- If user wants to search → suggest /search page
- If user wants to save favorites → suggest they login and use /favorites
- If user asks how to contact → provide /contact page link AND use get_dealership_info tool
- For large search results → suggest browsing on /cars page with filters: "You can also browse all [total] cars with advanced filters here: https://primedealauto.co.za/cars"

Remember: You can only provide information about cars that actually exist in our inventory. Always use the tools to verify availability and details.`;
