import { NextResponse } from 'next/server';
import { getTableSchema } from '@/lib/db';
import { 
  generateEntityClass, 
  generateRepositoryInterface, 
  generateRepositoryImplementation,
  generateCommands,
  generateQueries,
  generateHandlers
} from '@/lib/csharpGenerator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableName } = body;
    const { namespace } = body;
    const { ignoreLastSChar } = body;

    if (!tableName) {
      return NextResponse.json({ message: 'Table name is required' }, { status: 400 });
    }
    if (!namespace) {
      return NextResponse.json({ message: 'Namespace is required' }, { status: 400 });
    }
    
    // Get table schema
    const schema = await getTableSchema(tableName);

    if (!schema.success) {
      return NextResponse.json({ message: schema.error || 'Failed to get table schema' }, { status: 400 });
    }
    
    let puretableName = schema.tableName || tableName;
    // Check if the table name ends with 's' and ignore it if specified
    if (ignoreLastSChar) {
      puretableName = puretableName.slice(0, -1);
    }
    //return NextResponse.json({ message: puretableName}, { status: 400 });


    // Generate C# code
    const entityCode = generateEntityClass(puretableName, schema.columns!, schema.primaryKeys!, namespace);
    const interfaceCode = generateRepositoryInterface(puretableName!, schema.columns!, schema.primaryKeys!, namespace);
    const repositoryCode = generateRepositoryImplementation(puretableName, schema.columns!, schema.primaryKeys!, namespace);
    const commandsCode = generateCommands(puretableName, schema.columns!, schema.primaryKeys!, namespace);
    const queriesCode = generateQueries(puretableName, schema.columns!, schema.primaryKeys!, namespace);
    const handlersCode = generateHandlers(puretableName, schema.columns!, schema.primaryKeys!, namespace);

    // Return generated code
    return NextResponse.json({
      schema,
      generatedCode: {
        entity: entityCode,
        interface: interfaceCode,
        repository: repositoryCode,
        commands: commandsCode,
        queries: queriesCode,
        handlers: handlersCode
      }
    });
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}