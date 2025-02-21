import time
import bcrypt
import random
import string
from pymongo import MongoClient
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from bs4 import BeautifulSoup as BS

# MongoDB Connection
client = MongoClient("mongodb+srv://admin:admin@cluster.udlln.mongodb.net/")
db = client["test"]
service_collection = db["services"]
provider_collection = db["providers"]
user_collection = db["users"]

# Selenium WebDriver Setup
options = webdriver.EdgeOptions()
options.add_argument("--headless")
driver = webdriver.Edge(service=Service(EdgeChromiumDriverManager().install()), options=options)

def scroll_down():
    """Scroll down to load all lazy-loaded elements."""
    last_height = driver.execute_script("return document.body.scrollHeight")
    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height

def generate_random_string(length=8):
    """Generate a random alphanumeric string for login and temp password."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def hash_password(password):
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt)

def get_more_info(link):
    """Scrape additional details from item page."""
    try:
        driver.get(link)
        el_link = BS(driver.page_source, 'html.parser')

        desc = el_link.select_one("div.css-1m8mzwg > div")
        pub_date = el_link.select_one("span > span.css-pz2ytp")
        owner_element = el_link.select_one("div.css-18icqaw > div > a")
        owner_name = el_link.select_one("div.css-1fp4ipz > h4")
        loc = el_link.select_one("div.css-o2jhck > img")
        owner_about = el_link.select_one("div > span.css-17rju9v")

        owner_link = f'https://www.olx.kz{owner_element["href"]}' if owner_element and 'list/user' in owner_element["href"] else None
        owner_contact = "None"

        # Try to fetch contact number
        try:
            button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.css-10t2p5d"))
            )
            driver.execute_script("arguments[0].scrollIntoView();", button)
            time.sleep(1)
            button.click()
            phone_element = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "a[data-testid='contact-phone']"))
            )
            owner_contact = phone_element.text
        except:
            pass  # No phone number found

        return (
            desc.text if desc else None,
            pub_date.text if pub_date else None,
            owner_link,
            owner_name.text if owner_name else None,
            loc["alt"] if loc else None,
            owner_about.text if owner_about else None,
            owner_contact
        )
    except Exception as e:
        print(f"Error fetching more info: {e}")
        return None

page = 1
while True:
    url = f'https://www.olx.kz/prokat-tovarov/elektronika/playstation/?page={page}'
    print(f"Scraping page {page}...")

    driver.get(url)
    scroll_down()  # Ensure all items are loaded
    time.sleep(2)  # Allow time for remaining elements to load

    html = BS(driver.page_source, 'html.parser')
    items = html.select("div.css-j0t2x2 > div.css-l9drzq")

    if not items:
        print("No more items found, stopping.")
        break  # Exit when no items found

    for el in items:
        id_element = el.get("id")
        img_element = el.select_one("img")
        link_element = el.select_one("a")
        name_element = el.select_one("h4")

        id = id_element if id_element else None
        link = f'https://www.olx.kz{link_element["href"]}' if link_element else None
        name = name_element.text if name_element else None

        # Wait for images to load before processing
        try:
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "img"))
            )
        except:
            print(f"Images did not load for item ID: {id}")

        # Extract image source safely
        img = None
        if img_element:
            img = img_element.get("src") or img_element.get("data-src") or img_element.get("data-original")

        # Skip entries missing critical information
        if not all([id, link, name]):
            print(f"Skipping incomplete entry (ID: {id})")
            continue

        # Skip if service ID already exists
        existing_service = service_collection.find_one({"id": id})
        if existing_service:
            print(f"Skipping duplicate service (ID: {id})")
            continue

        # Fetch additional details
        more_info = get_more_info(link)
        if not more_info:
            print(f"Skipping entry due to failed detail retrieval (ID: {id})")
            continue

        desc, pub_date, owner_link, owner_name, loc, owner_about, owner_contact = more_info

        # Skip if essential details are missing
        if not all([desc, pub_date, owner_link, owner_name]):
            print(f"Skipping entry due to missing details (ID: {id})")
            continue

        # Insert service data (Only if new)
        service_collection.insert_one({
            "id": id,
            "img": img,
            "link": link,
            "desc": desc,
            "pub_date": pub_date,
            "loc": loc
        })
        print(f"Inserted service ID: {id}")

        # Insert or update provider data
        provider_doc = provider_collection.find_one({"owner_link": owner_link})
        provider_id = None

        if provider_doc:
            provider_id = provider_doc["_id"]
            provider_collection.update_one(
                {"_id": provider_id},
                {"$addToSet": {"services": id}}
            )
            print(f"Updated provider {owner_name} with new service ID: {id}")
        else:
            provider_id = provider_collection.insert_one({
                "owner_link": owner_link,
                "owner_name": owner_name,
                "owner_about": owner_about,
                "owner_contact": owner_contact,
                "services": [id]
            }).inserted_id
            print(f"Inserted new provider: {owner_name}")

        # Create user login and hashed password if the provider is new
        if not user_collection.find_one({"_id": provider_id}):
            temp_password = generate_random_string(10)
            hashed_password = hash_password(temp_password)

            user_collection.insert_one({
                "_id": provider_id,
                "login": generate_random_string(8),
                "temp_password": temp_password,
                "hashed_password": hashed_password.decode(),
                "role": "provider"  # Added provider role
            })
            print(f"Created user for provider {owner_name} with temp password.")

    page += 1  # Move to the next page

driver.quit()
print("Data successfully stored in MongoDB.")
