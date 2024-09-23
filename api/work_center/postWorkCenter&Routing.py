import requests
import json
import base64

USERNAME = "Username"
PASSWORD = "Password"
HOST = "a20z.ucc.ovgu.de"

WORK_CENTRE_URL = f"http://{HOST}/sap/opu/odata/sap/API_WORK_CENTERS/A_WorkCenters"
ROUTING_URL = f"http://{HOST}/sap/opu/odata/sap/API_PRODUCTION_ROUTING/ProductionRoutingSequence(ProductionRoutingGroup='50000002',ProductionRouting='1',ProductionRoutingSequence='0',ProductionRoutingSqncIntVers='1')/to_Operation"

def fetch_csrf_token_and_cookie(url):
    headers = {
        "Authorization": "Basic " + base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode(),
        "x-csrf-token": "Fetch"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    csrf_token = response.headers.get("x-csrf-token")
    cookies = response.headers.get("Set-Cookie")
    return csrf_token, cookies

def create_work_center(csrf_token, cookies):
    headers = {
        "Authorization": "Basic " + base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode(),
        "x-csrf-token": csrf_token,
        "Cookie": cookies,
        "Content-Type": "application/json"
    }
    payload = {
        "WorkCenterTypeCode": "A",
        "WorkCenter": "workCenterName",
        "Plant": "HH00",
        "StandardWorkFormulaParamGroup": "SAP1",
        "WorkCenterUsage": "009",
        "WorkCenterResponsible": "000",
        "WorkCenterCategoryCode": "0001",
        "to_WorkCenterDescription": [
            {
                "WorkCenterTypeCode": "A",
                "Language": "EN",
                "WorkCenterDesc": "Description"
            }
        ]
    }
    response = requests.post(WORK_CENTRE_URL, headers=headers, json=payload)
    if response.status_code == requests.codes.created:
        print("Work Center created successfully.")
    else:
        print(f"Failed to create Work Center, response code: {response.status_code}")

def create_routing(csrf_token, cookies):
    headers = {
        "Authorization": "Basic " + base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode(),
        "x-csrf-token": csrf_token,
        "Cookie": cookies,
        "Content-Type": "application/json"
    }
    payload = {
        "ProductionRoutingGroup": "50000002",
        "ProductionRouting": "1",
        "ProductionRoutingSequence": "0",
        "ProductionRoutingOpIntID": "1",
        "ProductionRoutingOpIntVersion": "1",
        "OperationUnit": "EA",
        "OpQtyToBaseQtyNmrtr": "10",
        "OpQtyToBaseQtyDnmntr": "1",
        "OperationReferenceQuantity": "1",
        "OperationText": "operationText",
        "Plant": "HH00",
        "OperationControlProfile": "PP01",
        "WorkCenterTypeCode": "A",
        "WorkCenterInternalID": "workCenterInternalID"
    }
    response = requests.post(ROUTING_URL, headers=headers, json=payload)
    if response.status_code == requests.codes.created:
        print("Routing created successfully.")
    else:
        print(f"Failed to create Routing, response code: {response.status_code}")

def main():
    try:
        # Step 1: Fetch CSRF token and cookies for Work Center
        work_center_csrf_token, work_center_cookies = fetch_csrf_token_and_cookie(WORK_CENTRE_URL)

        # Step 2: Create Work Center
        create_work_center(work_center_csrf_token, work_center_cookies)

        # Step 3: Fetch CSRF token and cookies for Routing
        routing_csrf_token, routing_cookies = fetch_csrf_token_and_cookie(ROUTING_URL)

        # Step 4: Create Routing Sequence
        create_routing(routing_csrf_token, routing_cookies)

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
    except Exception as err:
        print(f"Error occurred: {err}")

if __name__ == "__main__":
    main()
