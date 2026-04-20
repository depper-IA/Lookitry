"""
Script para verificar imágenes del dashboard de Lookitry.
Captura errores de consola y URLs de imágenes que fallan.
"""
from playwright.sync_api import sync_playwright
import json

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1440, 'height': 900},
            extra_http_headers={
                'Accept-Language': 'es-ES,es;q=0.9',
            }
        )
        page = context.new_page()

        # Capturar logs de consola
        console_errors = []
        failed_images = []

        def handle_console(msg):
            if msg.type == 'error':
                console_errors.append({
                    'text': msg.text,
                    'location': msg.location,
                })
                print(f"[CONSOLE ERROR] {msg.text}")

        def handle_response(response):
            if response.status >= 400:
                print(f"[FAILED REQUEST] {response.status} - {response.url}")
                if 'image' in response.headers.get('content-type', ''):
                    failed_images.append({
                        'url': response.url,
                        'status': response.status,
                    })

        page.on('console', handle_console)
        page.on('response', handle_response)

        # 1. Probar dashboard principal
        print("\n=== Probando dashboard ===")
        page.goto('https://lookitry.com/dashboard', wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(3000)

        # Capturar todas las imágenes y sus estados
        images = page.evaluate('''() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs.map(img => ({
                src: img.src,
                naturalWidth: img.naturalWidth,
                complete: img.complete,
                currentSrc: img.currentSrc,
            }));
        }''')

        print(f"\nImágenes encontradas: {len(images)}")
        for img in images[:20]:  # Limitar a 20 para no saturar
            status = "OK" if img['complete'] and img['naturalWidth'] > 0 else "FAILED"
            print(f"  [{status}] {img['src'][:100]}...")

        # 2. Ir a productos
        print("\n=== Navegando a productos ===")
        page.goto('https://lookitry.com/dashboard/products', wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(3000)

        # Capturar errores específicos de imágenes rotas
        broken_images = page.evaluate('''() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
                .filter(img => !img.complete || img.naturalWidth === 0 || img.src.includes('vkdooutklowctuudjnkl'))
                .map(img => ({
                    src: img.src,
                    broken: !img.complete || img.naturalWidth === 0,
                    hasSupabase: img.src.includes('vkdooutklowctuudjnkl'),
                }));
        }''')

        if broken_images:
            print(f"\n⚠️ Imágenes rotas o con Supabase: {len(broken_images)}")
            for img in broken_images:
                print(f"  - {img['src'][:120]}")
                if img['hasSupabase']:
                    print(f"    ↑ USA Supabase DIRECTO (debería usar MinIO)")

        print("\n=== Resumen ===")
        print(f"Errores de consola: {len(console_errors)}")
        print(f"Imágenes rotas: {len(broken_images)}")

        # Guardar reporte
        report = {
            'console_errors': console_errors,
            'broken_images': broken_images,
            'all_images': images[:30],
        }
        with open('/tmp/image_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        print("\nReporte guardado en /tmp/image_report.json")

        browser.close()

if __name__ == '__main__':
    main()