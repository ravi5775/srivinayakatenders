import { supabase } from '@/integrations/supabase/client';
import { Customer, Payment } from '@/types/loan';

const SPREADSHEET_ID = '1jkSASVUEKfxGUTa3DhDwQViJvziWTHPf3I-g8ptbeXM';

export class GoogleSheetsIntegrationService {
  private static instance: GoogleSheetsIntegrationService;

  public static getInstance(): GoogleSheetsIntegrationService {
    if (!GoogleSheetsIntegrationService.instance) {
      GoogleSheetsIntegrationService.instance = new GoogleSheetsIntegrationService();
    }
    return GoogleSheetsIntegrationService.instance;
  }

  private async callGoogleSheetsFunction(action: string, data?: any, sheetName?: string) {
    try {
      // Get the current session to ensure we have proper authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data: result, error } = await supabase.functions.invoke('google-sheets', {
        body: {
          action,
          data,
          spreadsheetId: SPREADSHEET_ID,
          sheetName
        }
      });

      if (error) {
        console.error('Google Sheets function error:', error);
        throw new Error(error.message || 'Failed to execute Google Sheets operation');
      }

      return result;
    } catch (error) {
      console.error('Google Sheets integration error:', error);
      throw error;
    }
  }

  // Customer operations
  async getCustomers(): Promise<any[]> {
    return await this.callGoogleSheetsFunction('getCustomers', {}, 'Master');
  }

  async addCustomer(customerData: any[]): Promise<any> {
    return await this.callGoogleSheetsFunction('addCustomer', customerData, 'Master');
  }

  async updateCustomer(customerData: any): Promise<any> {
    return await this.callGoogleSheetsFunction('updateCustomer', customerData, 'Master');
  }

  // Payment operations
  async getPayments(): Promise<any[]> {
    return await this.callGoogleSheetsFunction('getPayments', {}, 'Payments');
  }

  async addPayment(paymentData: any): Promise<any> {
    return await this.callGoogleSheetsFunction('addPayment', paymentData);
  }

  async recordPayment(paymentData: any): Promise<any> {
    return await this.callGoogleSheetsFunction('recordPayment', paymentData);
  }

  // Logbook operations
  async getLogbook(): Promise<any[]> {
    return await this.callGoogleSheetsFunction('getLogbook', {}, 'Logbook');
  }

  // Bulk operations
  async bulkAddCustomers(customers: any[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const customer of customers) {
      try {
        await this.addCustomer(customer);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Customer ${customer[1] || 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getCustomers();
      return true;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }
}

export default GoogleSheetsIntegrationService;