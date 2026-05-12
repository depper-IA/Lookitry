from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Enable console log interception
    console_messages = []
    page.on("console", lambda msg: console_messages.append({
        "type": msg.type,
        "text": msg.text
    }))

    # Capture network failures
    failed_requests = []
    page.on("requestfailed", lambda request: failed_requests.append({
        "url": request.url,
        "failure": request.failure
    }))

    print("=== NAVIGATING TO DASHBOARD ===")
    page.goto('https://lookitry.com/dashboard', wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(3000)

    print("\n=== URL AFTER NAVIGATION ===")
    print(page.url)

    print("\n=== PAGE TITLE ===")
    print(page.title())

    print("\n=== CONSOLE ERRORS (type=error) ===")
    errors = [m for m in console_messages if m['type'] == 'error']
    for e in errors[:10]:
        print(f"  {e['text']}")

    print("\n=== FAILED REQUESTS (first 10) ===")
    for req in failed_requests[:10]:
        print(f"  {req['url']} - {req['failure']}")

    print("\n=== TAKING SCREENSHOT ===")
    page.screenshot(path='C:/Users/Matt/Lookitry/dashboard_inspect.png', full_page=True)
    print("Screenshot saved to dashboard_inspect.png")

    print("\n=== CHECKING LOGO ELEMENT ===")
    logo = page.locator('img[alt="Lookitry"]').first
    if logo.count() > 0:
        print(f"Logo found! Visible: {logo.is_visible()}")
        logo_bounding = logo.bounding_box()
        print(f"Logo bounding box: {logo_bounding}")
    else:
        print("Logo element with alt='Lookitry' not found")

    # Check for any img with src containing logo
    all_logos = page.locator('img').all()
    print(f"\nTotal img elements on page: {len(all_logos)}")
    for img in all_logos[:5]:
        src = img.get_attribute('src')
        alt = img.get_attribute('alt')
        print(f"  src={src}, alt={alt}")

    print("\n=== CLOSING BROWSER ===")
    browser.close()