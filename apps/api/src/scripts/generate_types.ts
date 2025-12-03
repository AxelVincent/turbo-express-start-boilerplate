import 'dotenv/config';
import { Command } from 'commander';
import { execSync } from 'child_process';

const program = new Command();

program
  .name('generate-types')
  .description('Generate TypeScript types from database schema using kysely-codegen')
  .option('-o, --out-file <path>', 'Output file path', 'src/db/types.ts')
  .option('--host <host>', 'Database host', process.env.PGHOST || 'localhost')
  .option('--port <port>', 'Database port', process.env.PGPORT || '5432')
  .option('--user <user>', 'Database user', process.env.PGUSER)
  .option('--password <password>', 'Database password', process.env.PGPASSWORD)
  .option('--database <database>', 'Database name', process.env.PGDATABASE)
  .parse(process.argv);

const options = program.opts();

// Validate required options
const requiredOptions = ['user', 'password', 'database'];
const missingOptions = requiredOptions.filter(
  (opt) => !options[opt]
);

if (missingOptions.length > 0) {
  console.error(
    `Error: Missing required options: ${missingOptions.join(', ')}`
  );
  console.error(
    'Provide them via command line flags or environment variables (PGUSER, PGPASSWORD, PGDATABASE)'
  );
  process.exit(1);
}

// Construct connection URL
const url = `postgresql://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`;

try {
  console.log(`Generating types to ${options.outFile}...`);
  execSync(`kysely-codegen --out-file=${options.outFile} --url="${url}"`, {
    stdio: 'inherit',
  });
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Failed to generate types');
  process.exit(1);
}