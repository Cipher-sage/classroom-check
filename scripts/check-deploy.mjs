import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('../wrangler.json',import.meta.url),'utf8'));
if(!config.account_id || !config.d1_databases?.[0]?.database_id || config.d1_databases[0].database_id==='00000000-0000-4000-8000-000000000000')throw Error('Configure your Cloudflare account and real D1 database ID in wrangler.json before publishing.');
console.log('Deployment target: '+config.name+' (your Cloudflare account).');
