const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const chokidar = require('chokidar');
require('dotenv').config();

// Basic Authentication credentials
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;
const host = 'a20z.ucc.ovgu.de'; 

// URLs for the endpoints
// const Material_URL = `https://${host}/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product`;
const billOfMaterialUrl = `https://${host}/sap/opu/odata/sap/API_BILL_OF_MATERIAL_SRV;v=0002/MaterialBOMItem?$filter=BillOfMaterial%20eq%20%2700034035%27`;
const deleteUrl = `https://${host}/sap/opu/odata/sap/API_BILL_OF_MATERIAL_SRV;v=0002/MaterialBOMItem`;
// const fetchEtagUrl = `https://${host}/sap/opu/odata/sap/API_BILL_OF_MATERIAL_SRV;v=0002/MaterialBOMItem(BillOfMaterial='00034035',BillOfMaterialCategory='M',BillOfMaterialVariant='1',BillOfMaterialVersion='',BillOfMaterialItemNodeNumber='1',HeaderChangeDocument='',Material='RC-CAR',Plant='HH00')`;
const watchDirectory = __dirname;


const auth = Buffer.from(`${username}:${password}`).toString('base64');

// Function to fetch the x-csrf-token and cookies
async function fetchTokenAndCookies(url) {
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'x-csrf-token': 'fetch'
    }
  });

  const csrfToken = response.headers['x-csrf-token'];
  const cookies = response.headers['set-cookie'];

  return { csrfToken, cookies };
}

// Function to fetch ETag
async function fetchETag(url, csrfToken, cookies) {
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'x-csrf-token': csrfToken,
      'Cookie': cookies.join('; ')
    }
  });

  return response.headers['etag'];
}


// Function to make the POST requests
async function makePostRequest(url, data, csrfToken, cookies) {
  await axios.post(url, data, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'x-csrf-token': csrfToken,
      'Cookie': cookies.join('; ')
    }
  });
}

// Function to make the DELETE requests
async function makeDeleteRequest(url, csrfToken, cookies, etag) {
  await axios.delete(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'x-csrf-token': csrfToken,
      'Cookie': cookies.join('; '),
      'If-Match': etag
    }
  });
}

// Function to get the existing Bill of Material components
async function getExistingBillOfMaterialComponents() {
  const response = await axios.get(billOfMaterialUrl, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });

  pattern = /"FixedQuantity":,/g;
  const replacement = '"FixedQuantity":{},'
  correctedJson = response.data.replace(pattern, replacement)
  jsonData = JSON.parse(correctedJson)
  const results = jsonData.d.results

  return results;
}

// Function to process CSV and perform necessary requests
async function processCSV(filePath) {
  const existingComponents = await getExistingBillOfMaterialComponents();
  const existingComponentNames = existingComponents.map(item => item.BillOfMaterialComponent);
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      if (results.length > 1) {
        const { csrfToken, cookies } = await fetchTokenAndCookies(`https://${host}/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product`);

        // Create a map for checking existence and depths
        const csvComponentsMap = {};
        for (let i = 1; i < results.length; i++) {
          const row = results[i];
          let productName = row['Name'].replace(/[\s.]/g, '-').toUpperCase();
          csvComponentsMap[productName] = parseInt(row['Depth']);
        }

        // Iterate over the rows, starting from the second row
        for (let i = 1; i < results.length; i++) {
          const row = results[i];
          const productDescription = row['Title(R)'].substring(0,39);
          let productName = row['Name'].replace(/[\s.]/g, '-').toUpperCase();
          const depth = parseInt(row['Depth']);
          const previousRow = results[i - 1];
          const previousName = previousRow['Name'].replace(/[\s.]/g, '-').toUpperCase();

          let bomItemDescription = '';
          if (depth === 1) {
            bomItemDescription = `Child of ${previousName}`;
          } else {
            for (let j = i - 1; j >= 0; j--) {
              if (parseInt(results[j]['Depth']) === depth - 1) {
                let parentMaterial = results[j]['Name'].split(' ').pop().slice(-30);
                parentMaterial = parentMaterial.replace(/[\s.]/g, '-').toUpperCase()
                bomItemDescription = `Child of ${parentMaterial}`;
                break;
              }
            }
          }

          // Check if the component already exists
          if (!existingComponentNames.includes(productName)) {
            const postData1 = {               
              "Product": productName,
              "ProductType": "HALB",
              "IndustrySector": "M",
              "BaseUnit": "EA",
              "to_Description": [{
                  "Product": productName,
                  "Language": "EN",
                  "ProductDescription": productDescription
              }],
              "to_Plant": [{
                  "Product": productName,
                  "Plant": "HH00"
              }]
          };

            const postData2 = {
              "BillOfMaterial": "00034035",
              "BillOfMaterialCategory": "M",
              "BillOfMaterialVariant": "1",
              "BillOfMaterialItemNodeNumber": "1",
              "Material": "RC-CAR",
              "Plant": "HH00",
              "BOMItemDescription": bomItemDescription,
              "BillOfMaterialComponent": productName,
              "BillOfMaterialItemUnit": "EA",
              "BillOfMaterialItemQuantity": "1",
              "BillOfMaterialItemCategory": "L"
          };

            try {
              await makePostRequest(`https://${host}/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product`, postData1, csrfToken, cookies);
              await makePostRequest(`https://${host}/sap/opu/odata/sap/API_BILL_OF_MATERIAL_SRV;v=0002/MaterialBOMItem`, postData2, csrfToken, cookies);

              console.log(`POST requests successful for row ${i + 1}`);
            } catch (error) {
              console.error(`Error making POST requests for row ${i + 1}:`, error);
            }
          } else {
            console.log(`Component ${productName} already exists. Skipping row ${i + 1}.`);
          }
        }

        // Delete BOM components not present in CSV
        for (const item of existingComponents) {
          const componentName = item.BillOfMaterialComponent;
          if (!csvComponentsMap[componentName]) {
            const deleteUrlWithParams = `${deleteUrl}(BillOfMaterial='${item.BillOfMaterial}',BillOfMaterialCategory='${item.BillOfMaterialCategory}',BillOfMaterialVariant='${item.BillOfMaterialVariant}',BillOfMaterialVersion='',BillOfMaterialItemNodeNumber='${item.BillOfMaterialItemNodeNumber}',HeaderChangeDocument='',Material='${item.Material}',Plant='${item.Plant}')`;
            try {
              const etag = await fetchETag(deleteUrlWithParams, csrfToken, cookies);
              await makeDeleteRequest(deleteUrlWithParams, csrfToken, cookies, etag);
              console.log(`DELETE request successful for ${componentName}`);
            } catch (error) {
              console.error(`Error making DELETE request for ${componentName}:`, error);
            }
          }
        }
      }
    });
}


// Watch the directory for new files
const watcher = chokidar.watch(`${watchDirectory}/mbom*.csv`, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
});

watcher.on('add', filePath => {
  console.log(`Processing new file: ${filePath}`);
  processCSV(filePath);
});

console.log(`Watching directory: ${watchDirectory} for new files...`);
