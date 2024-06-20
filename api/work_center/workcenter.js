const { auth } = require('../../auth/auth');
const axios = require('axios');
const SAP_BASE_URL = process.env.BASE_URL;
const WORK_CENTER = "API_WORK_CENTERS/A_WorkCenterAllCapacity/";


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

module.exports = { getAllWorkCenters, getWorkCenterById };