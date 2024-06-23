const fs = require('fs');
const csv = require('csv-parser');

const projects = [];

const processCSV = (filePath) => {
    let currentProject = null;
    let currentWorkCenter = null;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            const displayName = data['Display Name'];
            const estimatedTime = data['Estimated time(R)'];
            const depth = data['Depth'];

            if (depth === '1') {
                currentProject = { project: displayName, work_centers: [] };
                projects.push(currentProject);
            } else if (depth === '2') {
                currentWorkCenter = { work_center: displayName, routingInfos: [] };
                if (currentProject) {
                    currentProject.work_centers.push(currentWorkCenter);
                } else {
                    console.log('Depth 2 found without preceding Depth 1:', { displayName, estimatedTime });
                }
            } else if (depth === '3') {
                const routingInfo = { routingInfo: displayName, estimatedTime };
                if (currentWorkCenter) {
                    currentWorkCenter.routingInfos.push(routingInfo);
                } else {
                    console.log('Depth 3 found without preceding Depth 2:', { displayName, estimatedTime });
                }
            } else {
                console.log('Unknown depth:', depth);
            }
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
            console.log('Projects:', JSON.stringify(projects, null, 2));
        })
        .on('error', (error) => {
            console.error('Error reading the CSV file:', error);
        });
};

// Path to your CSV file
const csvFilePath = '../data/bop.csv'; // Replace with the actual path to your CSV file

// Process the CSV file
processCSV(csvFilePath);
