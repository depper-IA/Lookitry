/**
 * Diagnostic script to check if the admin blog API works
 * Simulates what the frontend does
 */

const API_BASE = 'https://api.lookitry.com';

async function testWithRealAdminToken() {
  console.log('========================================');
  console.log('ADMIN BLOG API DIAGNOSTIC');
  console.log('========================================\n');
  
  // First, let's try to login as admin to get a real token
  console.log('Step 1: Trying to get admin token via login...');
  
  try {
    // Try to login - you'll need to provide credentials
    // For now, just test the endpoints
    console.log('Note: This script tests the API endpoints.');
    console.log('To get a real admin token, you need to be logged in.\n');
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test endpoints
  console.log('\n=== Testing /api/blog/settings ===');
  const settingsRes = await fetch(`${API_BASE}/api/blog/settings`, {
    method: 'GET',
    credentials: 'include' // This will send cookies
  });
  console.log('Status:', settingsRes.status);
  const settingsData = await settingsRes.json().catch(() => null);
  console.log('Response:', JSON.stringify(settingsData, null, 2));
  
  console.log('\n=== Testing /api/blog/admin ===');
  const adminRes = await fetch(`${API_BASE}/api/blog/admin`, {
    method: 'GET',
    credentials: 'include'
  });
  console.log('Status:', adminRes.status);
  const adminData = await adminRes.json().catch(() => null);
  console.log('Response:', JSON.stringify(adminData, null, 2));
  
  console.log('\n========================================');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('========================================');
  
  // Check if blog_settings has the required fields
  console.log('\n=== Checking blog_settings structure ===');
  
  // Based on the blogSettings controller, it expects these fields:
  // frequency, is_enabled, next_run, last_run, webhook_url, webhook_secret
  // openrouter_article_model, openrouter_image_model, image_generation_provider
  // image_generator_webhook, cta_templates
}

testWithRealAdminToken().catch(console.error);