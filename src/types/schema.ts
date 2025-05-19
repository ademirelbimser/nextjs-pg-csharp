export interface PostgresColumnType {
  column_name: string;
  data_type: string;
  character_maximum_length: number | null;
  is_nullable: string;
  column_default: string | null;
  udt_name: string;
}

export interface TableSchema {
  success: boolean;
  tableName: string;
  columns: PostgresColumnType[];
  primaryKeys: string[];
  error?: string;
}

export interface GeneratedCode {
  entity: string;
  interface: string;
  repository: string;
  commands: string;
  queries: string;
  handlers: string;
}

export interface ConnectionResult {
  success: boolean;
  timestamp?: string;
  error?: string;
}
