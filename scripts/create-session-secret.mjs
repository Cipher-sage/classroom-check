import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
// Generate and transmit the secret directly; do not write it to disk or print it.
const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','put','SESSION_SECRET','--config','wrangler.json'],{input:randomBytes(48).toString('base64url')+'\n',stdio:['pipe','inherit','inherit']});
if(result.error)throw result.error;
process.exitCode=result.status??1;
