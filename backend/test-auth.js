const { GoogleAuth } = require('google-auth-library');
async function run() {
  try {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    console.log('Project:', projectId);
  } catch (e) {
    console.error(e);
  }
}
run();