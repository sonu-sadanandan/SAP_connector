const axios = require('axios');
require('dotenv').config();

// Define the SAP API endpoint and credentials
const host = 'a20z.ucc.ovgu.de';
const endpointUrl = `https://${host}/sap/opu/odata/sap/API_WORK_CENTERS/A_WorkCenters`;
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;

// Define the request body for the POST request
const requestBody = {   
    "WorkCenterInternalID": "10000206",
    "WorkCenterTypeCode": "A",
    "WorkCenter": "WCtest6",
    "Plant": "HH00",
    "StandardWorkFormulaParamGroup": "SAP1",
    "WorkCenterUsage": "009",
    "WorkCenterResponsible": "000",
    "WorkCenterCategoryCode": "0001",
    "to_WorkCenterDescription": [
      {
        "WorkCenterInternalID": "10000206",
        "WorkCenterTypeCode": "A",
        "Language": "EN",
        "WorkCenterDesc": "TEST Work Center Descriptions test 6"
      }
    ]
};

// Function to perform the GET request to obtain the x-csrf-token
async function getCsrfToken() {
    try {
        const response = await axios.get(endpointUrl, {
            auth: {
                username: username,
                password: password
            },
            headers: {
                'x-csrf-token': 'Fetch'
            }
        });
        const csrfToken = response.headers['x-csrf-token'];
        const cookies = response.headers['set-cookie'];

        return { csrfToken, cookies };
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        throw error;
    }
}

// Function to perform the POST request with the obtained x-csrf-token
async function postData() {
    try {
        const {csrfToken, cookies} = await getCsrfToken();
        const response = await axios.post(endpointUrl, requestBody, {
            auth: {
                username: username,
                password: password
            },
            headers: {
                'x-csrf-token': csrfToken,
                'Content-Type': 'application/json',
                'Cookie': cookies
            }
        });
        console.log('POST request successful:', response.data);
    } catch (error) {
        console.error('Error in POST request:', error);
    }
}

// Execute the function to perform the POST request
postData();
