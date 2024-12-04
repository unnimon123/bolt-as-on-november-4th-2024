import { createClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';
import { alert } from '@nativescript/core';
import { SecureStorageService } from './secure-storage';

const supabaseUrl = 'https://zwjokeieerbbzsoqukuf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3am9rZWllZXJiYnpzb3F1a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4NjI4MzIsImV4cCI6MjA0ODQzODgzMn0.9dccWoBFaIT_-3E1OXnFq489u2SnxnDkKKGLd552L8I';

const secureStorage = SecureStorageService.getInstance();

const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: {
      getItem: async (key: string) => {
        return await secureStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        await secureStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        await secureStorage.removeItem(key);
      }
    }
  },
  global: {
    fetch: fetch
  }
};

export function initializeSupabase() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, options);
    console.log('Supabase initialized successfully');
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    alert({
      title: "Connection Error",
      message: "Failed to connect to Supabase. Please check your connection.",
      okButtonText: "OK"
    });
    return null;
  }
}

export const supabase = initializeSupabase();