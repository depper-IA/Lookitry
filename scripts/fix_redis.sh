#!/bin/bash
sed -i 's|redis://default:zrOKXaFIgXOuu/sEMcVRwAN9mxsdTWU8VY9tuncbHpk=@|redis://default:Redis2024SecurePassNoSlash@|g' /app/.env.production
sed -i 's|REDIS_PASSWORD=zrOKXaFIgXOuu/sEMcVRwAN9mxsdTWU8VY9tuncbHpk=|REDIS_PASSWORD=Redis2024SecurePassNoSlash|g' /app/.env.production
echo "Done"