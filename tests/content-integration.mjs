// Run only against an isolated test database and server. Never use production.
import assert from 'node:assert/strict';
const base = process.env.CONTENT_TEST_URL;
if (!base || !/^http:\/\/(localhost|127\.0\.0\.1):/.test(base)) throw new Error('Set CONTENT_TEST_URL to an isolated localhost test server');
const admin = process.env.CONTENT_TEST_ADMIN;
const automation = process.env.CONTENT_TEST_TOKEN;
if (!admin || !automation) throw new Error('Set test admin and automation credentials');
const prefix = `test-${Date.now()}`;
async function req(path, token, body, status = 200) {
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json(); assert.equal(response.status, status, JSON.stringify(data)); return data;
}
const api='/api/admin/content', bridge='/api/automation/content';
await req(api, null, null, 401);
await req(bridge, admin, null, 401);
await req(api, automation, null, 401);
const sourceData={url:'',text:'Approved source text'};
const privateSource=await req(api,admin,{kind:'source',title:prefix+' private',status:'private',data:sourceData});
const source=await req(api,admin,{kind:'source',title:prefix+' source',status:'approved',data:sourceData});
await req(api,admin,{kind:'source',title:'Bad URL',status:'private',data:{...sourceData,url:'javascript:alert(1)'}},400);
const topic=await req(api,admin,{kind:'topic',title:prefix+' topic',status:'ready',data:{keyword:'planning an app',audience:'Founders',intent:'Guide',rationale:'Relevant to discovery work',brief:'Use the approved source',priority:1,plannedDate:'',targetUrl:''}});
const profileData={audience:'Founders',services:'Apps',positioning:'Partner',instructions:'British English',exclusions:'None',competitors:'https://bookivo.co.uk/ rival note\nhttps://example-competitor.co.uk/agency',cta:'Contact',ctaUrl:''};
let profileRow=(await req(api,admin)).entries.find((e)=>e.kind==='profile');
if(!profileRow) profileRow=await req(api,admin,{kind:'profile',title:'SilentCPO',status:'approved',data:profileData});
else profileRow=await req(api,admin,{id:profileRow.id,version:profileRow.version,kind:'profile',title:profileRow.title,status:'approved',data:{...profileRow.data,...profileData}});
const context=await req(bridge,automation);
assert(context.competitorPlanning.fetchUrls.some((u)=>u.includes('example-competitor.co.uk')));
assert(!context.competitorPlanning.fetchUrls.some((u)=>u.includes('bookivo.co.uk')));
assert(context.competitorPlanning.skipped.some((s)=>s.url.includes('bookivo.co.uk')));
assert(context.sources.some(s=>s.id===source.id));
assert(!context.sources.some(s=>s.id===privateSource.id));
assert(context.topics.some(t=>t.id===topic.id));
const articleData={excerpt:'A practical test article.',body:'## Plan first\n\nA test draft with [a source](https://example.com).\n\n<script>alert(1)</script>',metaTitle:'Test planning guide',metaDescription:'A practical planning guide for founders.',keyword:'planning',sources:'Private editorial notes',topicId:topic.id,sourceIds:[source.id]};
await req(bridge,automation,{requestKey:prefix+' invalid',topicId:topic.id,title:prefix,slug:prefix,data:articleData,status:'published'},400);
await req(bridge,automation,{requestKey:prefix+' private',topicId:topic.id,title:prefix,slug:prefix,data:{...articleData,sourceIds:[privateSource.id]}},409);
const draft={requestKey:prefix,topicId:topic.id,title:prefix,slug:prefix,data:articleData};
const delivery=await req(bridge,automation,draft,201);
const repeated=await req(bridge,automation,draft);
assert.equal(delivery.articleId,repeated.articleId); assert.equal(repeated.replayed,true);
await req(bridge,automation,{...draft,title:'Changed'},409);
await req(bridge,automation,{...draft,requestKey:prefix+' another'},409);
assert.equal((await fetch(base+'/blog/'+prefix)).status,404);
let data=await req(api,admin);
let article=data.entries.find(e=>e.id===delivery.articleId);
assert.equal(article.status,'draft');
assert.equal(data.entries.find(e=>e.id===topic.id).status,'drafted');
assert.equal(data.runs.filter(r=>r.requestKey===prefix).length,1);
const edit={id:article.id,version:article.version,kind:'article',title:article.title,status:'published',slug:article.slug,data:article.data};
await req(api,admin,{...edit,data:{...edit.data,body:''}},400);
article=await req(api,admin,edit);
await req(api,admin,edit,409);
await req(api,admin,{...edit,version:article.version,slug:prefix+'-changed'},400);
const publicResponse=await fetch(base+'/blog/'+prefix); assert.equal(publicResponse.status,200);
const html=await publicResponse.text(); assert(html.includes('&lt;script&gt;')); assert(!html.includes('Private editorial notes'));
assert((await (await fetch(base+'/sitemap.xml')).text()).includes('/blog/'+prefix));
await req(api,admin,{...edit,version:article.version,status:'archived'});
assert.equal((await fetch(base+'/blog/'+prefix)).status,404);
assert(!(await (await fetch(base+'/sitemap.xml')).text()).includes('/blog/'+prefix));
const planKey = prefix + '-topic-plan';
const plan = await req(bridge, automation, {
  requestKey: planKey,
  topics: [{
    title: prefix + ' planned topic',
    status: 'ready',
    data: { keyword: prefix + '-kw', audience: 'Founders', intent: 'Guide', rationale: 'Test plan', brief: 'Brief', priority: 2, plannedDate: '', targetUrl: '' },
  }],
}, 201);
assert(plan.created === 1);
assert.equal(plan.topicIds.length, 1);
const planReplay = await req(bridge, automation, { requestKey: planKey, topics: [{ title: prefix + ' planned topic', status: 'ready', data: { keyword: prefix + '-kw', audience: 'Founders', intent: 'Guide', rationale: 'Test plan', brief: 'Brief', priority: 2, plannedDate: '', targetUrl: '' } }] });
assert.equal(planReplay.replayed, true);
const dupPlan = await req(bridge, automation, { requestKey: planKey, topics: [{ title: prefix + ' other', status: 'ready', data: { keyword: prefix + '-kw', audience: 'Founders', intent: 'Guide', rationale: 'x', brief: 'x', priority: 3, plannedDate: '', targetUrl: '' } }] }, 409);
assert(dupPlan.error);
const context2 = await req(bridge, automation);
assert(context2.existingTopics.some((t) => t.id === plan.topicIds[0]));
console.log('PASS: authentication, source approval, validation, duplicate delivery, topic locking, draft privacy, publish/archive, optimistic updates, stable URLs, safe rendering, sitemap, topic plan.');
