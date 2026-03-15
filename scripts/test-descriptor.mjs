// Test manual del webhook descriptor
const res = await fetch("https://n8n.wilkiedevs.com/webhook/descriptor", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    product_name: "Camisa Blanca",
    category: "tshirt"
  }),
  signal: AbortSignal.timeout(60000),
});

console.log("Status:", res.status);
const text = await res.text();
console.log("Body:", text || "(vacío)");
