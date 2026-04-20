const redis = require('ioredis');
const r = new redis('redis://default:Redis2024SecurePassNoSlash@root-redis-1:6379');

r.ping().then(x => {
    console.log('Redis connected:', x);
    r.quit();
    process.exit(0);
}).catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});