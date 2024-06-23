const { response } = require('express');
const { auth } = require('../../auth/auth');
const axios = require('axios');
const SAP_BASE_URL = process.env.BASE_URL;
const WORK_CENTER = "API_WORK_CENTERS/A_WorkCenterAllCapacity/";
require('dotenv').config();

const username = process.env.USER_NAME;
const password = process.env.PASSWORD;
const host = 'a20z.ucc.ovgu.de';
const endpointUrl = `https://${host}/sap/opu/odata/sap/API_WORK_CENTERS/A_WorkCenters`;

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


const getAllWorkCenters = async () => {
    const url = `${SAP_BASE_URL}${WORK_CENTER}?$top=20&$inlinecount=allpages&$format=json`
    try {
        const response = await axios.get(url, {
        headers: {
            'Authorization': `Basic ${auth}`
        }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
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
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
  };

  const createWorkCenter = async (insertionData) => {
    try {
        const {csrfToken, cookies} = await getCsrfToken();
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
        console.error("Error fetching data:", error.message);
        throw error;
    }
  }

module.exports = { getAllWorkCenters, getWorkCenterById, createWorkCenter };