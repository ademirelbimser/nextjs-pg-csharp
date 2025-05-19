import { PostgresColumnType } from '../types/schema';

// Map PostgreSQL data types to C# data types
export function mapToCSharpType(pgType: string, isNullable: string): string {
  const typeMap: Record<string, string> = {
    'integer': 'int',
    'bigint': 'long',
    'smallint': 'short',
    'numeric': 'decimal',
    'real': 'float',
    'double precision': 'double',
    'boolean': 'bool',
    'character varying': 'string',
    'varchar': 'string',
    'character': 'string',
    'char': 'string',
    'text': 'string',
    'json': 'string',
    'jsonb': 'string',
    'date': 'DateTime',
    'timestamp': 'DateTime',
    'timestamp with time zone': 'DateTimeOffset',
    'timestamp without time zone': 'DateTime',
    'time': 'TimeSpan',
    'time with time zone': 'DateTimeOffset',
    'time without time zone': 'TimeSpan',
    'uuid': 'Guid',
    'bytea': 'byte[]',
    'bit': 'bool',
    'bit varying': 'BitArray',
    'money': 'decimal',
    'interval': 'TimeSpan',
    'point': 'NpgsqlPoint',
    'line': 'NpgsqlLine',
    'lseg': 'NpgsqlLSeg',
    'box': 'NpgsqlBox',
    'path': 'NpgsqlPath',
    'polygon': 'NpgsqlPolygon',
    'circle': 'NpgsqlCircle',
    'cidr': 'IPNetwork',
    'inet': 'IPAddress',
    'macaddr': 'PhysicalAddress',
    'tsquery': 'NpgsqlTsQuery',
    'tsvector': 'NpgsqlTsVector',
    'xml': 'XmlDocument',
    'array': 'Array',
  };

  // Handle special cases for arrays
  if (pgType.endsWith('[]')) {
    const baseType = pgType.slice(0, -2);
    const csharpBaseType = typeMap[baseType] || 'object';
    return `${csharpBaseType}[]`;
  }

  const csharpType = typeMap[pgType] || 'object';
  return isNullable === 'YES' && csharpType !== 'string' && !csharpType.includes('[]') 
    ? `${csharpType}?` 
    : csharpType;
}

// Generate C# entity class
export function generateEntityClass(tableName: string, columns: PostgresColumnType[], primaryKeys: string[], namespace:string): string {
  
  const className = toPascalCase(tableName.includes('.')==true ? tableName.split('.')[1]: tableName);
  
  let entityCode = `using System;\n\nnamespace ${namespace}.Entities\n{\n`;
  entityCode += `    public class ${className}\n    {\n`;

  // Add properties
  columns.forEach(column => {
    const propertyName = toPascalCase(column.column_name);
    const propertyType = mapToCSharpType(column.data_type, column.is_nullable);
    
    // Add XML documentation
    entityCode += `        /// <summary>\n`;
    entityCode += `        /// ${propertyName} property`;
    
    if (primaryKeys.includes(column.column_name)) {
      entityCode += ` (Primary Key)`;
    }
    
    entityCode += `\n        /// </summary>\n`;
    
    // Add property
    entityCode += `        public ${propertyType} ${propertyName} { get; private set; }\n\n`;
  });
  entityCode += `        private ${className} () { }\n\n`;
  // Add constructor
  entityCode += `        public static ${className} Create (`;
    columns.forEach(column => {
      const propertyName = toPascalCase(column.column_name);
      const propertyType = mapToCSharpType(column.data_type, column.is_nullable);
      entityCode += `${propertyType} ${propertyName.toLowerCase()}, `;
    });
  entityCode = entityCode.slice(0, -2); // Remove last comma
  entityCode += `)\n`;
  entityCode += `        {\n`;
  entityCode += `           return new ${className}\n`;
  entityCode += `           {\n`;
    columns.forEach(column => {
      const propertyName = toPascalCase(column.column_name);
      entityCode += `               ${propertyName} = ${propertyName.toLowerCase()},\n`;
    });
  entityCode += `           };\n`;
  entityCode += `        }\n\n`;
  entityCode += `    }\n}\n`;
  
  return entityCode;
}

// Generate repository interface
export function generateRepositoryInterface(tableName: string, columns: PostgresColumnType[], primaryKeys: string[], namespace : string): string {

  const className = toPascalCase(tableName.includes('.')==true ? tableName.split('.')[1]: tableName);

  const interfaceName = `I${className}Repository`;
  
  // Determine primary key type
  const pkColumn = columns.find(col => primaryKeys.includes(col.column_name));
  const pkType = pkColumn ? mapToCSharpType(pkColumn.data_type, pkColumn.is_nullable) : 'int';
  
  let interfaceCode = `using System;\n`;
  interfaceCode += `using System.Collections.Generic;\n`;
  interfaceCode += `using System.Threading.Tasks;\n`;
  interfaceCode += `using ${namespace}.Entities;\n\n`;
  
  interfaceCode += `namespace ${namespace}.Repositories\n{\n`;
  interfaceCode += `    public interface ${interfaceName}\n    {\n`;
  
  // Add method signatures
  interfaceCode += `        Task<IEnumerable<${className}>> GetAllAsync();\n\n`;
  interfaceCode += `        Task<${className}> GetByIdAsync(${pkType} id);\n\n`;
  interfaceCode += `        Task<int> AddAsync(${className} entity);\n\n`;
  interfaceCode += `        Task<bool> UpdateAsync(${className} entity);\n\n`;
  interfaceCode += `        Task<bool> DeleteAsync(${pkType} id);\n`;
  
  interfaceCode += `    }\n}\n`;
  
  return interfaceCode;
}

// Generate repository implementation with Dapper
export function generateRepositoryImplementation(tableName: string, columns: PostgresColumnType[], primaryKeys: string[], namespace : string): string {
  //const className = toPascalCase(tableName);
  const className = toPascalCase(tableName.includes('.')==true ? tableName.split('.')[1]: tableName);

  const repositoryName = `${className}Repository`;
  const interfaceName = `I${className}Repository`;
  
  // Determine primary key info
  const pkColumn = columns.find(col => primaryKeys.includes(col.column_name));
  const pkName = pkColumn ? pkColumn.column_name : 'id';
  const pkPropertyName = toPascalCase(pkName);
  const pkType = pkColumn ? mapToCSharpType(pkColumn.data_type, pkColumn.is_nullable) : 'int';
  
  let repoCode = `using System;\n`;
  repoCode += `using System.Collections.Generic;\n`;
  repoCode += `using System.Data;\n`;
  repoCode += `using System.Linq;\n`;
  repoCode += `using System.Threading.Tasks;\n`;
  repoCode += `using Dapper;\n`;
  repoCode += `using Microsoft.Extensions.Configuration;\n`;
  repoCode += `using Npgsql;\n`;
  repoCode += `using ${namespace}.Entities;\n\n`;
  
  repoCode += `namespace ${namespace}.Repositories\n{\n`;
  repoCode += `    public class ${repositoryName} : ${interfaceName}\n    {\n`;
  
  // Add connection string field and constructor
  repoCode += `        private IUnitOfWork _unitOfWork;\n\n`;
  repoCode += `        public ${repositoryName}(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;\n\n`;
  
  // Add GetAllAsync method
  repoCode += `        public async Task<IEnumerable<${className}>> GetAllAsync()\n`;
  repoCode += `        {\n`;
  repoCode += `           var query = "SELECT * FROM ${tableName}";\n`;
  repoCode += `           return await _unitOfWork.Connection.QueryAsync<${className}>(query);\n`;
  repoCode += `        }\n\n`;
  
  // Add GetByIdAsync method
  repoCode += `        public async Task<${className}> GetByIdAsync(${pkType} id)\n`;
  repoCode += `        {\n`;
  repoCode += `           var query = "SELECT * FROM ${tableName} WHERE ${pkName} = @Id";\n`;
  repoCode += `           return await _unitOfWork.Connection.QueryFirstOrDefaultAsync<${className}>(query, new { Id = id });\n`;
  repoCode += `        }\n\n`;
  
  // Add AddAsync method
  repoCode += `        public async Task<int> AddAsync(${className} entity)\n`;
  repoCode += `        {\n`;
  // Build insert query
  const columnNames = columns.map(col => col.column_name).join(', ');
  const paramNames = columns.map(col => `@${toPascalCase(col.column_name)}`).join(', ');
  
  repoCode += `            var query = @"INSERT INTO ${tableName} (${columnNames}) \n`;
  repoCode += `               VALUES (${paramNames})`;
  
  // If the primary key is auto-increment, return it
  if (pkColumn && pkColumn.column_default && pkColumn.column_default.includes('nextval')) {
    repoCode += ` RETURNING ${pkName}";\n`;
    repoCode += `          return await _unitOfWork.Connection.ExecuteScalarAsync<int>(query, entity);\n`;
  } else {
    repoCode += `";\n`;
    repoCode += `          await  _unitOfWork.Connection.ExecuteAsync(query, entity);\n`;
    repoCode += `          return 1;\n`;
  }
  
  repoCode += `        }\n\n`;
  
  // Add UpdateAsync method
  repoCode += `        public async Task<bool> UpdateAsync(${className} entity)\n`;
  repoCode += `        {\n`;
  repoCode += `            await _unitOfWork.Connection.OpenAsync();\n`;
  
  // Build update query
  const updateColumns = columns
    .filter(col => !primaryKeys.includes(col.column_name))
    .map(col => `${col.column_name} = @${toPascalCase(col.column_name)}`)
    .join(', ');
  
  repoCode += `            var query = @"UPDATE ${tableName} \n`;
  repoCode += `                SET ${updateColumns} \n`;
  repoCode += `                WHERE ${pkName} = @${pkPropertyName}";\n`;
  repoCode += `              var result = await _unitOfWork.Connection.ExecuteAsync(query, entity);\n`;
  repoCode += `            return result > 0;\n`;
  repoCode += `        }\n\n`;
  
  // Add DeleteAsync method
  repoCode += `        public async Task<bool> DeleteAsync(${pkType} id)\n`;
  repoCode += `        {\n`;
  repoCode += `            var query = "DELETE FROM ${tableName} WHERE ${pkName} = @Id";\n`;
  repoCode += `            var result = await _unitOfWork.Connection.ExecuteAsync(query, new { Id = id });\n`;
  repoCode += `            return result > 0;\n`;
  repoCode += `        }\n`;
  
  repoCode += `    }\n}\n`;
  
  return repoCode;
}

// Generate CQRS Commands
export function generateCommands(tableName: string, columns: PostgresColumnType[], primaryKeys: string[], namespace:string): string {
  //const className = toPascalCase(tableName);
  const className = toPascalCase(tableName.includes('.')==true ? tableName.split('.')[1]: tableName);
  
  // Determine primary key info
  const pkColumn = columns.find(col => primaryKeys.includes(col.column_name));
  const pkType = pkColumn ? mapToCSharpType(pkColumn.data_type, pkColumn.is_nullable) : 'int';
  
  let commandsCode = `using System;\n`;
  commandsCode += `using MediatR;\n`;
  commandsCode += `using ${namespace}.Entities;\n\n`;
  
  commandsCode += `namespace ${namespace}.CQRS.Commands\n{\n`;
  
  // Create command
  commandsCode += `    public class Create${className}Command : IRequest<int>\n`;
  commandsCode += `    {\n`;
  columns.forEach(column => {
    const propertyName = toPascalCase(column.column_name);
    const propertyType = mapToCSharpType(column.data_type, column.is_nullable);
    commandsCode += `        public ${propertyType} ${propertyName} { get; set; }\n`;
  });
  commandsCode += `    }\n\n`;
  
  // Update command
  commandsCode += `    public class Update${className}Command : IRequest<bool>\n`;
  commandsCode += `    {\n`;
  columns.forEach(column => {
    const propertyName = toPascalCase(column.column_name);
    const propertyType = mapToCSharpType(column.data_type, column.is_nullable);
    commandsCode += `        public ${propertyType} ${propertyName} { get; set; }\n`;
  });
  commandsCode += `    }\n\n`;
  
  // Delete command
  commandsCode += `    public class Delete${className}Command : IRequest<bool>\n`;
  commandsCode += `    {\n`;
  commandsCode += `        public ${pkType} Id { get; set; }\n`;
  commandsCode += `    }\n`;
  
  commandsCode += `}\n`;
  
  return commandsCode;
}

// Generate CQRS Queries
export function generateQueries(tableName: string, columns: PostgresColumnType[], primaryKeys: string[], namespace :string ): string {
  const className = toPascalCase(tableName);
  
  // Determine primary key info
  const pkColumn = columns.find(col => primaryKeys.includes(col.column_name));
  const pkType = pkColumn ? mapToCSharpType(pkColumn.data_type, pkColumn.is_nullable) : 'int';
  
  let queriesCode = `using System;\n`;
  queriesCode += `using System.Collections.Generic;\n`;
  queriesCode += `using MediatR;\n`;
  queriesCode += `using ${namespace}.Entities;\n\n`;
  
  queriesCode += `namespace ${namespace}.CQRS.Queries\n{\n`;
  
  // GetAll query
  queriesCode += `    public class GetAll${className}Query : IRequest<IEnumerable<${className}>>\n`;
  queriesCode += `    {\n`;
  queriesCode += `        // No parameters needed for GetAll\n`;
  queriesCode += `    }\n\n`;
  
  // GetById query
  queriesCode += `    public class Get${className}ByIdQuery : IRequest<${className}>\n`;
  queriesCode += `    {\n`;
  queriesCode += `        public ${pkType} Id { get; set; }\n`;
  queriesCode += `    }\n`;
  
  queriesCode += `}\n`;
  
  return queriesCode;
}

// Generate CQRS Handlers
export function generateHandlers(tableName: string, columns: PostgresColumnType[], primaryKeys: string[], namespace : string): string {
  const className = toPascalCase(tableName);
  const repositoryName = `I${className}Repository`;
  
  // Determine primary key info
  //const pkColumn = columns.find(col => primaryKeys.includes(col.column_name));
  //const pkType = pkColumn ? mapToCSharpType(pkColumn.data_type, pkColumn.is_nullable) : 'int';
  
  let handlersCode = `using System;\n`;
  handlersCode += `using System.Collections.Generic;\n`;
  handlersCode += `using System.Threading;\n`;
  handlersCode += `using System.Threading.Tasks;\n`;
  handlersCode += `using MediatR;\n`;
  handlersCode += `using ${namespace}.CQRS.Commands;\n`;
  handlersCode += `using ${namespace}.CQRS.Queries;\n`;
  handlersCode += `using ${namespace}.Entities;\n`;
  handlersCode += `using ${namespace}.Repositories;\n\n`;
  
  handlersCode += `namespace ${namespace}.CQRS.Handlers\n{\n`;
  
  // Command Handlers
  
  // Create handler
  handlersCode += `    public class Create${className}CommandHandler : IRequestHandler<Create${className}Command, int>\n`;
  handlersCode += `    {\n`;
  handlersCode += `        private readonly ${repositoryName} _repository;\n\n`;
  handlersCode += `        public Create${className}CommandHandler(${repositoryName} repository)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            _repository = repository;\n`;
  handlersCode += `        }\n\n`;
  handlersCode += `        public async Task<int> Handle(Create${className}Command request, CancellationToken cancellationToken)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            var entity = new ${className}\n`;
  handlersCode += `            {\n`;
  columns.forEach(column => {
    const propertyName = toPascalCase(column.column_name);
    handlersCode += `                ${propertyName} = request.${propertyName},\n`;
  });
  handlersCode += `            };\n\n`;
  handlersCode += `            return await _repository.AddAsync(entity);\n`;
  handlersCode += `        }\n`;
  handlersCode += `    }\n\n`;
  
  // Update handler
  handlersCode += `    public class Update${className}CommandHandler : IRequestHandler<Update${className}Command, bool>\n`;
  handlersCode += `    {\n`;
  handlersCode += `        private readonly ${repositoryName} _repository;\n\n`;
  handlersCode += `        public Update${className}CommandHandler(${repositoryName} repository)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            _repository = repository;\n`;
  handlersCode += `        }\n\n`;
  handlersCode += `        public async Task<bool> Handle(Update${className}Command request, CancellationToken cancellationToken)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            var entity = new ${className}\n`;
  handlersCode += `            {\n`;
  columns.forEach(column => {
    const propertyName = toPascalCase(column.column_name);
    handlersCode += `                ${propertyName} = request.${propertyName},\n`;
  });
  handlersCode += `            };\n\n`;
  handlersCode += `            return await _repository.UpdateAsync(entity);\n`;
  handlersCode += `        }\n`;
  handlersCode += `    }\n\n`;
  
  // Delete handler
  handlersCode += `    public class Delete${className}CommandHandler : IRequestHandler<Delete${className}Command, bool>\n`;
  handlersCode += `    {\n`;
  handlersCode += `        private readonly ${repositoryName} _repository;\n\n`;
  handlersCode += `        public Delete${className}CommandHandler(${repositoryName} repository)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            _repository = repository;\n`;
  handlersCode += `        }\n\n`;
  handlersCode += `        public async Task<bool> Handle(Delete${className}Command request, CancellationToken cancellationToken)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            return await _repository.DeleteAsync(request.Id);\n`;
  handlersCode += `        }\n`;
  handlersCode += `    }\n\n`;
  
  // Query Handlers
  
  // GetAll handler
  handlersCode += `    public class GetAll${className}QueryHandler : IRequestHandler<GetAll${className}Query, IEnumerable<${className}>>\n`;
  handlersCode += `    {\n`;
  handlersCode += `        private readonly ${repositoryName} _repository;\n\n`;
  handlersCode += `        public GetAll${className}QueryHandler(${repositoryName} repository)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            _repository = repository;\n`;
  handlersCode += `        }\n\n`;
  handlersCode += `        public async Task<IEnumerable<${className}>> Handle(GetAll${className}Query request, CancellationToken cancellationToken)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            return await _repository.GetAllAsync();\n`;
  handlersCode += `        }\n`;
  handlersCode += `    }\n\n`;
  
  // GetById handler
  handlersCode += `    public class Get${className}ByIdQueryHandler : IRequestHandler<Get${className}ByIdQuery, ${className}>\n`;
  handlersCode += `    {\n`;
  handlersCode += `        private readonly ${repositoryName} _repository;\n\n`;
  handlersCode += `        public Get${className}ByIdQueryHandler(${repositoryName} repository)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            _repository = repository;\n`;
  handlersCode += `        }\n\n`;
  handlersCode += `        public async Task<${className}> Handle(Get${className}ByIdQuery request, CancellationToken cancellationToken)\n`;
  handlersCode += `        {\n`;
  handlersCode += `            return await _repository.GetByIdAsync(request.Id);\n`;
  handlersCode += `        }\n`;
  handlersCode += `    }\n`;
  
  handlersCode += `}\n`;
  
  return handlersCode;
}

// Helper function to convert snake_case to PascalCase
export function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
