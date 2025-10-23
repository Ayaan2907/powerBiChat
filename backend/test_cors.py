#!/usr/bin/env python3
"""
Simple script to test CORS configuration for ngrok origins
"""
import requests
import json

def test_cors_preflight():
    """Test CORS preflight request"""
    url = "http://localhost:8000/analyze"
    headers = {
        "Origin": "https://test.ngrok.io",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
    }
    
    print("Testing CORS preflight request...")
    response = requests.options(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("✅ CORS preflight successful!")
    else:
        print("❌ CORS preflight failed!")
    
    return response.status_code == 200

def test_actual_request():
    """Test actual POST request with ngrok origin"""
    url = "http://localhost:8000/analyze"
    headers = {
        "Origin": "https://test.ngrok.io",
        "Content-Type": "application/json"
    }
    data = {
        "question": "Test question",
        "visibleData": "Test data",
        "filters": ""
    }
    
    print("\nTesting actual POST request...")
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ POST request successful!")
            result = response.json()
            print(f"Response: {result}")
        else:
            print("❌ POST request failed!")
            print(f"Error: {response.text}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Request failed with exception: {e}")
        return False

def test_health_endpoint():
    """Test health endpoint"""
    url = "http://localhost:8000/health"
    
    print("\nTesting health endpoint...")
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Health endpoint working!")
            result = response.json()
            print(f"Health status: {result}")
        else:
            print("❌ Health endpoint failed!")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed with exception: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing FastAPI CORS Configuration for ngrok\n")
    
    # Test health first
    health_ok = test_health_endpoint()
    
    if health_ok:
        # Test CORS
        preflight_ok = test_cors_preflight()
        request_ok = test_actual_request()
        
        print(f"\n📊 Test Results:")
        print(f"Health Endpoint: {'✅' if health_ok else '❌'}")
        print(f"CORS Preflight: {'✅' if preflight_ok else '❌'}")
        print(f"POST Request: {'✅' if request_ok else '❌'}")
        
        if preflight_ok and request_ok:
            print("\n🎉 All tests passed! ngrok requests should work now.")
        else:
            print("\n⚠️  Some tests failed. Check the CORS configuration.")
    else:
        print("\n❌ Backend is not responding. Make sure it's running on port 8000.")