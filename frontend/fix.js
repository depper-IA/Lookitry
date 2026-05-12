const fs = require('fs');
const path = 'src/app/admin/marketing/promotions/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const original = `  const loadPromos = useCallback(async () => {
    const res = await fetch(\`\${API_URL}/api/admin/promotions\`, { credentials: 'include' });
    if (res.ok) { const d = await res.json(); setPromos(d.data ?? []); }
  }, []);

  const loadCoupons = useCallback(async () => {
    const res = await fetch(\`\${API_URL}/api/admin/coupons\`, { credentials: 'include' });
    if (res.ok) { const d = await res.json(); setCoupons(d.data ?? []); }
  }, []);`;

const replacement = `  const loadPromos = useCallback(async () => {
    try {
      const res = await fetch(\`\${API_URL}/api/admin/promotions\`, { credentials: 'include' });
      if (res.ok) { 
        const d = await res.json(); 
        setPromos(d.data ?? []); 
      } else {
        const text = await res.text();
        setError(\`Error cargando promociones: \${res.status} - \${text}\`);
      }
    } catch (e: any) {
      setError(\`Error de red: \${e.message}\`);
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    try {
      const res = await fetch(\`\${API_URL}/api/admin/coupons\`, { credentials: 'include' });
      if (res.ok) { 
        const d = await res.json(); 
        setCoupons(d.data ?? []); 
      } else {
        const text = await res.text();
        setError(\`Error cargando cupones: \${res.status} - \${text}\`);
      }
    } catch (e: any) {
      setError(\`Error de red: \${e.message}\`);
    }
  }, []);`;

if (content.includes(original)) {
    content = content.replace(original, replacement);
    fs.writeFileSync(path, content);
    console.log("Success");
} else {
    console.log("Original content not found");
}
