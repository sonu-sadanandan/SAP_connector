const axios = require('axios');
const { fetchBoms } = require('./api/bom/bom')
const { fetchSalesOrder } = require('./api/sales_orders/salesOrder')

const fetchData = async () =>{
    try {
        console.log("Process started... ");
        const boms = await fetchBoms();
        const salesOrder = await fetchSalesOrder();
        // console.log(boms);
        console.log(salesOrder)
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
