import Chart from "chart.js/auto";
import {
  getAllPrintForms,
  getPrinterConfig,
  updatePropertyInAllDocs,
  addDataAnalytics,
  loop100times,
  getAllAnalyticsForms,
  getAllIssueForms,
} from "./firebaseConfig";

class PrinterAnalytics {
  constructor(printerName) {
    this.initAdminData(printerName);
  }
  async initAdminData(printerName) {
    //get printer config
    this.printer = await getPrinterConfig(printerName);
    console.log(this.printer);
    //get all docs
    this.allAnalyticsForms = await getAllAnalyticsForms();
    this.allPrintForms = await getAllPrintForms();
    this.allIssueForms = await getAllIssueForms();
    // this.allIssuesForms = await getAllIssuesForms();

    console.log(this.allAnalyticsForms);
    console.log(this.allPrintForms);
    console.log(this.allIssueForms);
    this.runData();
    this.runLiveOrders();
    this.runPrintData();
    this.runIssueData();
    // this.seeData = loop100times();
    // await addDataAnalytics();
    // this.asd();
    // await updatePropertyInAllDocs();
  }
  // asd() {
  //   console.log(this.seeData);
  //   for (const data of this.seeData) {
  //     console.log(data.timestamp);
  //     console.log(this.formatTimeStamp(data.timestamp));
  //   }
  // }
  runIssueData() {
    const rowData = this.allIssueForms
      .map(
        (doc) => `
    <tr>
    <td class="time">${this.formatTimeStamp(doc.timestamp)}</td>
    <td class="category">${doc.category}</td>
    <td class="issue">${doc.issue}</td>
    </tr>
    `
      )
      .join("");
    const parentElem = document.querySelector(".liveIssues");
    parentElem.insertAdjacentHTML("beforeend", rowData);
  }
  runPrintData() {
    //prettier-ignore
    //data for paper stocks
    document.querySelector("#short").innerHTML = `${this.printer.stockShort}/250`;
    document.querySelector("#long").innerHTML = `${this.printer.stockLong}/250`;
    document.querySelector("#a4").innerHTML = `${this.printer.stockA4}/250`;
    document.querySelector("#totalstocks").innerHTML = `${
      this.printer.stockA4 + this.printer.stockShort + this.printer.stockLong
    }/750`;
    //data for ink level
    document.querySelector("#ink-Black").innerHTML = `${
      this.printer.maxBWpage - this.printer.printedBlack
    }/${this.printer.maxBWpage}`;
    document.querySelector("#ink-Colored").innerHTML = `${
      this.printer.maxColoredpage - this.printer.printedColored
    }/${this.printer.maxColoredpage}`;
  }
  runLiveOrders() {
    const rowData = this.allPrintForms
      .map(
        (doc) => `
      <tr>
      <td class="pincode">${doc.filepincode}</td>
      <td class="price">₱${doc.price}</td>
      <td class="fileUrl">${doc.fileUrl}</td>
      </tr>
      `
      )
      .join("");

    const parentElem = document.querySelector(".liveOrders");
    parentElem.insertAdjacentHTML("beforeend", rowData);
  }
  runData() {
    //data for paper size preference in percentage
    const [totalShort, totalLong, totalA4] =
      this.fetchSizePreferencePaperType();
    console.log(`my paper percentage!`);
    console.log(totalShort);
    // fetching sales data
    const totalPerDayPrice = this.fetchPerDayTotalRevenue("price");
    const totalPerDayPageShort = this.fetchPerDayTotalRevenuePaperType("short");
    const totalPerDayPageLong = this.fetchPerDayTotalRevenuePaperType("long");
    const totalPerDayPageA4 = this.fetchPerDayTotalRevenuePaperType("a4");
    const ctxSizePreference = document
      .getElementById("sizePreference")
      .getContext("2d");
    new Chart(ctxSizePreference, {
      type: "pie",
      data: {
        labels: ["Short", "Long", "A4"],
        datasets: [
          {
            label: "Size Preference",
            data: [totalShort, totalLong, totalA4],
            backgroundColor: [
              "rgb(255, 99, 132)",
              "rgb(54, 162, 235)",
              "rgb(255, 205, 86)",
            ],
            hoverOffset: 4,
          },
        ],
      },
    });
    const ctxTotalRevenue = document
      .getElementById("totalRevenue")
      .getContext("2d");
    new Chart(ctxTotalRevenue, {
      type: "bar",
      data: {
        labels: this.daysData,
        datasets: [
          {
            label: "Total Revenue Short",
            data: totalPerDayPageShort,
            borderColor: "green",
            backgroundColor: "green",
            borderWidth: 2,
            pointBackgroundColor: "green",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "green",
          },
          {
            label: "Total Revenue Long",
            data: totalPerDayPageLong,
            borderColor: "yellow",
            backgroundColor: "yellow",
            borderWidth: 2,
            pointBackgroundColor: "yellow",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "yellow",
          },
          {
            label: "Total Revenue A4",
            data: totalPerDayPageA4,
            borderColor: "red",
            backgroundColor: "red",
            borderWidth: 2,
            pointBackgroundColor: "red",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "red",
          },
          {
            label: "Total Revenue",
            data: totalPerDayPrice,
            borderColor: "blue",
            backgroundColor: "blue",
            borderWidth: 2,
            pointBackgroundColor: "blue",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "blue",
          },
        ],
      },
    });
  }
  fetchSizePreferencePaperType() {
    const TotalpaperTypeShort = this.allAnalyticsForms.filter(
      (doc) => doc.paperType === "short"
      // new Date(this.formatTimeStamp(doc.timestamp)) > new Date("2024-06-01")
    );
    const TotalpaperTypeLong = this.allAnalyticsForms.filter(
      (doc) => doc.paperType === "long"
      // new Date(this.formatTimeStamp(doc.timestamp)) > new Date("2024-06-01")
    );
    const TotalpaperTypeA4 = this.allAnalyticsForms.filter(
      (doc) => doc.paperType === "a4"
      // new Date(this.formatTimeStamp(doc.timestamp)) > new Date("2024-06-01")
    );
    const totalShortpercentage = (
      (TotalpaperTypeShort.length / this.allAnalyticsForms.length) *
      100
    ).toFixed(2);
    const totalLongpercentage = (
      (TotalpaperTypeLong.length / this.allAnalyticsForms.length) *
      100
    ).toFixed(2);
    const totalA4percentage = (
      (TotalpaperTypeA4.length / this.allAnalyticsForms.length) *
      100
    ).toFixed(2);
    return [totalShortpercentage, totalLongpercentage, totalA4percentage];
  }
  fetchPerDayTotalRevenuePaperType(reqData) {
    const totalPricePerDayPaperType = this.allAnalyticsForms
      .filter(
        (doc) => doc.paperType === reqData
        // new Date(this.formatTimeStamp(doc.timestamp)) > new Date("2024-06-01")
      )
      .reduce((acc, doc) => {
        const date = this.formatTimeStamp(doc.timestamp);
        acc[date] = (acc[date] || 0) + doc.price;
        return acc;
      }, {});
    return totalPricePerDayPaperType;
  }
  fetchPerDayTotalRevenue(reqData) {
    const totalRevenuePerDay = this.allAnalyticsForms.reduce((acc, doc) => {
      // Extract date from timestamp
      const date = this.formatTimeStamp(doc.timestamp);
      // Sum prices for each date
      acc[date] = (acc[date] || 0) + doc[reqData];
      return acc;
    }, {});
    // Sort the data by date in ascending order
    const sortedKeys = Object.keys(totalRevenuePerDay).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    const sortedData = {};
    sortedKeys.forEach((key) => {
      console.log(key);

      sortedData[key] = totalRevenuePerDay[key];
    });
    // Update totalRevenuePerDay with sorted data
    // Step 4: Convert data object to arrays for Chart.js
    this.daysData = Object.keys(sortedData);
    console.log(this.daysData);
    return Object.values(sortedData);
  }
  formatTimeStamp(timestamp) {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    const formattedDate =
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" + // Months are 0-based
      String(date.getDate()).padStart(2, "0") +
      "-" +
      date.getFullYear();
    return formattedDate;
  }
}
async function init() {}

new PrinterAnalytics("printer1");
