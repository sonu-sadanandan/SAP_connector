const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Basic Authentication credentials
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;
const host = 'a20z.ucc.ovgu.de'; 

// URLs for the endpoints
const Material_URL = `https://${host}/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product`;
const BOM_URL = `https://${host}/sap/opu/odata/sap/API_BILL_OF_MATERIAL_SRV;v=0002/MaterialBOMItem`;

const auth = Buffer.from(`${username}:${password}`).toString('base64');

// Function to fetch the x-csrf-token and cookies
async function fetchTokenAndCookies() {
  const response = await axios.get(Material_URL, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'x-csrf-token': 'fetch'
    }
  });

  const csrfToken = response.headers['x-csrf-token'];
  const cookies = response.headers['set-cookie'];

  return { csrfToken, cookies };
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

// Function to read CSV and perform POST requests
async function processCSV() {
  const results = [];

  fs.createReadStream('mbom-15.06.24.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      if (results.length > 1) {
        const { csrfToken, cookies } = await fetchTokenAndCookies();

        // Iterate over the rows, starting from the second row
        for (let i = 1; i < results.length; i++) {
          const row = results[i];
          const productDescription = row['Title(R)'].substring(0,39); // Convert to upper case and length of max 39 characters.
          const product = row['Name'].replace(/[\s.]/g, '-').toUpperCase();  
          const depth = parseInt(row['Depth']);
          const previousRow = results[i - 1];
          const previousName = previousRow['Name'];

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

        // JSON body for the POST requests
        const Material_POST = {               
            "Product": product,
            "ProductType": "HALB",
            "IndustrySector": "M",
            "BaseUnit": "EA",
            "to_Description": [{
                "Product": product,
                "Language": "EN",
                "ProductDescription": productDescription
            }],
            "to_Plant": [{
                "Product": product,
                "Plant": "HH00"
            }]
        };

        const BOM_POST = {
            "BillOfMaterial": "00034035",
            "BillOfMaterialCategory": "M",
            "BillOfMaterialVariant": "1",
            "BillOfMaterialItemNodeNumber": "1",
            "Material": "RC-CAR",
            "Plant": "HH00",
            "BOMItemDescription": bomItemDescription,
            "BillOfMaterialComponent": product,
            "BillOfMaterialItemUnit": "EA",
            "BillOfMaterialItemQuantity": "1",
            "BillOfMaterialItemCategory": "L"
        };

        try {
            await makePostRequest(Material_URL, Material_POST, csrfToken, cookies);
            await makePostRequest(BOM_URL, BOM_POST, csrfToken, cookies);

            console.log(`POST requests successful for row ${i + 1}`);
          } catch (error) {
            console.error(`Error making POST requests for row ${i + 1}:`, error);
          }
        }
      }
    });
}

processCSV();