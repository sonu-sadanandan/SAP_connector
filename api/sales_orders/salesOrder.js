const { auth } = require('../../auth/auth');
const axios = require('axios');

const url = "https://a20z.ucc.ovgu.de:443/sap/opu/odata/sap/API_SALES_ORDER_SRV/?$format=json&sap-statistics=true";


const fetchSalesOrder = async () => {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
};

module.exports = { fetchSalesOrder };