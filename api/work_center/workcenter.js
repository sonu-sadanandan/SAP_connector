const { auth } = require('../../auth/auth');
const axios = require('axios');
const SAP_BASE_URL = process.env.BASE_URL;
const WORK_CENTER = "API_WORK_CENTERS/A_WorkCenterAllCapacity/";

const axiosInstance = axios.create({
    baseURL: 'https://a20z.ucc.ovgu.de/sap/opu/odata/sap',
    withCredentials: true, // To handle cookies
    headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.USER_NAME}:${process.env.PASSWORD}`).toString('base64')}`,
        'Content-Type': 'application/json'
    }
});

async function getCsrfToken() {
    try {
        const response = await axiosInstance.get('/API_WORK_CENTERS', {
            headers: {
                'x-csrf-token': 'Fetch'
            }
        });

        const csrfToken = response.headers['x-csrf-token'];
        return csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error.response ? error.response.data : error.message);
        throw error;
    }
}


const getAllWorkCenters = async () => {
    const url = `${SAP_BASE_URL}${WORK_CENTER}?$top=20&$inlinecount=allpages&$format=json`
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

const getWorkCenterById = async (WorkCenterInternalID) => {
    try {
        const url = `${SAP_BASE_URL}${WORK_CENTER}?$filter=WorkCenterInternalID eq '${WorkCenterInternalID}'&$format=json`
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

  const createWorkCenter = async (insertionData) => {
    try {
        const response = await axios.get(`https://A20Z.UCC.OVGU.DE:443/sap/opu/odata/sap/API_WORK_CENTERS?$format=json`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'x-csrf-token': 'fetch'
            }
        });
        const csrfToken = response.headers['x-csrf-token'];
        const url = `https://a20z.ucc.ovgu.de/sap/opu/odata/sap/API_WORK_CENTERS/A_WorkCenters`;
        const postResponse = await axios.post(url, insertionData, {
            headers: {
                'x-csrf-token': csrfToken,
                'Authorization': `Basic ${auth}`    
            }
        });
        return postResponse;
    } catch (error) {
        console.error("Error fetching data:", error.message);
    }
  }

module.exports = { getAllWorkCenters, getWorkCenterById, createWorkCenter };