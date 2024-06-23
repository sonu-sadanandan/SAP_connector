const axios = require('axios');
const { fetchBoms } = require('./api/bom/bom');
const { fetchSalesOrder } = require('./api/sales_orders/salesOrder');
const { getAllWorkCenters, getWorkCenterById, createWorkCenter } = require('./api/work_center/workcenter')

const fetchData = async () =>{
    try {
        console.log("Process started... ");
        const boms = await fetchBoms();
        const salesOrder = await fetchSalesOrder();
        const workCenters = await getAllWorkCenters();
        const workCenterById = await getWorkCenterById(10000065)
        console.log(boms)
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

const insertionData = {
    "WorkCenterInternalID": "10000208",
    "WorkCenterTypeCode": "A",
    "WorkCenter": "WCtest8",
    "Plant": "HH00",
    "StandardWorkFormulaParamGroup": "SAP1",
    "WorkCenterUsage": "009",
    "WorkCenterResponsible": "000",
    "WorkCenterCategoryCode": "0001",
    "to_WorkCenterDescription": [
      {
        "WorkCenterInternalID": "10000201",
        "WorkCenterTypeCode": "A",
        "Language": "EN",
        "WorkCenterDesc": "TEST Work Center Descriptions testtt8"
      }
    ]
  }

const createData = async(insertionData) =>{
    try {
        console.log("processing the post request ...");
        const response = await createWorkCenter(insertionData);
        console.log(response)
    } catch (err) {
        console.error('Error fetching data:', err.message);
    }
}
createData(insertionData);
//fetchData();

process.on("uncaughtException", function (err) {
    console.error(
        `${new Date().toUTCString()}: UncaughtException: ${err.message}\n${
            err.stack
        }`
    );
    process.exit(1);
});
