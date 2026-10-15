import test from 'node:test';
import assert from 'node:assert/strict';
import {authorized,protect} from '../lib/studio-auth.mjs';
test('cloud access fails closed and rejects absent, wrong or malformed credentials',()=>{
 const old=process.env.STUDIO_ACCESS_KEY;
 try{delete process.env.STUDIO_ACCESS_KEY;assert.equal(authorized({headers:{}}),false);
 process.env.STUDIO_ACCESS_KEY='short';assert.equal(authorized({headers:{authorization:'Bearer short'}}),false);
 process.env.STUDIO_ACCESS_KEY='test-key-'.repeat(8);
 for(const authorization of ['', 'Bearer wrong', 'Basic '+process.env.STUDIO_ACCESS_KEY])assert.equal(authorized({headers:{authorization}}),false);
 assert.equal(authorized({headers:{authorization:'Bearer '+process.env.STUDIO_ACCESS_KEY}}),true);
 let status,cache;const res={setHeader(k,v){cache=v},status(n){status=n;return this},json(){}};
 assert.equal(protect({headers:{}},res),false);assert.equal(status,401);assert.equal(cache,'no-store');
 }finally{if(old===undefined)delete process.env.STUDIO_ACCESS_KEY;else process.env.STUDIO_ACCESS_KEY=old;}
});
