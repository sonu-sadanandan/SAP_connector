const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
require('dotenv').config();
const chokidar = require("chokidar");

const username = process.env.USER_NAME;
const password = process.env.PASSWORD;
const host = process.env.HOST;
const workCenterUrl = `${host}/sap/opu/odata/sap/API_WORK_CENTERS/A_WorkCenters`;
const routingPostUrl = `${host}/sap/opu/odata/sap/API_PRODUCTION_ROUTING/ProductionRoutingSequence(ProductionRoutingGroup='50000002',ProductionRouting='1',ProductionRoutingSequence='0',ProductionRoutingSqncIntVers='1')/to_Operation`;

// Function to get CSRF token
async function getCsrfToken() {
    try {
        const response = await axios.get(workCenterUrl, {
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
        throw new Error("Error fetching CSRF token", error);
    }
}

// Function to get all work centers
const getAllWorkCenters = async () => {
    const url = `${host}/sap/opu/odata/sap/API_WORK_CENTERS/A_WorkCenters?$format=json`;
    try {
        const response = await axios.get(url, {
            auth: {
                username: username,
                password: password
            }
        });
        return response.data.d.results;
    } catch (error) {
        throw new Error("Error fetching data:", error);
    }
};

const getRoutesForWorkCenter = async (workCenterInternalID) => {
    const url = `${host}/sap/opu/odata/sap/API_PRODUCTION_ROUTING/ProductionRoutingOperation?$filter=WorkCenterInternalID eq '${workCenterInternalID}'&$format=json`;
    try {
        const response = await axios.get(url, {
            auth: {
                username: username,
                password: password
            }
        });
        return response.data.d.results;
    } catch (error) {
        console.error(`Failed to fetch routes for WorkCenterInternalID: ${workCenterInternalID}`, error.message);
        throw new Error("Error fetching data:", error)
    }
};

// Function to create a new work center
const createWorkCenter = async (workCenterPostData) => {
    try {
        const { csrfToken, cookies } = await getCsrfToken();
        const workCenterPostResponse = await axios.post(workCenterUrl, workCenterPostData, {
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
        return workCenterPostResponse;
    } catch (error) {
        throw new Error("Error creating work center:", error);
    }
};

const createRouting = async (routingPostData) => {
    try {
        const { csrfToken, cookies } = await getCsrfToken();
        const routingPostResponse = await axios.post(routingPostUrl, routingPostData, {
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
        return routingPostResponse;
    } catch (error) {
        throw new Error("Error creating routing:", error);
    }
}

const extractCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        let currentProject = null;
        let currentWorkCenter = null;
        const projects = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const displayName = data['Display Name'];
                const estimatedTime = data['Estimated time(R)'];
                const depth = data['Depth'];

                if (depth === '1') {
                    currentProject = { project: displayName, work_centers: [] };
                    projects.push(currentProject);
                } else if (depth === '2') {
                    currentWorkCenter = { work_center: displayName, routingInfos: [] };
                    if (currentProject) {
                        currentProject.work_centers.push(currentWorkCenter);
                    } else {
                        console.log('Depth 2 found without preceding Depth 1:', { displayName, estimatedTime });
                    }
                } else if (depth === '3') {
                    const routingInfo = { routingInfo: displayName, estimatedTime };
                    if (currentWorkCenter) {
                        currentWorkCenter.routingInfos.push(routingInfo);
                    } else {
                        console.log('Depth 3 found without preceding Depth 2:', { displayName, estimatedTime });
                    }
                } else {
                    console.log('Unknown depth:', depth);
                }
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
                resolve(projects);
            })
            .on('error', (error) => {
                console.error('Error reading the CSV file:', error);
                reject(error);
            });
    });
};

// Function to process the CSV file and create work centers
const processCSV = async (filePath) => {
    const existingWorkCenters = await getAllWorkCenters();
    const existingWorkCenterNames = existingWorkCenters.map(wc => wc.WorkCenter);
    const existingWorkCenterMap = new Map(existingWorkCenters.map(wc => [wc.WorkCenter, wc.WorkCenterInternalID]));

    const bopDataArray = await extractCSV(filePath);
    const bopData = bopDataArray[0].work_centers;
    for (const workCenterData of bopData) {
        let workCenterName = "WC" + workCenterData.work_center.split("System")[1].trim().slice(0,-1).replace(/^0000/, '');
        workCenterName = workCenterName.replace(/[\s.]/g, '-')
        const workCenterDesc = workCenterData.work_center.slice(0,39).replace(/\./g, '-').toUpperCase();
        let workCenterInternalID;

        if (!existingWorkCenterNames.includes(workCenterName)) {

            const workCenterPostData = {
                "WorkCenterTypeCode": "A",
                "WorkCenter": workCenterName,
                "Plant": "HH00",
                "StandardWorkFormulaParamGroup": "SAP1",
                "WorkCenterUsage": "009",
                "WorkCenterResponsible": "000",
                "WorkCenterCategoryCode": "0001",
                "to_WorkCenterDescription": [
                    {
                        "WorkCenterTypeCode": "A",
                        "Language": "EN",
                        "WorkCenterDesc": workCenterDesc
                    }
                ]
            };

            try {
                const response = await createWorkCenter(workCenterPostData);
                if(response.status == 201){
                    console.log(`Work center created: ${workCenterName}`);
                    workCenterInternalID = 0;
                }
            } catch (error) {
                console.error(`Failed to create work center: ${workCenterName}`, error.message);
                continue; // Skip to the next work center if creation failed
            }
        } else {
            workCenterInternalID = existingWorkCenterMap.get(workCenterName);
        }

        if(workCenterInternalID === 0) {
            const tempWorkcenters = await getAllWorkCenters();
            const workCenter = tempWorkcenters.find(wc => wc.WorkCenter === workCenterName.toUpperCase());
            if(workCenter){
                workCenterInternalID = workCenter.WorkCenterInternalID;
            } else{
                console.log("No Work Center of the name: "+ workCenterName);

            }
        }
        const existingRoutes = await getRoutesForWorkCenter(workCenterInternalID);
        const existingRouteTexts = existingRoutes.map(route => route.OperationText);

        for (const routingInfo of workCenterData.routingInfos) {
            const operationText = routingInfo.routingInfo.slice(0,39).replace(/\./g, '-').toUpperCase().trim();
            if (!existingRouteTexts.includes(operationText)) {
                const routingPostData = {
                    "ProductionRoutingGroup": "50000002",
                    "ProductionRouting": "1",
                    "ProductionRoutingSequence": "0",
                    "ProductionRoutingOpIntID": "1",
                    "ProductionRoutingOpIntVersion": "1",
                    "OperationUnit": "EA",
                    "OpQtyToBaseQtyNmrtr": "10",
                    "OpQtyToBaseQtyDnmntr": "1",
                    "OperationReferenceQuantity": "1",
                    "OperationText": operationText,
                    "Plant": "HH00",
                    "OperationControlProfile": "PP01",
                    "WorkCenterTypeCode": "A",
                    "WorkCenterInternalID": workCenterInternalID
                };

                try {
                    const response = await createRouting(routingPostData);
                    if(response.status === 201){
                        console.log(`Routing created for work center ${workCenterName}:${response.data.d.OperationText}`);
                    }
                } catch (error) {
                    console.error(`Failed to create routing for work center ${workCenterName}`, error.message);
                }
            }
        }
    }
};

const csvFilePath = '../../data/bop_example.csv'; 
const watcher = chokidar.watch(csvFilePath, {
    persistent: true,
    ignoreInitial: true, // Ignore the initial add event
    awaitWriteFinish: {
        stabilityThreshold: 1000, // Wait for 1 second after the last change
        pollInterval: 100 // Check every 100ms for changes
    }
});

watcher
    .on('change', path => {
        console.log(`File ${path} has been changed`);
        processCSV(path);
    })
    .on('error', error => console.error(`Watcher error: ${error}`));
// Process the CSV file
console.log(`Watching for changes in ${filePath}`);
// processCSV(csvFilePath);
