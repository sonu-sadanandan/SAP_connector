const axios = require('axios');
// const qs = require('qs');

// Basic Authentication credentials
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;
const host = 'a20z.ucc.ovgu.de';  // Replace with your host

// URLs for the endpoints
const Material_URL = `https://${host}/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product`;
const BOM_URL = `https://${host}/sap/opu/odata/sap/API_BILL_OF_MATERIAL_SRV;v=0002/MaterialBOMItem`;

// JSON body for the POST requests
const Material_POST = {               
    "Product": "APITEST1",
    "ProductType": "HALB",
    "IndustrySector": "M",
    "BaseUnit": "EA",
    "to_Description": [{
        "Product": "APITEST1",
        "Language": "EN",
        "ProductDescription": "API test from POSTMAN"
    }],
    "to_Plant": [{
        "Product": "APITEST1",
        "Plant": "HH00"
     }]
};

const BOM_POST = {
    "BillOfMaterial": "00034033",
    "BillOfMaterialCategory": "M",
    "BillOfMaterialVariant": "1",
    "BillOfMaterialItemNodeNumber": "1",
    "Material": "53",
    // "Plant": "HH00",
    "BillOfMaterialComponent": "APITEST1",
    "BillOfMaterialItemUnit": "EA",
    "BillOfMaterialItemQuantity": "1",
    "BillOfMaterialItemCategory": "L"
};

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

async function main() {
  try {
    const { csrfToken, cookies } = await fetchTokenAndCookies();
    
    await makePostRequest(Material_URL, Material_POST, csrfToken, cookies);
    await makePostRequest(BOM_URL, BOM_POST, csrfToken, cookies);

    console.log('POST requests successful');
  } catch (error) {
    console.error('Error making POST requests:', error);
  }
}

main();
