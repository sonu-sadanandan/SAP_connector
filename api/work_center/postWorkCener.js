const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
require('dotenv').config();

const SAP_BASE_URL = process.env.BASE_URL;
const WORK_CENTER = "API_WORK_CENTERS/A_WorkCenterAllCapacity/";
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;
const host = 'a20z.ucc.ovgu.de';
const endpointUrl = `https://${host}/sap/opu/odata/sap/API_WORK_CENTERS/A_WorkCenters`;

const { auth } = require('../../auth/auth');

// Function to get CSRF token
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

// Function to get all work centers
const getAllWorkCenters = async () => {
    const url = `${SAP_BASE_URL}${WORK_CENTER}?$top=20&$inlinecount=allpages&$format=json`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        return response.data.d.results;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
};

// Function to create a new work center
const createWorkCenter = async (insertionData) => {
    try {
        const { csrfToken, cookies } = await getCsrfToken();
        const postResponse = await axios.post(endpointUrl, insertionData, {
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
        return postResponse;
    } catch (error) {
        console.error("Error creating work center:", error.message);
        throw error;
    }
};

// Function to process the CSV file and create work centers
const processCSV = async (filePath) => {
    const existingWorkCenters = await getAllWorkCenters();
    const existingWorkCenterNames = existingWorkCenters.map(wc => wc.WorkCenter);

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (data) => {
            const displayName = data['Display Name'];
            const estimatedTime = data['Estimated time(R)'];
            const depth = data['Depth'];

            if (depth === '2') {
                const workCenterName = "System" + displayName.split("System")[1].trim();
                const workCenterDesc = displayName;

                if (!existingWorkCenterNames.includes(workCenterName)) {
                    const workCenterInternalID = Math.floor(Math.random() * 1000000000).toString();

                    const insertionData = {
                        "WorkCenterInternalID": workCenterInternalID,
                        "WorkCenterTypeCode": "A",
                        "WorkCenter": workCenterName,
                        "Plant": "HH00",
                        "StandardWorkFormulaParamGroup": "SAP1",
                        "WorkCenterUsage": "009",
                        "WorkCenterResponsible": "000",
                        "WorkCenterCategoryCode": "0001",
                        "to_WorkCenterDescription": [
                            {
                                "WorkCenterInternalID": workCenterInternalID,
                                "WorkCenterTypeCode": "A",
                                "Language": "EN",
                                "WorkCenterDesc": workCenterDesc
                            }
                        ]
                    };

                    try {
                        const response = await createWorkCenter(insertionData);
                        console.log(`Work center created: ${response.data.d.WorkCenter}`);
                    } catch (error) {
                        console.error(`Failed to create work center: ${workCenterName}`, error.message);
                    }
                }
            }
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
        })
        .on('error', (error) => {
            console.error('Error reading the CSV file:', error);
        });
};

const csvFilePath = '../../data/bop_example.csv'; 

// Process the CSV file
processCSV(csvFilePath);
