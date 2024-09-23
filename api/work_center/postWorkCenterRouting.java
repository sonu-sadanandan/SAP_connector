import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;
import org.json.JSONObject;
import org.json.JSONArray;

public class SAPApiPost {

    private static final String USERNAME = "Username";
    private static final String PASSWORD = "Password";
    private static final String HOST = "a20z.ucc.ovgu.de";
    
    private static final String WORK_CENTRE_URL = HOST + "/sap/opu/odata/sap/API_WORK_CENTERS/A_WorkCenters";
    private static final String ROUTING_URL = HOST + "/sap/opu/odata/sap/API_PRODUCTION_ROUTING/ProductionRoutingSequence(ProductionRoutingGroup='50000002',ProductionRouting='1',ProductionRoutingSequence='0',ProductionRoutingSqncIntVers='1')/to_Operation";

    public static void main(String[] args) {
        try {
            // Step 1: Fetch CSRF token and cookies for Work Center
            String[] workCenterCsrfAndCookie = fetchCsrfTokenAndCookie(WORK_CENTRE_URL);
            String workCenterCsrfToken = workCenterCsrfAndCookie[0];
            String workCenterCookies = workCenterCsrfAndCookie[1];

            // Step 2: Create Work Center
            createWorkCenter(workCenterCsrfToken, workCenterCookies);

            // Step 3: Fetch CSRF token and cookies for Routing
            String[] routingCsrfAndCookie = fetchCsrfTokenAndCookie(ROUTING_URL);
            String routingCsrfToken = routingCsrfAndCookie[0];
            String routingCookies = routingCsrfAndCookie[1];

            // Step 4: Create Routing Sequence
            createRouting(routingCsrfToken, routingCookies);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String[] fetchCsrfTokenAndCookie(String urlString) throws IOException {
        URL url = new URL(urlString);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Authorization", "Basic " + Base64.getEncoder().encodeToString((USERNAME + ":" + PASSWORD).getBytes()));
        connection.setRequestProperty("x-csrf-token", "Fetch");

        String csrfToken = "";
        String cookies = "";

        int responseCode = connection.getResponseCode();
        if (responseCode == HttpURLConnection.HTTP_OK) {
            csrfToken = connection.getHeaderField("x-csrf-token");
            cookies = connection.getHeaderField("Set-Cookie");
        } else {
            throw new IOException("Failed to fetch CSRF token and cookies, response code: " + responseCode);
        }
        connection.disconnect();
        return new String[]{csrfToken, cookies};
    }

    private static void createWorkCenter(String csrfToken, String cookies) throws IOException {
        URL url = new URL(WORK_CENTRE_URL);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Authorization", "Basic " + Base64.getEncoder().encodeToString((USERNAME + ":" + PASSWORD).getBytes()));
        connection.setRequestProperty("x-csrf-token", csrfToken);
        connection.setRequestProperty("Cookie", cookies);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);

        JSONObject workCenterBody = new JSONObject();
        workCenterBody.put("WorkCenterTypeCode", "A");
        workCenterBody.put("WorkCenter", "workCenterName");
        workCenterBody.put("Plant", "HH00");
        workCenterBody.put("StandardWorkFormulaParamGroup", "SAP1");
        workCenterBody.put("WorkCenterUsage", "009");
        workCenterBody.put("WorkCenterResponsible", "000");
        workCenterBody.put("WorkCenterCategoryCode", "0001");

        JSONObject workCenterDescription = new JSONObject();
        workCenterDescription.put("WorkCenterTypeCode", "A");
        workCenterDescription.put("Language", "EN");
        workCenterDescription.put("WorkCenterDesc", "Description");

        workCenterBody.put("to_WorkCenterDescription", new JSONObject[]{workCenterDescription});

        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = workCenterBody.toString().getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        int responseCode = connection.getResponseCode();
        if (responseCode == HttpURLConnection.HTTP_CREATED) {
            System.out.println("Work Center created successfully.");
        } else {
            System.out.println("Failed to create Work Center, response code: " + responseCode);
        }
        connection.disconnect();
    }

    private static void createRouting(String csrfToken, String cookies) throws IOException {
        URL url = new URL(ROUTING_URL);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Authorization", "Basic " + Base64.getEncoder().encodeToString((USERNAME + ":" + PASSWORD).getBytes()));
        connection.setRequestProperty("x-csrf-token", csrfToken);
        connection.setRequestProperty("Cookie", cookies);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);

        JSONObject routingBody = new JSONObject();
        routingBody.put("ProductionRoutingGroup", "50000002");
        routingBody.put("ProductionRouting", "1");
        routingBody.put("ProductionRoutingSequence", "0");
        routingBody.put("ProductionRoutingOpIntID", "1");
        routingBody.put("ProductionRoutingOpIntVersion", "1");
        routingBody.put("OperationUnit", "EA");
        routingBody.put("OpQtyToBaseQtyNmrtr", "10");
        routingBody.put("OpQtyToBaseQtyDnmntr", "1");
        routingBody.put("OperationReferenceQuantity", "1");
        routingBody.put("OperationText", "operationText");
        routingBody.put("Plant", "HH00");
        routingBody.put("OperationControlProfile", "PP01");
        routingBody.put("WorkCenterTypeCode", "A");
        routingBody.put("WorkCenterInternalID", "workCenterInternalID");

        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = routingBody.toString().getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        int responseCode = connection.getResponseCode();
        if (responseCode == HttpURLConnection.HTTP_CREATED) {
            System.out.println("Routing created successfully.");
        } else {
            System.out.println("Failed to create Routing, response code: " + responseCode);
        }
        connection.disconnect();
    }
}
