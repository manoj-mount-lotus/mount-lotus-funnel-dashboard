export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      daily_funnel_reports: {
        Row: {
          id: string;
          report_date: string;
          total_appointments: number;
          cancelled: number;
          no_show: number;
          completed: number;
          total_received_calls: number;
          meta_call_to_action: number;
          reception_tracking_meta: number;
          missed_meta_leads: number;
          appointments_from_meta: number;
          no_appointments_from_meta: number;
          total_cataract_surgeries: number;
          cataract_surgery_from_meta: number;
          cataract_surgery_from_other: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_date: string;
          total_appointments?: number;
          cancelled?: number;
          no_show?: number;
          completed?: number;
          total_received_calls?: number;
          meta_call_to_action?: number;
          reception_tracking_meta?: number;
          missed_meta_leads?: number;
          appointments_from_meta?: number;
          no_appointments_from_meta?: number;
          total_cataract_surgeries?: number;
          cataract_surgery_from_meta?: number;
          cataract_surgery_from_other?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_date?: string;
          total_appointments?: number;
          cancelled?: number;
          no_show?: number;
          completed?: number;
          total_received_calls?: number;
          meta_call_to_action?: number;
          reception_tracking_meta?: number;
          missed_meta_leads?: number;
          appointments_from_meta?: number;
          no_appointments_from_meta?: number;
          total_cataract_surgeries?: number;
          cataract_surgery_from_meta?: number;
          cataract_surgery_from_other?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
