import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app

# We will try to run the test client, which will trigger the startup event
with TestClient(app) as client:
    print("Starting auth tests...")

    # 1. Register a new user
    import uuid
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "password123"
    
    print(f"Registering user with email {test_email}...")
    response = client.post("/api/auth/register", json={
        "email": test_email,
        "password": test_password,
        "name": "Test User",
        "role": "buyer"
    })
    print(f"Register Response: {response.status_code}")
    print(response.json())
    assert response.status_code == 201
    
    # 2. Login
    print(f"Logging in with email {test_email}...")
    response = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    print(f"Login Response: {response.status_code}")
    print(response.json())
    assert response.status_code == 200
    
    token = response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Get profile
    print("Getting user profile (/api/auth/me)...")
    response = client.get("/api/auth/me", headers=headers)
    print(f"Get Profile Response: {response.status_code}")
    print(response.json())
    assert response.status_code == 200
    
    # 4. Update profile
    print("Updating user profile (/api/auth/profile)...")
    response = client.put("/api/auth/profile", json={
        "name": "Updated Test User"
    }, headers=headers)
    print(f"Update Profile Response: {response.status_code}")
    print(response.json())
    assert response.status_code == 200
    
    # 5. Delete account
    print("Deleting account (/api/auth/account)...")
    response = client.delete("/api/auth/account", headers=headers)
    print(f"Delete Account Response: {response.status_code}")
    print(response.json())
    assert response.status_code == 200
    
    print("\nAll authentication tests passed successfully!")
