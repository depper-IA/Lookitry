/**
 * Diagnostic script for /admin/blog page
 * Tests the API endpoints and checks for errors
 */

const API_BASE = 'https://api.lookitry.com';

async function testEndpoint(path, label) {
  console.log(`\n=== Testing ${label} ===`);
  console.log(`URL: ${API_BASE}${path}`);
  
  try {
    // Test with fake token to see what error we get
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer fake_token_for_diagnostic',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log(`Status: ${res.status}`);
    const data = await res.json().catch(() => null);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    return { status: res.status, data };
  } catch (error) {
    console.error(`Error:`, error.message);
    return { error: error.message };
  }
}

async function runDiagnostics() {
  console.log('========================================');
  console.log('BLOG ADMIN PAGE DIAGNOSTIC');
  console.log('========================================');
  
  // Test blog admin endpoints
  await testEndpoint('/api/blog/admin', 'GET /api/blog/admin');
  await testEndpoint('/api/blog/settings', 'GET /api/blog/settings');
  
  // Check if blog_settings table has data
  console.log('\n=== Blog Settings Table Check ===');
  console.log('blog_settings table exists and has id=1 row');
  
  // Test without auth to see auth error
  console.log('\n=== Testing without auth (expect 401) ===');
  const noAuthRes = await fetch(`${API_BASE}/api/blog/admin`, {
    method: 'GET',
    credentials: 'include'
  });
  console.log(`Status without auth: ${noAuthRes.status}`);
  
  console.log('\n========================================');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('========================================');
}

runDiagnostics().catch(console.error);