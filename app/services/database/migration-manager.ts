import { ConnectionManager } from './connection-manager';
import { SecureStorageService } from '../secure-storage';

interface Migration {
  id: number;
  name: string;
  sql: string;
}

export class MigrationManager {
  private static instance: MigrationManager;
  private connectionManager: ConnectionManager;
  private secureStorage: SecureStorageService;

  private constructor() {
    this.connectionManager = ConnectionManager.getInstance();
    this.secureStorage = SecureStorageService.getInstance();
  }

  static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  async initializeMigrationTable(): Promise<void> {
    const client = this.connectionManager.getClient();
    
    await client.rpc('create_migrations_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
      `
    });
  }

  async runMigrations(migrations: Migration[]): Promise<void> {
    await this.initializeMigrationTable();
    const client = this.connectionManager.getClient();

    for (const migration of migrations) {
      try {
        // Check if migration has been executed
        const { data: executed } = await client
          .from('migrations')
          .select('id')
          .eq('name', migration.name)
          .single();

        if (executed) continue;

        // Execute migration
        await client.rpc('execute_migration', {
          migration_sql: migration.sql
        });

        // Record migration
        await client
          .from('migrations')
          .insert([{ name: migration.name }]);

      } catch (error) {
        console.error(`Migration failed: ${migration.name}`, error);
        throw error;
      }
    }
  }

  async getCurrentVersion(): Promise<number> {
    const client = this.connectionManager.getClient();
    const { data } = await client
      .from('migrations')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    return data?.id || 0;
  }
}