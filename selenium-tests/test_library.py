from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import sys

BASE_URL = "http://localhost:3000"

def get_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    return driver

def test_homepage_loads():
    """Test 1: Verify homepage (login page) loads correctly"""
    print("Test 1: Verify homepage loads...")
    driver = get_driver()
    try:
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, 10)
        heading = wait.until(EC.presence_of_element_located((By.TAG_NAME, "h2")))
        assert "Welcome" in heading.text, f"Expected 'Welcome' in heading, got: {heading.text}"
        
        username_field = driver.find_element(By.ID, "username")
        password_field = driver.find_element(By.ID, "password")
        assert username_field is not None, "Username field not found"
        assert password_field is not None, "Password field not found"
        
        print("  PASSED: Homepage loads with login form")
        return True
    except Exception as e:
        print(f"  FAILED: {e}")
        return False
    finally:
        driver.quit()

def test_invalid_login():
    """Test 2: Validate login with invalid credentials shows error"""
    print("Test 2: Validate invalid login behavior...")
    driver = get_driver()
    try:
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        username_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
        password_field = driver.find_element(By.ID, "password")
        
        username_field.send_keys("wronguser")
        password_field.send_keys("wrongpass")
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        time.sleep(2)
        msg = driver.find_element(By.ID, "msg")
        assert "hidden" not in msg.get_attribute("class"), "Error message should be visible"
        
        print("  PASSED: Invalid login shows error message")
        return True
    except Exception as e:
        print(f"  FAILED: {e}")
        return False
    finally:
        driver.quit()

def test_valid_login_redirect():
    """Test 3: Validate login with valid credentials redirects to admin page"""
    print("Test 3: Validate valid login redirects correctly...")
    driver = get_driver()
    try:
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        username_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
        password_field = driver.find_element(By.ID, "password")
        
        username_field.send_keys("admin")
        password_field.send_keys("admin123")
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        wait.until(EC.url_contains("admin.html"))
        assert "admin.html" in driver.current_url, f"Expected admin.html in URL, got: {driver.current_url}"
        
        print("  PASSED: Valid admin login redirects to admin page")
        return True
    except Exception as e:
        print(f"  FAILED: {e}")
        return False
    finally:
        driver.quit()

def test_user_login_redirect():
    """Test 4: Validate user login redirects to user page"""
    print("Test 4: Validate user login redirects to user page...")
    driver = get_driver()
    try:
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        username_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
        password_field = driver.find_element(By.ID, "password")
        
        username_field.send_keys("user1")
        password_field.send_keys("user123")
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        wait.until(EC.url_contains("user.html"))
        assert "user.html" in driver.current_url, f"Expected user.html in URL, got: {driver.current_url}"
        
        print("  PASSED: Valid user login redirects to user page")
        return True
    except Exception as e:
        print(f"  FAILED: {e}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    print("=" * 50)
    print("Library Management System - Selenium Tests")
    print("=" * 50)
    print()
    
    results = []
    results.append(test_homepage_loads())
    results.append(test_invalid_login())
    results.append(test_valid_login_redirect())
    results.append(test_user_login_redirect())
    
    print()
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 50)
    
    if passed < total:
        sys.exit(1)
