
// Helper functions to convert between snake_case and camelCase
export const convertToSnakeCase = (data: any): any => {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, (_, letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = value;
    }
    return result;
  }
  
  export const convertToCamelCase = (data: any): any => {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = value;
    }
    return result;
  }
  