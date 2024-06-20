const { auth } = require('../../auth/auth');
const axios = require('axios');

const url = "https://a20z.ucc.ovgu.de/sap/opu/odata/sap/API_BILL_OF_MATERIAL_SRV;v=0001/A_BillOfMaterialItem?$filter=BillOfMaterial eq '00034031'&$format=json";


const fetchBoms = async () => {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    return response.data;

    // Optionally save the data to a file
    // const filePath = path.join(__dirname, 'data.json');
    // fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
};

module.exports = { fetchBoms };