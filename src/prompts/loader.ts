import fs from 'fs';
import path from 'path';

/**
 * Load a prompt template from file
 */
export function loadPromptTemplate(templateName: string): string {
  const templatePath = path.join(__dirname, `${templateName}.txt`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Prompt template not found: ${templateName}`);
  }
  
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Inject variables into a prompt template
 */
export function injectVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = formatValue(value);
    result = result.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  return result;
}

/**
 * Format a value for injection into prompt
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'None';
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Load and inject variables into a prompt template
 */
export function buildPrompt(
  templateName: string,
  variables: Record<string, any>
): string {
  const template = loadPromptTemplate(templateName);
  return injectVariables(template, variables);
}

/**
 * Build the complete system prompt with base + context-specific prompts
 */
export function buildSystemPrompt(
  userContext: {
    user_name: string;
    user_role: string;
    user_id: string;
    dietary_preferences?: string[];
    allergies?: string[];
    preferred_food_types?: string[];
    frequent_items?: string[];
  },
  contextType?: 'food_discovery' | 'pantry_booking' | 'food_reservation' | 'smart_pantry_cart' | 'recommendation'
): string {
  // Start with base system prompt
  let systemPrompt = buildPrompt('base_system_prompt', {
    user_name: userContext.user_name,
    user_role: userContext.user_role,
    user_id: userContext.user_id
  });
  
  // Add context-specific prompt if provided
  if (contextType) {
    const contextPrompt = buildPrompt(contextType + '_prompt', userContext);
    systemPrompt += '\n\n' + contextPrompt;
  }
  
  return systemPrompt;
}
