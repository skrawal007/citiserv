const puppeteer = require("puppeteer");

const submitRequestNumber = async (requestNo) => {
  let browser;

  try {
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

    await page.goto(
      "https://cctnsup.gov.in/citizenportal/CitizenVerification.aspx",
      {
        waitUntil: "networkidle2",
        timeout: 60000,
      },
    );

    // Enter request number
    await page.waitForSelector("#txtServiceNo", {
      timeout: 30000,
    });

    await page.type("#txtServiceNo", String(requestNo));

    // Submit
    await page.click("#btnSearchFir");

    // Wait for result table
    await page.waitForSelector("#gdvdata", {
      timeout: 60000,
    });

    // Extract table data
    const result = await page.$eval("#gdvdata", (table) => {
      const rows = [...table.querySelectorAll("tr")];

      if (rows.length < 2) {
        return null;
      }

      const headers = [...rows[0].querySelectorAll("th")].map((th) =>
        th.innerText.trim(),
      );

      const dataRows = rows.slice(1).map((row) => {
        const cells = [...row.querySelectorAll("td")].map((td) =>
          td.innerText.trim(),
        );

        return {
          registrationNumber: cells[0] || "",
          currentStatus: cells[1] || "",
          district: cells[2] || "",
          policeStation: cells[3] || "",
          applicationDate: cells[4] || "",
          name: cells[5] || "",
          address: cells[6] || "",
        };
      });

      return {
        headers,
        rows: dataRows,
      };
    });

    console.log(
      "parseCurrentStatus ",
      parseCurrentStatus(result.rows[0].currentStatus,result.rows[0].registrationNumber),
    );

    if (!result || result.rows.length === 0) {
      return {
        success: false,
        requestNo,
        message: "No record found",
        data: null,
      };
    }

    return {
      success: true,
      requestNo,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("submitRequestNumber error:", error);

    return {
      success: false,
      requestNo,
      message: error.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  submitRequestNumber,
};

function parseCurrentStatus(current_status, requestNo) {
  
  
  const status = current_status.replace(/\s+/g, "");

    console.log("requestNo ", requestNo," parse status ", status )

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
      requestNo : requestNo,

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
