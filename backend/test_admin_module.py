import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def request(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return {"error": e.code, "body": err_body}

def main():
    print("=== Testing Module 6: Super Admin Module ===")
    
    # 1. Login as Super Admin
    login_res = request("POST", "/auth/login", {"email": "admin@homeservice.com", "password": "Admin@123"})
    assert "data" in login_res and "access_token" in login_res["data"], f"Login failed: {login_res}"
    token = login_res["data"]["access_token"]
    print("1. Admin Login: SUCCESS")

    # 2. Get Platform Metrics
    metrics_res = request("GET", "/admin/metrics", token=token)
    assert metrics_res.get("success"), f"Metrics failed: {metrics_res}"
    print("2. Platform Metrics: SUCCESS ->", json.dumps(metrics_res["data"], indent=2))

    # 3. Revenue Trend
    trend_res = request("GET", "/admin/metrics/revenue-trend?days=30", token=token)
    assert trend_res.get("success"), f"Revenue trend failed: {trend_res}"
    print("3. Revenue Trend: SUCCESS ->", len(trend_res["data"]), "data points")

    # 4. List Users
    users_res = request("GET", "/admin/users?page=1&page_size=10", token=token)
    assert users_res.get("success"), f"List users failed: {users_res}"
    print("4. List Users: SUCCESS -> Total users:", users_res["data"]["total"])

    # 5. List Providers KYC
    providers_res = request("GET", "/admin/providers?page=1&page_size=10", token=token)
    assert providers_res.get("success"), f"List providers failed: {providers_res}"
    print("5. List Providers KYC: SUCCESS -> Total providers:", providers_res["data"]["total"])
    if providers_res["data"]["items"]:
        p = providers_res["data"]["items"][0]
        # Approve provider
        verify_res = request("POST", f"/admin/providers/{p['id']}/verify", {"action": "approve"}, token=token)
        assert verify_res.get("success"), f"Approve provider failed: {verify_res}"
        print(f"5b. Verify Provider #{p['id']}: SUCCESS -> status: {verify_res['data']['verification_status']}")

    # 6. List Reviews for Moderation
    reviews_res = request("GET", "/admin/reviews?page=1&page_size=10", token=token)
    assert reviews_res.get("success"), f"List reviews failed: {reviews_res}"
    print("6. List Reviews: SUCCESS -> Total reviews:", reviews_res["data"]["total"])
    if reviews_res["data"]["items"]:
        r = reviews_res["data"]["items"][0]
        mod_res = request("POST", f"/admin/reviews/{r['id']}/moderate", {"action": "approve"}, token=token)
        assert mod_res.get("success"), f"Moderate review failed: {mod_res}"
        print(f"6b. Moderate Review #{r['id']}: SUCCESS -> status: {mod_res['data']['moderation_status']}")

    # 7. List Services & Toggle Active
    services_res = request("GET", "/admin/services?page=1&page_size=10", token=token)
    assert services_res.get("success"), f"List services failed: {services_res}"
    print("7. List Services: SUCCESS -> Total services:", services_res["data"]["total"])
    if services_res["data"]["items"]:
        s = services_res["data"]["items"][0]
        toggle_res = request("PATCH", f"/admin/services/{s['id']}/toggle", {"is_active": not s["is_active"]}, token=token)
        assert toggle_res.get("success"), f"Toggle service failed: {toggle_res}"
        print(f"7b. Toggle Service #{s['id']}: SUCCESS -> is_active: {toggle_res['data']['is_active']}")

    print("\nALL ADMIN ENDPOINTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
