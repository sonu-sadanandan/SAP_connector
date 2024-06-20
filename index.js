const axios = require('axios');
const { fetchBoms } = require('./api/bom/bom');
const { fetchSalesOrder } = require('./api/sales_orders/salesOrder');
const { getAllWorkCenters, getWorkCenterById } = require('./api/work_center/workcenter')

const fetchData = async () =>{
    try {
        console.log("Process started... ");
        const boms = await fetchBoms();
        // const salesOrder = await fetchSalesOrder();
        // const workCenters = await getAllWorkCenters();
        // const workCenterById = await getWorkCenterById(10000065)
        console.log(boms)
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}
fetchData();

process.on("uncaughtException", function (err) {
    console.error(
        `${new Date().toUTCString()}: UncaughtException: ${err.message}\n${
            err.stack
        }`
    );
    process.exit(1);
});
