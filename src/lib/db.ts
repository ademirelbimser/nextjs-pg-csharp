import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new pool using the connection string from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return { success: true, timestamp: result.rows[0].now };
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Function to get table schema
export async function getTableSchema(tableName: string) {
  try {
    const client = await pool.connect();
    
    // Query to get column information
    const columnQuery = `
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default,
        udt_name
      FROM 
        information_schema.columns
      WHERE 
        table_name = $1
        and table_schema = $2
      ORDER BY 
        ordinal_position;
    `;
    
    // Query to get primary key information
    const pkQuery = `
      SELECT 
        c.column_name
      FROM 
        information_schema.table_constraints tc
      JOIN 
        information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
      JOIN 
        information_schema.columns AS c ON c.table_schema = tc.constraint_schema
        AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1 and tc.table_schema= $2;
    `;
    const ttable:string = tableName.includes('.') ? tableName.split('.')[1] : tableName;
    const tschema:string = tableName.includes('.') ? tableName.split('.')[0] : 'public';
    // Execute queries
    //throw new Error("sql:" + columnQuery + " \nTableName:" + ttable + "\nSchemaName" + tschema);
    const columnResult = await client.query(columnQuery, [ttable, tschema]);
    const pkResult = await client.query(pkQuery, [ttable, tschema]);
    
    client.release();
    
    // Process results
    const columns = columnResult.rows;
    const primaryKeys = pkResult.rows.map(row => row.column_name);
    
    return {
      success: true,
      tableName,
      columns,
      primaryKeys
    };
  } catch (error) {
    console.error('Error fetching table schema:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Export the pool for direct use
export default pool;
