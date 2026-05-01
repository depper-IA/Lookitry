/**
 * CRM Lead Import Script
 * 
 * Reads BASE_CLIENTES_CRM.xlsx, classifies leads by fashion niche,
 * and generates filtered CSV for import to Supabase.
 * 
 * Usage:
 *   npx ts-node src/scripts/crm-filter/import-crm-leads.ts
 *   npx ts-node src/scripts/crm-filter/import-crm-leads.ts --dry-run
 *   npx ts-node src/scripts/crm-filter/import-crm-leads.ts --stats-only
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface CRMLead {
  ID: number;
  NOMBRE_EMPRESA: string;
  NOMBRE_MARCA: string;
  NOMBRE_CONTACTO: string;
  EMAIL: string;
  TELEFONO: string;
  NICHO: string;
  CIUDAD: string;
  DIRECCION: string;
  REDES_SOCIALES: string;
  SITIO_WEB: string;
  CAMPAñA_ENVIADA: string;
  FECHA_CAMPAñA: string;
  ESTADO_LEAD: string;
  ULTIMO_CONTACTO: string;
  NOTAS: string;
  FUENTE: string;
}

interface ClassificationResult {
  lead: CRMLead;
  isFashion: boolean | null;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

// Keywords for fashion/ moda industry
const FASHION_KEYWORDS = [
  // Español
  'ropa', 'boutique', 'moda', 'fashion', 'zapato', 'calzado', 'dress', 'clothes',
  'apparel', 'accesorios', 'jewelry', 'joyeria', 'reloj', 'tienda ropa',
  'sport', 'deportivo', 'lenceria', 'ropa intima', 'calzon', 'shoes',
  'footwear', 'bag', 'bolso', 'visor', 'optic', 'eyewear', 'perfume',
  'cosmetico', 'beauty', 'cosmetic', 'skin', 'peluqueria', 'salon belleza',
  'barber', 'barbershop', 'nail', 'manicure', 'pedicure', 'estetica',
  'pijama', 'sweater', 'camisa', 'pantalon', 'jean', 'camiseta', 'morral',
  'cartera', 'billetera', 'tenis', 'sandal', 'accessories', 'wear',
  'outfit', 'style', 'trend', 'coleccion', 'temporada', 'moda', 'textil',
  'hilos', 'telas', 'costura', 'sastrería', 'traje', 'formal', 'elegante',
  'urbano', 'casual', 'juvenil', 'infantil', 'bebe', 'maternal', 'premama',
  'ropa deportiva', 'gimnasia', 'yoga', 'fitness', 'atletismo', 'running',
  'zapatilla', 'sneaker', 'baleta', 'sandalia', 'bota', 'botin', 'zapato',
  'plataforma', 'tacón', 'tenis', 'mocasín', 'panoleta', 'pañol',
  'gorra', 'sombrero', 'cachucha', 'beanie', 'cap', 'visor', 'lentes',
  'gafas', 'armazón', 'montura', 'contacto', 'lentes de sol', 'sunglasses',
  'collar', 'arete', 'pulcera', 'argolla', 'anillo', 'piercing', 'cadena',
  'bolso', 'cartera', 'morral', 'mochila', 'backpack', 'bolsillo', 'wallet',
  'billetera', 'porta tarjetas', 'cosmetiquera', 'neceser', 'makeup',
  'maquillaje', 'labial', 'rimel', 'base', 'polvo', 'iluminador', 'blush',
  'perfume', 'fragancias', 'colonya', 'desodorante', 'locion', 'crema',
  'shampoo', 'acondicionador', 'tratamiento', 'mascarilla', 'tinte', 'color',
  'corte', 'peinado', 'alisado', 'permanente', 'rayos', 'keratina',
  'uñas', 'esculpidas', 'gel', 'acrilico', 'fibra', 'manicure', 'pedicure',
  // English
  'clothing', 'store', 'shop', 'retail', 'designer', 'brand', 'luxury',
  'premium', 'vintage', 'secondhand', 'thrift', 'resale', 'online boutique',
  'fashion brand', 'fashion store', 'apparel brand', 'garment', 'fabric',
  'textile', 'embroidery', 'knit', 'weave', 'cotton', 'silk', 'wool',
  'leather', 'fur', 'suede', 'denim', 'jeanswear', 'activewear', 'loungewear',
  'swimwear', 'underwear', 'lingerie', 'hosiery', 'sock', 'glove', 'mitten',
  'scarf', 'shawl', 'wrap', 'stole', 'tie', 'bow tie', 'cufflink', 'lapel',
  'button', 'zipper', 'hook', 'snap', 'elastic', 'ribbon', 'lace', 'trim',
  'bead', 'sequin', 'rhinestone', 'gem', 'stone', 'pearl', 'crystal',
  'silver', 'gold', 'platinum', 'rose gold', 'brass', 'bronze', 'copper',
  'metal', 'wood', 'bone', 'horn', 'coral', 'amber', 'jade', 'turquoise',
];

// Keywords that indicate NO fashion relevance
const NO_FASHION_KEYWORDS = [
  // Español
  'supermercado', 'bar', 'restaurant', 'cafe', 'dentista', 'constructor',
  'peluqueria', 'gimnasio', 'gym', 'farmacia', 'hotel', 'casa', 'inmueble',
  'vehiculo', 'auto', 'mueble', 'cocina', 'electro', 'tecnologia',
  'computador', 'celular', 'lacteos', 'alimentos', 'bebida', 'banco',
  'finca', 'agricola', 'ganadero', 'veterinaria', 'mascota', 'jugueteria',
  'papeleria', 'oficina', 'suministro', 'industrial', 'lubricadora',
  'mecanica', 'taller', 'gasolinera', 'estacion', 'discoteca', 'cantina',
  'cerveza', 'licor', 'taberna', 'cerrajeria', 'herreria', 'plomeria',
  'electricidad', 'pintura', 'limpieza', 'seguridad', 'alarmas', 'cámaras',
  'transporte', 'logistica', 'envios', 'courier', 'mensajeria', 'taxi',
  'uber', 'remis', 'flete', 'mudanza', 'bodega', 'almacen', 'deposito',
  'ferreteria', 'herramienta', 'materiales', 'cemento', 'arena', 'ladrillo',
  'piedra', 'madera', 'piso', 'techo', 'pared', 'ventana', 'puerta',
  'baño', 'sanitario', 'inodoro', 'lavabo', 'ducha', 'tina', 'grifo',
  'cocina', 'estufa', 'horno', 'microondas', 'refrigerador', 'congelador',
  'lavadora', 'secadora', ' aspiradora', 'plancha', 'ventilador', 'aire',
  'calefaccion', 'refrigeracion', 'hvac', 'climatizacion', 'cerveceria',
  'destileria', 'vinicola', 'viñedo', 'vino', 'whisky', 'ron', 'vodka',
  'tequila', 'pisco', 'brandy', 'coñac', 'champagne', 'espumante', 'cerveza',
  'bebida energetica', 'gaseosa', 'jugo', 'agua', 'leche', 'yogur',
  'queso', 'mantequilla', 'crema', 'huevo', 'carne', 'pollo', 'pescado',
  'fruta', 'verdura', 'legumbre', 'cereal', 'harina', 'azucar', 'sal',
  'aceite', 'vinagre', 'especia', 'condimento', 'aderezo', 'salsa',
  'comida', 'alimento', 'nutricion', 'dietetica', 'natural', 'organico',
  'veterinaria', 'animal', 'mascota', 'perro', 'gato', 'ave', 'pez',
  'roedor', 'reptil', 'acuario', 'pet shop', 'tienda mascotas',
  // English
  'supermarket', 'grocery', 'grocery store', 'market', 'convenience',
  'pharmacy', 'drugstore', 'hospital', 'clinic', 'doctor', 'medical',
  'dental', 'dentist', 'optical', 'lawyer', 'attorney', 'legal', 'accountant',
  'accounting', 'bank', 'finance', 'insurance', 'real estate', 'property',
  'rental', 'hotel', 'hostel', 'motel', 'airbnb', 'travel', 'tourism',
  'restaurant', 'cafe', 'coffee shop', 'bakery', 'pizzeria', 'fast food',
  'bar', 'pub', 'nightclub', 'disco', 'club', 'entertainment', 'cinema',
  'theater', 'museum', 'gallery', 'concert', 'festival', 'event',
  'gym', 'fitness center', 'health club', 'sports club', 'pool', 'spa',
  'salon', 'barbershop', 'beauty salon', 'nail salon', 'tattoo', 'piercing',
  'car', 'auto', 'vehicle', 'motorcycle', 'bike', 'bicycle', 'gas station',
  'mechanic', 'repair', 'workshop', 'construction', 'builder', 'contractor',
  'plumber', 'electrician', 'painter', 'cleaning', 'security', 'alarm',
  'cctv', 'camera', 'transport', 'logistics', 'shipping', 'delivery',
  'courier', 'messenger', 'taxi', 'uber', 'lyft', 'freight', 'trucking',
  'warehouse', 'storage', 'depot', 'hardware', 'tools', 'equipment',
  'furniture', 'appliance', 'electronics', 'technology', 'computer', 'phone',
  'software', 'it', 'internet', 'web', 'hosting', 'domain', 'marketing',
  'advertising', 'agency', 'consulting', 'coaching', 'training', 'course',
  'school', 'university', 'college', 'education', 'learning', 'tutoring',
  'bookstore', 'library', 'publishing', 'printing', 'office supplies',
  'stationery', 'paper', 'ink', 'printer', 'scanner', 'copy', 'fax',
];

function classifyLead(lead: CRMLead): ClassificationResult {
  const searchText = `${lead.NOMBRE_EMPRESA} ${lead.NOMBRE_MARCA} ${lead.NICHO} ${lead.NOTAS}`.toLowerCase();
  
  // Check NO_FASHION keywords first (rejection)
  for (const keyword of NO_FASHION_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        lead,
        isFashion: false,
        reason: `Rechazado: keyword no-fashion detectada "${keyword}"`,
        confidence: 'high',
      };
    }
  }
  
  // Check FASHION keywords (acceptance)
  for (const keyword of FASHION_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        lead,
        isFashion: true,
        reason: `Aceptado: keyword fashion detectada "${keyword}"`,
        confidence: 'high',
      };
    }
  }
  
  // Check for website presence - if has website and sells products, might be fashion
  if (lead.SITIO_WEB && lead.SITIO_WEB.trim() !== '') {
    // Has website but no clear keywords - needs verification
    return {
      lead,
      isFashion: null,
      reason: 'Sin keyword clara - requiere verificacion web',
      confidence: 'low',
    };
  }
  
  // No website and no clear keywords - reject
  return {
    lead,
    isFashion: false,
    reason: 'Sin website y sin keywords fashion - descartado',
    confidence: 'medium',
  };
}

function detectCountry(city: string): string {
  if (!city) return 'UNKNOWN';
  
  const cityLower = city.toLowerCase();
  
  // Colombia
  const colombianCities = ['bogota', 'bogotá', 'medellin', 'medellín', 'cali', 'barranquilla', 'cartagena', 'bucaramanga', 'pereira', 'manizales', 'ibague', ' Armenia', 'neiva', 'santa marta', 'villavicencio', 'pasto', 'cartago', 'tunja', 'florencia', 'popayan', 'valledupar', 'monteria', 'sincelejo', 'new york', 'los angeles', 'miami', 'orlando', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'fort worth', 'columbus', 'indianapolis', 'charlotte', 'detroit', 'el paso', 'memphis', 'seattle', 'denver', 'boston', 'nashville', 'baltimore', 'louisville', 'portland', 'las vegas', 'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'kansas city', 'mesa', 'atlanta', 'omaha', 'colorado springs', 'raleigh', 'virginia beach', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans'];
  if (colombianCities.some(c => cityLower.includes(c))) return 'CO';
  
  // USA
  const usaCities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'fort worth', 'columbus', 'indianapolis', 'charlotte', 'detroit', 'el paso', 'memphis', 'seattle', 'denver', 'boston', 'nashville', 'baltimore', 'louisville', 'portland', 'las vegas', 'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'kansas city', 'mesa', 'atlanta', 'omaha', 'colorado springs', 'raleigh', 'virginia beach', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans'];
  if (usaCities.some(c => cityLower.includes(c))) return 'US';
  
  // España
  const spainCities = ['madrid', 'barcelona', 'valencia', 'seville', 'sevilla', 'bilbao', 'malaga', 'murcia', 'cadiz', 'palma', 'vigo', 'granada', 'tenerife', 'alicante', 'cordoba', 'valladolid', 'gijon', 'l hospitalet', 'vitoria', 'gran canaria'];
  if (spainCities.some(c => cityLower.includes(c))) return 'ES';
  
  return 'UNKNOWN';
}

interface ImportStats {
  total: number;
  accepted: number;
  rejected: number;
  needsVerification: number;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  noEmail: number;
  noWebsite: number;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const statsOnly = args.includes('--stats-only');
  
  console.log('âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ');
  console.log('           CRM LEAD FILTER - LOOKITRY IMPORTER v1.0           ');
  console.log('âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ\n');
  
  // Read Excel file
  const excelPath = path.resolve(process.cwd(), 'BASE_CLIENTES_CRM.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error(`â Excel file not found: ${excelPath}`);
    process.exit(1);
  }
  
  console.log(`ð Reading Excel file: ${excelPath}`);
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: CRMLead[] = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`â Loaded ${rawData.length} records from Excel\n`);
  
  // Classify all leads
  const stats: ImportStats = {
    total: rawData.length,
    accepted: 0,
    rejected: 0,
    needsVerification: 0,
    byCountry: {},
    byCity: {},
    noEmail: 0,
    noWebsite: 0,
  };
  
  const classified: ClassificationResult[] = [];
  
  for (const lead of rawData) {
    const result = classifyLead(lead);
    classified.push(result);
    
    // Update stats
    if (result.isFashion === true) {
      stats.accepted++;
    } else if (result.isFashion === false) {
      stats.rejected++;
    } else {
      stats.needsVerification++;
    }
    
    // Country stats
    const country = detectCountry(lead.CIUDAD);
    stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
    
    // City stats
    if (lead.CIUDAD) {
      stats.byCity[lead.CIUDAD] = (stats.byCity[lead.CIUDAD] || 0) + 1;
    }
    
    // Missing data stats
    if (!lead.EMAIL || lead.EMAIL.trim() === '') {
      stats.noEmail++;
    }
    if (!lead.SITIO_WEB || lead.SITIO_WEB.trim() === '') {
      stats.noWebsite++;
    }
  }
  
  // Print statistics
  console.log('ð CLASSIFICATION STATISTICS');
  console.log('———————————————————————————————â');
  console.log(`   Total Records:          ${stats.total.toLocaleString()}`);
  console.log(`   â Accepted (Fashion):   ${stats.accepted.toLocaleString()} (${(stats.accepted / stats.total * 100).toFixed(1)}%)`);
  console.log(`   â Rejected (No-Fashion):${stats.rejected.toLocaleString()} (${(stats.rejected / stats.total * 100).toFixed(1)}%)`);
  console.log(`   â ï¸  Needs Verification:   ${stats.needsVerification.toLocaleString()} (${(stats.needsVerification / stats.total * 100).toFixed(1)}%)`);
  console.log('');
  console.log('ð BY COUNTRY:');
  for (const [country, count] of Object.entries(stats.byCountry).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${country}: ${count.toLocaleString()} (${(count / stats.total * 100).toFixed(1)}%)`);
  }
  console.log('');
  console.log('â ï¸  DATA QUALITY:');
  console.log(`   Missing Email:  ${stats.noEmail}`);
  console.log(`   Missing Website: ${stats.noWebsite}`);
  
  if (statsOnly) {
    console.log('\nâ Stats-only mode. Exiting.\n');
    return;
  }
  
  // Separate leads by classification
  const acceptedLeads = classified.filter(r => r.isFashion === true);
  const verificationLeads = classified.filter(r => r.isFashion === null);
  const rejectedLeads = classified.filter(r => r.isFashion === false);
  
  // Show top cities for accepted leads
  console.log('\nðï¸  TOP CITIES (Accepted Leads):');
  const acceptedCities: Record<string, number> = {};
  for (const result of acceptedLeads) {
    const city = result.lead.CIUDAD || 'UNKNOWN';
    acceptedCities[city] = (acceptedCities[city] || 0) + 1;
  }
  const topCities = Object.entries(acceptedCities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [city, count] of topCities) {
    console.log(`   ${city}: ${count}`);
  }
  
  // Generate CSV for accepted leads
  const outputDir = path.join(process.cwd(), 'backend', 'src', 'scripts', 'crm-filter', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // CSV for accepted leads (ready to import)
  const acceptedCsvPath = path.join(outputDir, `accepted-leads-${timestamp}.csv`);
  const acceptedCsvData = acceptedLeads.map(r => ({
    name: r.lead.NOMBRE_CONTACTO || r.lead.NOMBRE_MARCA || r.lead.NOMBRE_EMPRESA,
    business_type: r.lead.NICHO || 'fashion',
    email: r.lead.EMAIL || '',
    phone: r.lead.TELEFONO || '',
    website: r.lead.SITIO_WEB || '',
    city: r.lead.CIUDAD || '',
    country: detectCountry(r.lead.CIUDAD),
    source: 'crm_import',
    source_id: `crm_${r.lead.ID}`,
    status: 'new',
    notes: r.lead.NOTAS || '',
    internal_notes: `Clasificado: ${r.reason}`,
    is_fashion_relevant: true,
    enrichment_source: 'keyword_classification',
    website_verified: false,
    business_type_confirmed: r.lead.NICHO || 'fashion',
  }));
  
  // CSV for leads needing verification
  const verificationCsvPath = path.join(outputDir, `verification-needed-${timestamp}.csv`);
  const verificationCsvData = verificationLeads.map(r => ({
    name: r.lead.NOMBRE_CONTACTO || r.lead.NOMBRE_MARCA || r.lead.NOMBRE_EMPRESA,
    business_type: r.lead.NICHO || 'unknown',
    email: r.lead.EMAIL || '',
    phone: r.lead.TELEFONO || '',
    website: r.lead.SITIO_WEB || '',
    city: r.lead.CIUDAD || '',
    country: detectCountry(r.lead.CIUDAD),
    source: 'crm_import',
    source_id: `crm_${r.lead.ID}`,
    status: 'new',
    notes: r.lead.NOTAS || '',
    internal_notes: `Clasificado: ${r.reason}`,
    is_fashion_relevant: null,
    enrichment_source: 'pending_verification',
    website_verified: false,
    business_type_confirmed: null,
  }));
  
  // Full classification log
  const fullLogPath = path.join(outputDir, `full-classification-log-${timestamp}.csv`);
  const fullLogData = classified.map(r => ({
    id: r.lead.ID,
    nombre_empresa: r.lead.NOMBRE_EMPRESA,
    nombre_marca: r.lead.NOMBRE_MARCA,
    nicho: r.lead.NICHO,
    ciudad: r.lead.CIUDAD,
    email: r.lead.EMAIL,
    website: r.lead.SITIO_WEB,
    is_fashion: r.isFashion,
    reason: r.reason,
    confidence: r.confidence,
  }));
  
  if (!dryRun) {
    // Write CSV files
    XLSX.utils.sheet_to_csv;
    const acceptedWs = XLSX.utils.json_to_sheet(acceptedCsvData);
    const verificationWs = XLSX.utils.json_to_sheet(verificationCsvData);
    const fullLogWs = XLSX.utils.json_to_sheet(fullLogData);
    
    const acceptedWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(acceptedWb, acceptedWs, 'Accepted');
    XLSX.writeFile(acceptedWb, acceptedCsvPath);
    
    const verificationWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(verificationWb, verificationWs, 'Needs Verification');
    XLSX.writeFile(verificationWb, verificationCsvPath);
    
    const fullLogWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(fullLogWb, fullLogWs, 'Full Log');
    XLSX.writeFile(fullLogWb, fullLogPath);
    
    console.log('\nâ OUTPUT FILES GENERATED:');
    console.log(`   ð Accepted leads:    ${acceptedCsvData.length} records â ${acceptedCsvPath}`);
    console.log(`   ð Needs verification: ${verificationCsvData.length} records â ${verificationCsvPath}`);
    console.log(`   ð Full classification log â ${fullLogPath}`);
  } else {
    console.log('\nâ ï¸  DRY RUN MODE - No files written');
  }
  
  console.log('\nâââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ\n');
  
  // Return data for further processing
  return {
    accepted: acceptedCsvData,
    verification: verificationCsvData,
    stats,
  };
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main, classifyLead, detectCountry, type ClassificationResult, type ImportStats };
