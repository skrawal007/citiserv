const puppeteer = require("puppeteer");
const { pool } = require("../database/db");
const sse = require("./sseBroadcast");
const mysql = require("mysql2/promise");

const { ver_status, STATUS_MAP } = require("../database/status_map");

let queueTimer = null;
let processing = false;

const MAX_REQUESTS = 100;
const WAIT_TIME = 10 * 1000;

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

      headless: true,
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

        const { pre_Current_Status, per_Current_Status } = parseCurrentStatus(
          cells[1],
        );


        const data = {
          registrationNumber: cells[0] || "",

          currentStatus: cells[1].replace(/\s+/g, "") || "",

          pre_Current_Status: pre_Current_Status,

          per_Current_Status: per_Current_Status,

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
        // ADD SUCCESS RESULT
        // ======================================================

        results.push({
          requestNo,

          type: normalizedType,

          reportType,

          success: true,

          data,
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

    console.log(results);


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

function parseCurrentStatus(current_status) {
  const status = current_status.replace(/\s+/g, "");


  // ==========================================
  // STATUS
  // ==========================================

  let pre_Current_Status = null;
  let per_Current_Status = null;

  if (!status.includes("स्थायीपता")) {
    pre_Current_Status = getStatusCode(status);
  } else {
    const { presentAddress, permanentAddress } = getSepareteStatus(status);

    pre_Current_Status = getStatusCode(presentAddress);

    per_Current_Status = getStatusCode(permanentAddress);
  }


  // --------------------------------
  // ALREADY APPROVED
  // --------------------------------
  if (status === "स्वीकृत") {
    return {
      pre_Current_Status: ver_status["स्वीकृत"],
      per_Current_Status: "",
    };
  }

  // --------------------------------
  // REJECTED
  // --------------------------------
  if (status.includes("अस्वीकृत-")) {
    return {
      pre_Current_Status: ver_status["अस्वीकृत"],
      per_Current_Status: "",
    };
  }

  // --------------------------------
  // RETURN
  // --------------------------------
  return {
    pre_Current_Status: pre_Current_Status,
    per_Current_Status: per_Current_Status,
  };
}

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
      ORDER BY request_type, created_at ASC
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

    await pool.query(
      `
      UPDATE ver_request_queue
      SET
        status = 'PROCESSING',
        processing_started_at = NOW(),
        error_message = NULL
      WHERE id IN (${ids.map(() => "?").join(",")})
      `,
      ids,
    );

    // --------------------------------------------------
    // Notify clients
    // --------------------------------------------------

    for (const row of requests) {
      sse.broadcast("queue:processing", {
        request_number: String(row.request_no),
        type: row.request_type,
        status: "PROCESSING",
      });
    }

    // --------------------------------------------------
    // Create Puppeteer batch
    // --------------------------------------------------

    const submitRequests = requests.map((row) => ({
      request_no: row.request_no,
      request_type: row.request_type,
    }));

    console.log("Submitting requests:", submitRequests);

    // --------------------------------------------------
    // PROCESS ENTIRE BATCH
    // --------------------------------------------------

    const batchResult = await submitRequestNumbers(submitRequests);

    console.log("Batch result:", {
      success: batchResult.success,
      total: batchResult.total,
      processed: batchResult.processed,
    });

    // console.log("results ", batchResult.results);

    // ==================================================
    // Create result lookup
    // ==================================================

    const resultMap = new Map();

    for (const result of batchResult.results || []) {
      const key = `${String(result.requestNo || "").trim()}::${String(
        result.type || "",
      )
        .trim()
        .toLowerCase()}`;

      resultMap.set(key, result);
    }

    // ==================================================
    // BULK UPDATE ver_request_queue
    // ==================================================
    const statusCase = [];
    const statusValueCase = [];
    const preStatusCase = [];
    const perStatusCase = [];
    const errorCase = [];

    const statusParams = [];
    const statusValueParams = [];
    const preStatusParams = [];
    const perStatusParams = [];
    const errorParams = [];
    const whereParts = []; 
    const whereParams = [];

    for (const request of requests) {
      const key = `${String(request.request_no).trim()}::${String(
        request.request_type || "",
      )
        .trim()
        .toLowerCase()}`;

      const result = resultMap.get(key);

      if (!result) {
        const errorMessage = "No result returned from submitRequestNumbers";
        statusCase.push(`WHEN id = ? THEN 'FAILED'`);
        statusParams.push(request.id);
        statusValueCase.push(`WHEN id = ? THEN ?`);
        statusValueParams.push(request.id, null);
        preStatusCase.push(`WHEN id = ? THEN ?`);
        preStatusParams.push(request.id, null);
        perStatusCase.push(`WHEN id = ? THEN ?`);
        perStatusParams.push(request.id, null);
        errorCase.push(`WHEN id = ? THEN ?`);
        errorParams.push(request.id, errorMessage);
        whereParts.push(`id = ?`);
        whereParams.push(request.id);
        continue;
      }

      if (result.success) {
        const active_status = result.data?.currentStatus || null;
        const active_pre_status = result.data?.pre_Current_Status || null;
        const active_per_status = result.data?.per_Current_Status || null;

        statusCase.push(`WHEN id = ? THEN 'COMPLETED'`);
        statusParams.push(request.id);
        statusValueCase.push(`WHEN id = ? THEN ?`);
        statusValueParams.push(request.id, active_status);
        preStatusCase.push(`WHEN id = ? THEN ?`);
        preStatusParams.push(request.id, active_pre_status);
        perStatusCase.push(`WHEN id = ? THEN ?`);
        perStatusParams.push(request.id, active_per_status);
        errorCase.push(`WHEN id = ? THEN NULL`);
        errorParams.push(request.id);
        whereParts.push(`id = ?`);
        whereParams.push(request.id);
        continue;
      }

      const errorMessage = result.message || "Request processing failed";
      const active_status = result.data?.currentStatus || null;
      const active_pre_status = result.data?.pre_Current_Status || null;
      const active_per_status = result.data?.per_Current_Status || null;

      statusCase.push(`WHEN id = ? THEN 'FAILED'`);
      statusParams.push(request.id);
      statusValueCase.push(`WHEN id = ? THEN ?`);
      statusValueParams.push(request.id, active_status);
      preStatusCase.push(`WHEN id = ? THEN ?`);
      preStatusParams.push(request.id, active_pre_status);
      perStatusCase.push(`WHEN id = ? THEN ?`);
      perStatusParams.push(request.id, active_per_status);
      errorCase.push(`WHEN id = ? THEN ?`);
      errorParams.push(request.id, errorMessage);
      whereParts.push(`id = ?`);
      whereParams.push(request.id);
    }

    if (whereParts.length > 0) {
      const sql = `
        UPDATE ver_request_queue
        SET
          status = CASE ${statusCase.join("\n")} ELSE status END,
          active_status = CASE ${statusValueCase.join("\n")} ELSE active_status END,
          active_pre_status = CASE ${preStatusCase.join("\n")} ELSE active_pre_status END,
          active_per_status = CASE ${perStatusCase.join("\n")} ELSE active_per_status END,
          completed_at = NOW(),
          error_message = CASE ${errorCase.join("\n")} ELSE error_message END
        WHERE ${whereParts.join(" OR ")}
      `;
      const params = [...statusParams, ...statusValueParams, ...preStatusParams, ...perStatusParams, ...errorParams, ...whereParams];
      await pool.query(sql, params);
    }

    // ==================================================
    // FIND SUCCESSFULLY COMPLETED REQUESTS
    // ==================================================
    const completedRequests = [];
    for (const request of requests) {
      const key = `${String(request.request_no).trim()}::${String(request.request_type || "").trim().toLowerCase()}`;
      const result = resultMap.get(key);
      if (result?.success) {
        completedRequests.push({ id: request.id, request_no: request.request_no, request_type: request.request_type, result, data: result.data || null });
      }
    }

    // ==================================================
    // UPDATE DESTINATION TABLES
    // ==================================================
    let updatedDestinationRequests = [];
    if (completedRequests.length > 0) {
      updatedDestinationRequests = await updateCompletedVerificationRecords(completedRequests);
    }

    // ==================================================
    // DELETE ONLY SUCCESSFULLY UPDATED REQUESTS
    // ==================================================
    if (updatedDestinationRequests.length > 0) {
      const deleteIds = updatedDestinationRequests.map((item) => item.id);
      // await pool.query(`DELETE FROM ver_request_queue WHERE id IN (${deleteIds.map(() => "?").join(",")}) AND status = 'COMPLETED'`, deleteIds);
    }

    // ==================================================
    // SSE NOTIFICATIONS
    // ==================================================
    for (const request of requests) {
      const key = `${String(request.request_no).trim()}::${String(request.request_type || "").trim().toLowerCase()}`;
      const result = resultMap.get(key);
      if (!result) {
        sse.broadcast("queue:failed", { request_number: String(request.request_no), type: request.request_type, status: "FAILED", message: "No result" });
        continue;
      }
      if (result.success) {
        sse.broadcast("queue:completed", { request_number: String(request.request_no), type: result.type, status: "COMPLETED", active_status: result.data?.currentStatus || null });
      } else {
        sse.broadcast("queue:failed", { request_number: String(request.request_no), type: request.request_type, status: "FAILED", message: result.message, active_status: result.data?.currentStatus || null });
      }
    }

  } catch (error) {
    console.error("processRequestBatch error:", error);

    // --------------------------------------------------
    // Batch-level error: mark any stuck PROCESSING records
    // as FAILED so they are not permanently stuck
    // --------------------------------------------------
    if (requests.length > 0) {
      const failIds = requests.map((row) => row.id);

      try {
        await pool.query(
          `
          UPDATE ver_request_queue
          SET
            status = 'FAILED',
            error_message = ?,
            completed_at = NOW()
          WHERE id IN (${failIds.map(() => "?").join(",")})
            AND status = 'PROCESSING'
          `,
          [error.message, ...failIds],
        );

        console.log(`Marked ${failIds.length} stuck PROCESSING records as FAILED`);
      } catch (updateError) {
        console.error("Failed to mark batch as FAILED:", updateError);
      }

      // Notify clients of failure
      for (const req of requests) {
        sse.broadcast("queue:failed", {
          request_number: String(req.request_no),
          type: req.request_type,
          status: "FAILED",
          message: error.message,
        });
      }
    }
  } finally {
    processing = false;
  }
}

function getStatusCode(statusText) {
  let cleanedStatus = statusText.replace(/\s+/g, "").trim();
  if (
    statusText.includes("वर्तमानपता:-") ||
    statusText.includes("स्थायीपता:-")
  ) {
    cleanedStatus = statusText
      .replace(/वर्तमानपता\s*:-/g, "")
      .replace(/स्थायीपता\s*:-/g, "")
      .trim();
  }
  if (!cleanedStatus) {
    return "";
  }
  return STATUS_MAP[cleanedStatus] || "ok";
}

function getSepareteStatus(text) {
  const parts = text.split("-");
  // console.log("parts length  ", parts.length);
  // console.log("part[1]", parts[1]);
  // console.log("part[2]", parts[2]);
  // console.log("part[3]", parts[3]);
  // console.log("part[4]", parts[4]);
  // console.log("part[5]", parts[5]);
  if (parts.length < 4) {
    return {
      presentAddress: "",
      permanentAddress: "",
    };
  }

  const presentAddress = `${parts[1]}-${parts[4]}`;

  const permanentAddress = `${parts[3]}`;

  // console.log(" premanentAddress : ", presentAddress);
  // console.log(" permanentAddress : ", permanentAddress)
  return {
    presentAddress,
    permanentAddress,
  };
}



const VERIFICATION_TABLES = {
  character: "characters",
  tenant: "tenants",
  employee: "employees",
  domestic: "domestic",
};

/**
 * Bulk update destination tables for successfully completed requests.
 *
 * IMPORTANT:
 * Adjust the destination column names below if your actual tables
 * use different column names.
 */
async function updateCompletedVerificationRecords(completedRequests) {

  console.log(" completedRequests ", completedRequests );
  if (!completedRequests || completedRequests.length === 0) {
    console.log("No completed requests to update in destination tables.");
    return [];
  }

  const updatedRequests = [];

  // --------------------------------------------------
  // Group completed requests by request type
  // --------------------------------------------------

  const grouped = {};

  for (const item of completedRequests) {
    const type = String(item.request_type || "")
      .trim()
      .toLowerCase();

    if (!VERIFICATION_TABLES[type]) {
      console.warn(
        `Unknown verification type: ${type} | request: ${item.request_no}`,
      );
      continue;
    }

    if (!grouped[type]) {
      grouped[type] = [];
    }

    grouped[type].push(item);
  }

  // --------------------------------------------------
  // Update each destination table in bulk
  // --------------------------------------------------

  for (const [type, records] of Object.entries(grouped)) {
    const tableName = VERIFICATION_TABLES[type];

    if (!records.length) {
      continue;
    }

    const currentStatusCase = [];
    const preStatusCase = [];
    const perStatusCase = [];

    // Use SEPARATE param arrays for each CASE block so they can be
    // concatenated in the correct order that matches the SQL structure:
    //   all currentStatusCase params → all preStatusCase params → all perStatusCase params → WHERE IN params
    // Mixing them into one flat array interleaved by record caused a bind-
    // parameter mismatch when processing multiple requests at once.
    const currentStatusParams = [];
    const preStatusParams = [];
    const perStatusParams = [];
    const requestNumbers = [];

    for (const record of records) {
      const requestNo = String(record.request_no).trim();

      requestNumbers.push(requestNo);

      const currentStatus =
        record.result?.data?.currentStatus ??
        record.data?.currentStatus ??
        null;

      const preStatus =
        record.result?.data?.pre_Current_Status ??
        record.data?.pre_Current_Status ??
        null;

      const perStatus =
        record.result?.data?.per_Current_Status ??
        record.data?.per_Current_Status ??
        null;

      // -----------------------------------------------
      // Determine if this request has a terminal status
      // (APPROVED or REJECTED) from ver_request_queue.
      //
      // When terminal, per_Current_Status is only updated
      // when the row's per_station_code differs from
      // pre_station_code (cross-station request).
      // Same-station rows keep their existing per_Current_Status.
      // -----------------------------------------------

      const isTerminalStatus = preStatus === "APPROVED" || preStatus === "REJECTED";

      // -----------------------------------------------
      // current status  (always update)
      // -----------------------------------------------

      currentStatusCase.push(`WHEN request_number = ? THEN ?`);
      currentStatusParams.push(requestNo, currentStatus);

      // -----------------------------------------------
      // present address status  (always update)
      // -----------------------------------------------

      preStatusCase.push(`WHEN request_number = ? THEN ?`);
      preStatusParams.push(requestNo, preStatus);

      // -----------------------------------------------
      // permanent address status
      //
      // APPROVED / REJECTED  →  only update when the
      //   row's per_station_code differs from pre_station_code
      //   (cross-station request). Same-station rows are
      //   skipped (ELSE per_Current_Status).
      //
      // All other statuses   →  always update (existing logic).
      // -----------------------------------------------

      if (isTerminalStatus) {
        perStatusCase.push(
          `WHEN request_number = ? AND per_station_code <> pre_station_code THEN ?`
        );
      } else {
        perStatusCase.push(`WHEN request_number = ? THEN ?`);
      }
      perStatusParams.push(requestNo, perStatus);
    }

    // Assemble final params in the exact order MySQL expects them:
    // CASE 1 binds, CASE 2 binds, CASE 3 binds, WHERE IN binds.
    const params = [
      ...currentStatusParams,
      ...preStatusParams,
      ...perStatusParams,
    ];

    const placeholders = requestNumbers.map(() => "?").join(",");

    const sql = `
      UPDATE ${tableName}
      SET
        Current_Status = CASE
          ${currentStatusCase.join("\n          ")}
          ELSE Current_Status
        END,

        pre_Current_Status = CASE
          ${preStatusCase.join("\n          ")}
          ELSE pre_Current_Status
        END,

        per_Current_Status = CASE
          ${perStatusCase.join("\n          ")}
          ELSE per_Current_Status
        END,

        status_update_time = NOW(),

        updated_at = NOW()

      WHERE request_number IN (${placeholders})
    `;

    params.push(...requestNumbers);

    console.log(
      `Updating ${records.length} completed requests in ${tableName}`,
    );

    const [result] = await pool.query(sql, params);

    console.log(
      `${tableName}: matched=${result.affectedRows}`,
    );

    // --------------------------------------------------
    // Keep only requests that were actually updated
    // --------------------------------------------------

    for (const record of records) {
      updatedRequests.push({
        id: record.id,
        request_no: record.request_no,
        request_type: record.request_type,
      });
    }
  }

  return updatedRequests;
}