/**
 * Google Apps Script for Mount Lotus Funnel Report Auto-Sync
 * 
 * Paste this script into your Google Sheet's Apps Script editor:
 * 1. Open your Google Sheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Replace any code with this script.
 * 4. Update the DEPLOYMENT_URL variable with your Vercel deployment URL.
 * 5. Update the SYNC_SECRET variable if you set up an access token.
 * 6. Set up a trigger:
 *    - Click the clock icon on the left (Triggers).
 *    - Click "Add Trigger" (bottom right).
 *    - Choose function: "onChangeTrigger".
 *    - Event source: "From spreadsheet".
 *    - Event type: "On change" or "On edit".
 *    - Save and authorize permissions.
 */

// Replace with your Vercel/production deployment URL (e.g. "https://mount-lotus-tracking-funnel.vercel.app")
var DEPLOYMENT_URL = "YOUR_APP_DEPLOYMENT_URL";

// Set this if you configured a SYNC_SECRET environment variable in Vercel
var SYNC_SECRET = ""; 

function onChangeTrigger(e) {
  // We trigger on any structural change or edit to the spreadsheet
  syncGoogleSheet();
}

function syncGoogleSheet() {
  if (DEPLOYMENT_URL === "YOUR_APP_DEPLOYMENT_URL") {
    Logger.log("Please configure the DEPLOYMENT_URL variable with your live app URL.");
    return;
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheetUrl = spreadsheet.getUrl();
  
  var apiEndpoint = DEPLOYMENT_URL.replace(/\/$/, "") + "/api/import-sheet";
  if (SYNC_SECRET) {
    apiEndpoint += "?secret=" + encodeURIComponent(SYNC_SECRET);
  }

  var payload = JSON.stringify({
    url: sheetUrl
  });

  var options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(apiEndpoint, options);
    var responseText = response.getContentText();
    var statusCode = response.getResponseCode();
    
    Logger.log("Status Code: " + statusCode);
    Logger.log("Response: " + responseText);
  } catch (err) {
    Logger.log("Error sending sync request: " + err.toString());
  }
}
