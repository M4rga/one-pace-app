from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging
import os

# Disabilita i log di Selenium
logging.getLogger('selenium.webdriver.remote.remote_connection').setLevel(logging.WARNING)
logging.getLogger('selenium.webdriver.common.service').setLevel(logging.WARNING)

# Disabilita i messaggi di log di Chromium
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--headless")  # Esegui in modalità headless per evitare finestra visibile
chrome_options.add_argument("--disable-logging")  # Disabilita logging di Chromium
chrome_options.add_argument("--log-level=3")  # Mostra solo errori critici

url_input = input("Insert URL (without #item=...): ")
print("Please wait")    

driver = webdriver.Chrome(options=chrome_options)

# Inizializza item_number al primo valore (ad esempio 0)
item_number = 0
ids = []

# Crea un ciclo che aumenta item_number
while True:
    url = f'{url_input}#item={item_number}'
    driver.get(url)

    current_url = driver.current_url

    # Trova l'elemento video
    elements = driver.find_elements(By.XPATH, "//meta[@property='og:video']")

    # Se trovi un elemento video e l'item_number non è 3, stampa il messaggio
    if elements and url == current_url:
        item_number += 1  # Incrementa item_number per la prossima iterazione
        element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[@id='body']/div/div[3]/div[2]/div/div/video/source"))
        )

        src = element.get_attribute('src')
        file_name = src.split('/')[-1]
        ids.append(file_name)
    else:
        current_directory = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_directory, 'id.txt')

        with open(file_path, 'w') as file:
            file.write(f"In questa saga ci sono {item_number} episodi\n\n")
            for item in ids:
                file.write(f"{item}\n")
            print("file 'id' created successfully")
            break

driver.quit()
