import { Observable } from '@nativescript/core';
import geoip from 'geoip-lite';

export class RegionService extends Observable {
  private static instance: RegionService;
  private readonly DEFAULT_REGION = 'global';
  private readonly REGIONS = [
    'na-east',
    'na-west',
    'eu-west',
    'eu-east',
    'asia',
    'oceania'
  ];

  private constructor() {
    super();
  }

  static getInstance(): RegionService {
    if (!RegionService.instance) {
      RegionService.instance = new RegionService();
    }
    return RegionService.instance;
  }

  async getUserRegion(): Promise<string> {
    try {
      const ip = await this.getUserIP();
      const geo = geoip.lookup(ip);
      
      if (!geo) return this.DEFAULT_REGION;
      
      return this.mapLocationToRegion(geo.country, geo.region);
    } catch (error) {
      console.error('Error getting user region:', error);
      return this.DEFAULT_REGION;
    }
  }

  private async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      throw error;
    }
  }

  private mapLocationToRegion(country: string, region: string): string {
    // Map country and region codes to our defined regions
    if (['US', 'CA'].includes(country)) {
      if (['CA', 'OR', 'WA', 'NV', 'ID', 'MT', 'WY', 'UT', 'AZ', 'AK', 'HI'].includes(region)) {
        return 'na-west';
      }
      return 'na-east';
    }

    if (['GB', 'FR', 'ES', 'PT', 'IE', 'IS'].includes(country)) {
      return 'eu-west';
    }

    if (['DE', 'PL', 'CZ', 'AT', 'CH', 'IT'].includes(country)) {
      return 'eu-east';
    }

    if (['JP', 'KR', 'CN', 'TW', 'HK', 'SG', 'IN'].includes(country)) {
      return 'asia';
    }

    if (['AU', 'NZ'].includes(country)) {
      return 'oceania';
    }

    return this.DEFAULT_REGION;
  }

  getRegions(): string[] {
    return this.REGIONS;
  }

  calculatePing(region: string): Promise<number> {
    return new Promise((resolve) => {
      const start = Date.now();
      // Simulate ping test
      setTimeout(() => {
        const ping = Date.now() - start;
        resolve(ping);
      }, Math.random() * 100);
    });
  }

  async getBestRegion(): Promise<string> {
    const pings = await Promise.all(
      this.REGIONS.map(async (region) => ({
        region,
        ping: await this.calculatePing(region)
      }))
    );

    return pings.reduce((best, current) => 
      current.ping < best.ping ? current : best
    ).region;
  }
}