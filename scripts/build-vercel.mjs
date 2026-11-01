import {mkdirSync, writeFileSync} from 'node:fs';
import worker from '../worker/index.js';

mkdirSync('public', {recursive: true});
const response = await worker.fetch(new Request('https://localhost/'), {});
if (!response.ok) throw new Error('Could not build homepage');
writeFileSync('public/index.html', await response.text());
