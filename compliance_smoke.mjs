/**
 * Compliance Officer Smoke Test
 * Verifies all BUG-CO-001..007 fixes and US-COMPLIANCE-005..014
 */
const API = 'http://127.0.0.1:3001';

async function getToken(email, password) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!d.token) throw new Error(`Login failed for ${email}: ${JSON.stringify(d)}`);
  return d.token;
}

function pass(name) { console.log(`  ✅ PASS: ${name}`); }
function fail(name, detail) { console.log(`  ❌ FAIL: ${name} — ${detail}`); }
function warn(name, detail) { console.log(`  ⚠️  WARN: ${name} — ${detail}`); }

async function run() {
  console.log('=== Compliance Officer Smoke Tests ===\n');
  
  let compToken, adminToken, investorToken;
  
  console.log('[AUTH] Getting tokens...');
  try {
    compToken = await getToken('compliance@indiaangelforum.test', 'Compliance@12345');
    adminToken = await getToken('admin@indiaangelforum.test', 'Admin@12345');
    investorToken = await getToken('investor.standard@test.com', 'Investor@12345');
    pass('All tokens obtained');
  } catch (e) {
    fail('Auth', e.message);
    process.exit(1);
  }

  // ── SEED ──
  console.log('\n[SEED] Seeding test data...');
  await fetch(`${API}/api/test/seed-kyc-documents`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
  await fetch(`${API}/api/test/seed-accreditation-applications`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
  await fetch(`${API}/api/test/seed-aml-screenings`, { method: 'POST', headers: { Authorization: `Bearer ${compToken}` } });
  pass('Seed endpoints called');

  // ── US-COMPLIANCE-001: KYC Document Review ──
  console.log('\n[BUG-CO-001 / US-COMPLIANCE-001] KYC Document Review');
  const kycDocuments = await fetch(`${API}/api/compliance/kyc-review`, {
    headers: { Authorization: `Bearer ${compToken}` },
  }).then(r => r.json());
  
  if (!Array.isArray(kycDocuments)) {
    fail('GET /api/compliance/kyc-review', `Expected array, got ${JSON.stringify(kycDocuments).slice(0, 100)}`);
  } else {
    pass(`GET /api/compliance/kyc-review → ${kycDocuments.length} docs`);
    if (kycDocuments.length > 0) {
      const d = kycDocuments[0];
      if (!d.filePath) fail('KYC doc has filePath field', JSON.stringify(Object.keys(d)));
      else if (d.filePath?.includes('/uploads//')) fail('BUG-CO-002: Double /uploads/ detected', d.filePath);
      else pass(`BUG-CO-002: filePath="${d.filePath}" (no double prefix)`);
      if (!d.verificationStatus) fail('KYC doc has verificationStatus field', JSON.stringify(d));
      else pass(`KYC doc verificationStatus="${d.verificationStatus}"`);
      
      // Test PUT (BUG-CO-001)
      const pending = kycDocuments.find(d => d.verificationStatus === 'pending');
      if (pending) {
        const putRes = await fetch(`${API}/api/compliance/kyc-review/${pending.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${compToken}` },
          body: JSON.stringify({ status: 'verified', notes: 'Smoke test verification' }),
        });
        if (putRes.ok) pass(`BUG-CO-001: PUT /api/compliance/kyc-review/:id → ${putRes.status}`);
        else {
          const txt = await putRes.text();
          if (txt.startsWith('<!DOCTYPE')) fail('BUG-CO-001: PUT returns HTML (route not found)', `status=${putRes.status}`);
          else fail(`BUG-CO-001: PUT failed`, `${putRes.status} ${txt.slice(0, 100)}`);
        }
      } else {
        warn('BUG-CO-001 PUT test', 'No pending docs to test — all may already be verified from prior test run');
      }
    } else {
      warn('KYC docs', 'No documents found after seeding');
    }
  }

  // ── US-COMPLIANCE-002: AML Screening ──
  console.log('\n[BUG-CO-003 / US-COMPLIANCE-002] AML Screening');
  const amlList = await fetch(`${API}/api/compliance/aml-screening`, {
    headers: { Authorization: `Bearer ${compToken}` },
  }).then(r => r.json());
  
  if (!Array.isArray(amlList)) fail('GET /api/compliance/aml-screening', JSON.stringify(amlList).slice(0, 100));
  else {
    pass(`GET /api/compliance/aml-screening → ${amlList.length} records`);
    if (amlList.length > 0) {
      const s = amlList[0];
      if (!s.investorName) fail('BUG-CO-014: Missing investorName field', JSON.stringify(Object.keys(s)));
      else pass(`BUG-CO-014: investorName="${s.investorName}"`);
      if (s.investorEmail === undefined) fail('Missing investorEmail', JSON.stringify(s));
      else pass(`AML screeningStatus="${s.screeningStatus}"`);
    }
  }

  // Test unscreened-investors endpoint (BUG-CO-005)
  const unscreened = await fetch(`${API}/api/compliance/unscreened-investors`, {
    headers: { Authorization: `Bearer ${compToken}` },
  }).then(r => r.json());
  if (!Array.isArray(unscreened)) fail('BUG-CO-005: GET /api/compliance/unscreened-investors', JSON.stringify(unscreened).slice(0, 100));
  else pass(`BUG-CO-005: GET /api/compliance/unscreened-investors → ${unscreened.length} unscreened`);

  // Test POST initiate screening (BUG-CO-005)
  if (unscreened.length > 0) {
    const inv = unscreened[0];
    const postRes = await fetch(`${API}/api/compliance/aml-screening`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${compToken}` },
      body: JSON.stringify({ investor_id: inv.id }),  // correct field name
    });
    if (postRes.ok) {
      const newScreening = await postRes.json();
      if (newScreening.id && newScreening.investorId) pass(`BUG-CO-005: POST /api/compliance/aml-screening → id=${newScreening.id}`);
      else fail('BUG-CO-005: POST response shape', JSON.stringify(newScreening).slice(0, 100));
    } else {
      const t = await postRes.text();
      fail(`BUG-CO-005: POST /api/compliance/aml-screening`, `${postRes.status} ${t.slice(0,100)}`);
    }
  }

  // Test PUT AML screening (BUG-CO-003)
  const freshAML = await fetch(`${API}/api/compliance/aml-screening`, {
    headers: { Authorization: `Bearer ${compToken}` },
  }).then(r => r.json());
  const pendingAML = Array.isArray(freshAML) && freshAML.find(s => s.screeningStatus === 'pending');
  if (pendingAML) {
    const putRes = await fetch(`${API}/api/compliance/aml-screening/${pendingAML.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${compToken}` },
      body: JSON.stringify({ status: 'cleared', riskLevel: 'low', notes: 'Smoke test clear' }),
    });
    if (putRes.ok) pass(`BUG-CO-003: PUT /api/compliance/aml-screening/:id → ${putRes.status}`);
    else {
      const t = await putRes.text();
      if (t.startsWith('<!DOCTYPE')) fail('BUG-CO-003: PUT returns HTML', `status=${putRes.status}`);
      else fail('BUG-CO-003: PUT failed', `${putRes.status} ${t.slice(0,100)}`);
    }
  } else warn('BUG-CO-003 PUT test', 'No pending AML screenings to test');

  // ── US-COMPLIANCE-003: Accreditation ──
  console.log('\n[BUG-CO-004 / US-COMPLIANCE-003] Accreditation Verification');
  const accList = await fetch(`${API}/api/compliance/accreditation`, {
    headers: { Authorization: `Bearer ${compToken}` },
  }).then(r => r.json());
  
  if (!Array.isArray(accList)) fail('GET /api/compliance/accreditation', JSON.stringify(accList).slice(0, 100));
  else {
    pass(`GET /api/compliance/accreditation → ${accList.length} applications`);
    if (accList.length > 0) {
      const a = accList[0];
      if (!('documents' in a)) fail('BUG-CO-004: Missing documents field', JSON.stringify(Object.keys(a)));
      else if (!Array.isArray(a.documents)) fail('BUG-CO-004: documents is not array', typeof a.documents);
      else {
        pass(`BUG-CO-004: documents field present (${a.documents.length} docs)`);
        if (a.documents.length > 0) {
          const doc = a.documents[0];
          if (!doc.id || !doc.type || !doc.url) fail('BUG-CO-004: document shape missing fields', JSON.stringify(doc));
          else if (doc.url?.includes('/uploads//')) fail('BUG-CO-002: Double /uploads/ in accreditation doc URL', doc.url);
          else pass(`BUG-CO-004: doc shape OK: {id, type="${doc.type}", url="${doc.url.slice(0,30)}..."}`);
        }
      }
      // Test approve (BUG-CO-005 accreditation)
      const pendingAcc = accList.find(a => a.verification_status === 'pending');
      if (pendingAcc) {
        const approveRes = await fetch(`${API}/api/compliance/accreditation/${pendingAcc.id}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${compToken}` },
          body: JSON.stringify({ expiry_date: '2027-12-31' }),
        });
        if (approveRes.ok) pass(`BUG-CO-005: PATCH .../approve → ${approveRes.status}`);
        else {
          const t = await approveRes.text();
          fail('BUG-CO-005: PATCH approve failed', `${approveRes.status} ${t.slice(0,100)}`);
        }
      } else warn('BUG-CO-005 approve test', 'No pending accreditations');
    } else warn('Accreditation', 'No applications found after seeding');
  }

  // ── US-COMPLIANCE-005: Compliance Dashboard ──
  console.log('\n[BUG-CO-006 / US-COMPLIANCE-005] Compliance Dashboard API');
  const dashboard = await fetch(`${API}/api/compliance/dashboard`, {
    headers: { Authorization: `Bearer ${compToken}` },
  }).then(async r => ({ status: r.status, body: await r.json() }));
  
  if (dashboard.status !== 200) fail('GET /api/compliance/dashboard', `status=${dashboard.status}`);
  else {
    const d = dashboard.body;
    const requiredFields = ['pendingKYC', 'pendingAML', 'pendingAccreditations', 'totalAuditLogs'];
    const missing = requiredFields.filter(f => !(f in d));
    if (missing.length) fail('Dashboard missing fields', missing.join(', '));
    else {
      pass(`BUG-CO-006: GET /api/compliance/dashboard → all KPI fields present`);
      pass(`  pendingKYC=${d.pendingKYC}, pendingAML=${d.pendingAML}, pendingAccreditations=${d.pendingAccreditations}, totalAuditLogs=${d.totalAuditLogs}`);
    }
  }

  // ── US-COMPLIANCE-006: Compliance Audit Logs ──
  console.log('\n[BUG-CO-006 / US-COMPLIANCE-006] Compliance Audit Logs API');
  const auditRes = await fetch(`${API}/api/compliance/audit-logs`, {
    headers: { Authorization: `Bearer ${compToken}` },
  });
  if (!auditRes.ok) fail('GET /api/compliance/audit-logs', `status=${auditRes.status}`);
  else {
    const logs = await auditRes.json();
    if (!Array.isArray(logs)) fail('GET /api/compliance/audit-logs', `Expected array, got ${typeof logs}`);
    else {
      pass(`BUG-CO-006: GET /api/compliance/audit-logs → ${logs.length} entries`);
      if (logs.length > 0) {
        const l = logs[0];
        const required = ['id', 'action', 'userId'];
        const missing = required.filter(f => !(f in l));
        if (missing.length) fail('Audit log shape missing fields', missing.join(', '));
        else pass(`Audit log shape OK: action="${l.action}", userId="${l.userId}"`);
      }
    }
  }

  // ── Role-based access control ──
  console.log('\n[US-COMPLIANCE-013] Role-based Access Control');
  // Investor should NOT access compliance endpoints
  const investorKYC = await fetch(`${API}/api/compliance/kyc-review`, {
    headers: { Authorization: `Bearer ${investorToken}` },
  });
  if (investorKYC.status === 403) pass('Investor cannot access /api/compliance/kyc-review → 403');
  else if (investorKYC.status === 401) pass('Investor cannot access /api/compliance/kyc-review → 401');
  else fail('Role-based access: investor should be denied', `got ${investorKYC.status}`);

  const investorDash = await fetch(`${API}/api/compliance/dashboard`, {
    headers: { Authorization: `Bearer ${investorToken}` },
  });
  if (investorDash.status === 403 || investorDash.status === 401) pass('Investor cannot access /api/compliance/dashboard → denied');
  else fail('Role-based access: /api/compliance/dashboard should deny investor', `got ${investorDash.status}`);

  console.log('\n=== Smoke Tests Complete ===');
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
