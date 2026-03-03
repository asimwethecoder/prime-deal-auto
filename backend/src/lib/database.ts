import { Pool, PoolConfig } from 'pg';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

interface DbSecret {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

// Cache secret to avoid repeated Secrets Manager calls
let cachedSecret: DbSecret | null = null;

// Pool initialized outside handler for connection reuse across warm invocations
let pool: Pool | null = null;

async function getSecret(): Promise<DbSecret> {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secretArn = process.env.SECRET_ARN;
  if (!secretArn) {
    throw new Error('SECRET_ARN environment variable is not set');
  }

  try {
    const client = new SecretsManagerClient({});
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );

    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    cachedSecret = JSON.parse(response.SecretString);
    return cachedSecret!;
  } catch (error) {
    console.error('Secrets Manager error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      secretArn,
    });
    throw new Error('Failed to retrieve database credentials');
  }
}

export async function getPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  try {
    const secret = await getSecret();

    const config: PoolConfig = {
      host: process.env.DB_HOST, // RDS Proxy endpoint
      port: 5432,
      database: process.env.DB_NAME || 'primedealauto',
      user: secret.username,
      password: secret.password,
      max: 1, // RDS Proxy handles server-side pooling
      ssl: { rejectUnauthorized: true },
      keepAlive: true,
      connectionTimeoutMillis: 5000,
    };

    pool = new Pool(config);

    // Test connection on first use
    await pool.query('SELECT 1');

    return pool;
  } catch (error) {
    console.error('Database connection error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      host: process.env.DB_HOST,
    });
    throw new Error('Database connection failed');
  }
}
