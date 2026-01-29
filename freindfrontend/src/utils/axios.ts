// Mock API client for demo purposes
// In production, replace with actual axios configuration

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  get: async <T>(url: string): Promise<T> => {
    await delay(300);
    console.log(`GET ${url}`);
    return {} as T;
  },
  
  post: async <T>(url: string, data: unknown): Promise<T> => {
    await delay(300);
    console.log(`POST ${url}`, data);
    return {} as T;
  },
  
  put: async <T>(url: string, data: unknown): Promise<T> => {
    await delay(300);
    console.log(`PUT ${url}`, data);
    return {} as T;
  },
  
  delete: async <T>(url: string): Promise<T> => {
    await delay(300);
    console.log(`DELETE ${url}`);
    return {} as T;
  },
};

export default api;
