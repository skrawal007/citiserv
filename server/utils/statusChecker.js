const puppeteer = require("puppeteer");
const { pool } = require("../database/db");

const submitRequestNumbers = async (requests) => {
  let browser;
  const results = [];

  try {
    console.log(`Starting batch processing: ${requests.length} requests`);

    // ==========================================================
    // LAUNCH CHROME ONCE
    // ==========================================================

    browser = await puppeteer.launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",

      headless: false,
      defaultViewport: null,
      ignoreHTTPSErrors: true,

      args: [
        "--start-maximized",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
        "--disable-web-security",
      ],
    });

    const page = await browser.newPage();

    // ==========================================================
    // OPEN WEBSITE
    // ==========================================================

    await page.goto(
      "https://cctnsup.gov.in/citizenportal/CitizenVerification.aspx",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      },
    );

    await page.waitForSelector("#ddlReportType", {
      timeout: 30000,
    });

    await page.waitForSelector("#txtServiceNo", {
      timeout: 30000,
    });

    // ==========================================================
    // TYPE MAP
    // ==========================================================

    const typeMap = {
      character: "CHARACTERCERTIFICATE",
      complaint: "COMPLAINT",
      domestic: "DOMESTICVERIFICATION",
      employee: "EMPLOYEEVERIFICATION",
      tenant: "TENNANTVERIFICATION",

      event: "EVENTPERFORMANCE",
      procession: "PROCESSION",
      protest: "PROTESTSTRIKE",
    };

    // ==========================================================
    // PROCESS EACH REQUEST
    // ==========================================================

    for (const request of requests) {
      const requestNo = String(request.request_no).trim();
      const type = request.request_type;

      console.log(`\n========================================`);
      console.log(`Processing ${requestNo} | ${type}`);

      try {
        // ======================================================
        // NORMALIZE TYPE
        // ======================================================

        const normalizedType = String(type).trim().toLowerCase();

        const reportType = typeMap[normalizedType];

        if (!reportType) {
          throw new Error(`Invalid request type: ${type}`);
        }

        // ======================================================
        // SELECT REPORT TYPE
        // ======================================================

        await page.select("#ddlReportType", reportType);

        // ======================================================
        // CLEAR OLD REQUEST NUMBER
        // ======================================================

        await page.$eval("#txtServiceNo", (input) => {
          input.value = "";

          input.dispatchEvent(
            new Event("input", {
              bubbles: true,
            }),
          );

          input.dispatchEvent(
            new Event("change", {
              bubbles: true,
            }),
          );
        });

        // ======================================================
        // ENTER REQUEST NUMBER
        // ======================================================

        await page.type("#txtServiceNo", requestNo);

        console.log(`Request number entered: ${requestNo}`);

        // ======================================================
        // WAIT 3 SECONDS AFTER SUBMIT
        //
        // IMPORTANT:
        // ASP.NET page needs time to update/re-render
        // the GridView.
        // ======================================================

        await page.evaluate(() => {
          window.__searchStartedAt = Date.now();
        });

        // ======================================================
        // CLICK SEARCH BUTTON
        // ======================================================

        await page.waitForSelector("#btnSearchFir", {
          visible: true,
          timeout: 10000,
        });

        await page.evaluate(() => {
          const button = document.querySelector("#btnSearchFir");

          if (!button) {
            throw new Error("Search button not found");
          }

          button.click();
        });

        console.log(`Search clicked for ${requestNo}`);

        // ======================================================
        // WAIT MINIMUM 3 SECONDS
        // ======================================================

        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(`3 seconds completed. Checking table...`);

        // ======================================================
        // NOW WAIT UNTIL:
        //
        // table exists
        // +
        // row exists
        // +
        // cells[0] === requestNo
        //
        // Poll every 200ms.
        // ======================================================

        const matchingRow = await page.waitForFunction(
          (requestNo) => {
            const table = document.querySelector("#gdvdata");

            if (!table) {
              return null;
            }

            const rows = [...table.querySelectorAll("tr")];

            if (!rows.length) {
              return null;
            }

            for (const row of rows) {
              const cells = [...row.querySelectorAll("td")];

              if (!cells.length) {
                continue;
              }

              const registrationNumber = (cells[0]?.innerText || "").trim();

              // =================================================
              // EXACT MATCH
              // =================================================

              if (registrationNumber === requestNo) {
                return cells.map((td) => td.innerText.trim());
              }
            }

            // =================================================
            // NOT FOUND YET
            //
            // Keep waiting.
            // =================================================

            return null;
          },
          {
            timeout: 20000,
            polling: 200,
          },
          requestNo,
        );

        // ======================================================
        // EXTRACT ROW
        // ======================================================

        const cells = await matchingRow.jsonValue();

        // ======================================================
        // SAFETY CHECK
        // ======================================================

        if (!cells || !Array.isArray(cells) || cells.length === 0) {
          throw new Error("Table loaded but matching row was not returned");
        }

        // ======================================================
        // CONVERT TABLE ROW TO JSON
        // ======================================================

        const data = {
          registrationNumber: cells[0] || "",

          currentStatus: cells[1] || "",

          district: cells[2] || "",

          policeStation: cells[3] || "",

          applicationDate: cells[4] || "",

          name: cells[5] || "",

          address: cells[6] || "",
        };

        // ======================================================
        // FINAL EXACT MATCH CHECK
        // ======================================================

        if (data.registrationNumber !== requestNo) {
          throw new Error(
            `Registration number mismatch. Requested=${requestNo}, Received=${data.registrationNumber}`,
          );
        }

        // ======================================================
        // PARSE STATUS
        // ======================================================

        // const parsedStatus =
        //   parseCurrentStatus(
        //     data.currentStatus,
        //     data.registrationNumber
        //   );

        console.log(`SUCCESS ${requestNo}`);

        console.log("Data:", data);

        // console.log(
        //   "Parsed status:",
        //   parsedStatus
        // );

        // ======================================================
        // ADD SUCCESS RESULT
        // ======================================================

        results.push({
          requestNo,

          type: normalizedType,

          reportType,

          success: true,

          data,

          // parsedStatus,
        });
      } catch (error) {
        // ======================================================
        // REQUEST FAILED
        // ======================================================

        console.error(`FAILED ${requestNo}:`, error.message);

        results.push({
          requestNo,

          type,

          success: false,

          message: error.message,

          data: null,
        });
      }
    }

    // ==========================================================
    // COMPLETE
    // ==========================================================

    console.log(`\nBatch completed: ${results.length}/${requests.length}`);

    return {
      success: true,

      total: requests.length,

      processed: results.length,

      results,
    };
  } catch (error) {
    console.error("submitRequestNumbers error:", error);

    return {
      success: false,

      total: requests.length,

      processed: results.length,

      results,

      message: error.message,
    };
  } finally {
    // ==========================================================
    // CLOSE BROWSER ONCE
    // ==========================================================

    if (browser) {
      await browser.close();
    }
  }
};

const addRequestToQueue = async (requestNo, requestType) => {
  try {
    const [result] = await pool.query(
      `
      INSERT INTO ver_request_queue
          (request_no, request_type, status)
      VALUES
          (?, ?, 'PENDING')

      ON DUPLICATE KEY UPDATE
          request_type = VALUES(request_type)
      `,
      [requestNo, requestType],
    );

    // Wake worker immediately
    await wakeQueueWorker();

    return {
      success: true,
      requestNo,
      requestType,
      inserted: result.affectedRows === 1,
      message:
        result.affectedRows === 1
          ? "Request added to queue"
          : "Request already exists",
    };
  } catch (error) {
    console.error("addRequestToQueue error:", error);

    return {
      success: false,
      requestNo,
      requestType,
      message: error.message,
    };
  }
};

module.exports = {
  submitRequestNumbers,
  addRequestToQueue,
};

function parseCurrentStatus(current_status, requestNo) {
  const status = current_status.replace(/\s+/g, "");

  console.log("requestNo ", requestNo, " parse status ", status);

  // --------------------------------
  // ALREADY APPROVED
  // --------------------------------
  if (status === "स्वीकृत") {
    return {
      requestNo: requestNo,

      hasPermanentAddress: false,

      pre_policeStationStatus: "",
      pre_dcrbStatus: "",
      pre_liuStatus: "",

      per_policeStationStatus: "",
      per_dcrbStatus: "",
      per_liuStatus: "",

      pre_permanentStatus: null,
      pre_dcpStatus: "स्वीकृत",
    };
  }

  // --------------------------------
  // REJECTED
  // --------------------------------
  if (status.includes("अस्वीकृत-")) {
    return {
      requestNo: requestNo,

      hasPermanentAddress: false,

      pre_policeStationStatus: "",
      pre_dcrbStatus: "",
      pre_liuStatus: "",

      per_policeStationStatus: "",
      per_dcrbStatus: "",
      per_liuStatus: "",

      pre_permanentStatus: null,
      pre_dcpStatus: "अस्वीकृत",
    };
  }

  // --------------------------------
  // CHECK PERMANENT ADDRESS
  // --------------------------------
  const hasPermanentAddress = status.includes("स्थायीपता:-");

  // --------------------------------
  // DCP STATUS
  // --------------------------------
  const lastDashIndex = status.lastIndexOf("-");

  const pre_dcpStatus =
    lastDashIndex !== -1 ? status.substring(lastDashIndex + 1) : "";

  // --------------------------------
  // CURRENT ADDRESS STATUS
  // --------------------------------
  const currentMatch = status.match(/वर्तमानपता:-\((.*?)\)/);

  let pre_policeStationStatus = "";
  let pre_dcrbStatus = "";
  let pre_liuStatus = "";

  if (currentMatch) {
    const currentParts = currentMatch[1].split("/");

    pre_policeStationStatus = currentParts[0] || "";
    pre_dcrbStatus = currentParts[1] || "";
    pre_liuStatus = currentParts[2] || "";
  }

  // --------------------------------
  // PERMANENT ADDRESS STATUS
  // --------------------------------
  let pre_permanentStatus = null;

  let per_policeStationStatus = "";
  let per_dcrbStatus = "";
  let per_liuStatus = "";

  if (hasPermanentAddress) {
    const permanentMatch = status.match(/स्थायीपता:-\((.*?)\)/);

    if (permanentMatch) {
      pre_permanentStatus = permanentMatch[1];

      // Split permanent status by /
      const permanentParts = pre_permanentStatus.split("/");

      per_policeStationStatus = permanentParts[0] || "";

      per_dcrbStatus = permanentParts[1] || "";

      per_liuStatus = permanentParts[2] || "";

      // console.log("स्थायीपता:", pre_permanentStatus);

      // console.log("Permanent Police Station:", per_policeStationStatus);

      // console.log("Permanent DCRB:", per_dcrbStatus);

      // console.log("Permanent LIU:", per_liuStatus);
    }
  }

  // --------------------------------
  // RETURN
  // --------------------------------
  return {
    requestNo: requestNo,

    hasPermanentAddress,

    // वर्तमान पता
    pre_policeStationStatus,
    pre_dcrbStatus,
    pre_liuStatus,

    // स्थायी पता
    per_policeStationStatus,
    per_dcrbStatus,
    per_liuStatus,

    // Complete permanent status
    pre_permanentStatus,

    // DCP
    pre_dcpStatus,
  };
}

let queueTimer = null;
let processing = false;

const MAX_REQUESTS = 100;
const WAIT_TIME = 50 * 1000;

async function wakeQueueWorker() {
  console.log(" you have called inside wakeQueueWorker  ");
  // Don't create multiple timers
  if (processing) {
    return;
  }

  try {
    const [rows] = await pool.query(`
            SELECT
                COUNT(*) AS total,
                MIN(created_at) AS first_created_at
            FROM ver_request_queue
            WHERE status = 'PENDING'
        `);

    const total = Number(rows[0].total);

    // Nothing pending
    if (total === 0) {
      clearQueueTimer();
      return;
    }

    // -----------------------------------------
    // 100 REQUESTS REACHED
    // -----------------------------------------

    if (total >= MAX_REQUESTS) {
      clearQueueTimer();

      await processRequestBatch();

      // Check again because more requests may exist
      await wakeQueueWorker();

      return;
    }

    // -----------------------------------------
    // Calculate oldest request deadline
    // -----------------------------------------

    const firstCreatedAt = new Date(rows[0].first_created_at).getTime();

    const deadline = firstCreatedAt + WAIT_TIME;

    const delay = Math.max(0, deadline - Date.now());

    // -----------------------------------------
    // Already reached 5 minutes
    // -----------------------------------------

    if (delay === 0) {
      clearQueueTimer();

      await processRequestBatch();

      await wakeQueueWorker();

      return;
    }

    // -----------------------------------------
    // Schedule EXACT deadline
    // -----------------------------------------

    scheduleQueueTimer(delay);
  } catch (error) {
    console.error("wakeQueueWorker error:", error);

    // Retry after error
    scheduleQueueTimer(10000);
  }
}

function scheduleQueueTimer(delay) {
  clearQueueTimer();

  console.log(`Next queue check in ${Math.round(delay / 1000)} seconds`);

  queueTimer = setTimeout(async () => {
    queueTimer = null;

    await wakeQueueWorker();
  }, delay);
}

function clearQueueTimer() {
  if (queueTimer) {
    clearTimeout(queueTimer);

    queueTimer = null;
  }
}

async function processRequestBatch() {
  if (processing) {
    console.log("Batch already processing...");
    return;
  }

  processing = true;

  let requests = [];

  try {
    // --------------------------------------------------
    // Get maximum 100 PENDING requests
    // --------------------------------------------------

    const [rows] = await pool.query(
      `
      SELECT
        id,
        request_no,
        request_type,
        created_at
      FROM ver_request_queue
      WHERE status = 'PENDING'
      ORDER BY request_type,created_at ASC
      LIMIT ?
    `,
      [MAX_REQUESTS],
    );

    requests = rows;

    if (requests.length === 0) {
      console.log("No pending requests");
      return;
    }

    const ids = requests.map((row) => row.id);

    console.log(`Starting batch: ${requests.length} requests`);

    // --------------------------------------------------
    // Mark selected records as PROCESSING
    // --------------------------------------------------

    // await pool.query(
    //   `
    //   UPDATE ver_request_queue
    //   SET
    //     status = 'PROCESSING',
    //     processing_started_at = NOW(),
    //     error_message = NULL
    //   WHERE id IN (?)
    //   `,
    //   [ids],
    // );

    // --------------------------------------------------
    // Create array for Puppeteer
    //
    // Example:
    // [
    //   {
    //      request_no: "ABC123",
    //      request_type: "character"
    //   },
    //   {
    //      request_no: "ABC456",
    //      request_type: "tenant"
    //   }
    // ]
    // --------------------------------------------------

    const submitRequests = requests.map((row) => ({
      request_no: row.request_no,
      request_type: row.request_type,
    }));

    console.log("Submitting requests:", submitRequests);

    // --------------------------------------------------
    // PROCESS ENTIRE BATCH
    // Chrome opens once inside submitRequestNumbers()
    // --------------------------------------------------

    const batchResult = await submitRequestNumbers(submitRequests);

    console.log("Batch result:", {
      success: batchResult.success,
      total: batchResult.total,
      processed: batchResult.processed,
    });
    console.log("results ", batchResult.results);

    // --------------------------------------------------
    // Create result lookup
    // requestNo + type is safer than requestNo alone
    // --------------------------------------------------

    const resultMap = new Map();

    for (const result of batchResult.results || []) {
      const key = `${result.requestNo}::${String(result.type || "")
        .trim()
        .toLowerCase()}`;

      resultMap.set(key, result);
    }

    // --------------------------------------------------
    // Update each database request according to result
    // --------------------------------------------------

    for (const request of requests) {
      const key = `${request.request_no}::${String(request.request_type || "")
        .trim()
        .toLowerCase()}`;

      const result = resultMap.get(key);

      // -----------------------------------------------
      // No result returned from Puppeteer
      // -----------------------------------------------

      // if (!result) {
      //   await pool.query(
      //     `
      //     UPDATE ver_request_queue
      //     SET
      //       status = 'FAILED',
      //       completed_at = NOW(),
      //       error_message = ?
      //     WHERE id = ?
      //     `,
      //     ["No result returned from submitRequestNumbers", request.id],
      //   );

      //   continue;
      // }

      // -----------------------------------------------
      // Successfully processed
      // -----------------------------------------------

      // if (result.success) {
      //   await pool.query(
      //     `
      //     UPDATE ver_request_queue
      //     SET
      //       status = 'COMPLETED',
      //       completed_at = NOW(),
      //       error_message = NULL
      //     WHERE id = ?
      //     `,
      //     [request.id],
      //   );

      //   console.log(`COMPLETED: ${request.request_no}`);

      //   continue;
      // }

      // -----------------------------------------------
      // Failed request
      // -----------------------------------------------

      // await pool.query(
      //   `
      //   UPDATE ver_request_queue
      //   SET
      //     status = 'FAILED',
      //     completed_at = NOW(),
      //     error_message = ?
      //   WHERE id = ?
      //   `,
      //   [result.message || "Request processing failed", request.id],
      // );

      console.log(
        `FAILED: ${request.request_no} - ${result.message || "Unknown error"}`,
      );
    }

    console.log(`Batch finished: ${requests.length} requests`);
  } catch (error) {
    console.error("processRequestBatch error:", error);

    // --------------------------------------------------
    // If complete batch-level error occurred,
    // mark still PROCESSING records as FAILED
    // --------------------------------------------------

    if (requests.length > 0) {
      const ids = requests.map((row) => row.id);

      try {
        // await pool.query(
        //   `
        //   UPDATE ver_request_queue
        //   SET
        //     status = 'FAILED',
        //     completed_at = NOW(),
        //     error_message = ?
        //   WHERE id IN (?)
        //   AND status = 'PROCESSING'
        //   `,
        //   [error.message || "Batch processing failed", ids],
        // );
      } catch (updateError) {
        console.error("Failed to update batch status:", updateError);
      }
    }
  } finally {
    processing = false;
  }
}
