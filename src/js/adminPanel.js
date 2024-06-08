//prettier-ignore
import { auth, db, getUserProfile, signOut, collection, onSnapshot, orderBy, query, where, getDocs, } from "./firebaseConfig"
import logo from "../img/Pay-U-Print-Admin-logo.png";
import userPanel from "./userPanel";
import Chart from "chart.js/auto";

class adminPanel extends userPanel {
  _header = `<header class="header panel_user">
  <img
    class="header__login_logo"
    src="${logo}"
    alt="Pay-U-Print Logo"
  />
  <nav class="nav">
    <ul class="nav__list">
      <li><button class="nav__btn upload">Upload</button></li>
      <li><button class="nav__btn analytics">Analytics</button></li>
      <li><button class="nav__btn database">Database</button></li>
      <li><button class="nav__btn history">History</button></li>
      <li><button class="nav__btn logout">Logout</button></li>
    </ul>
  </nav>
</header><main class="main"></main>`;
  constructor(uid, isAdmin) {
    super(uid, isAdmin);

    this.renderHeader();
    this.initAdminData();
  }
  async initAdminData() {
    //get all docs
    const q = query(collection(db, "printForms"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    this.printFormDocs = snapshot.docs.map((doc) => ({
      filepincode: doc.id,
      fileUrl: doc.data().fileURL,
      paperType: doc.data().paperType,
      page: doc.data().page,
      colored: doc.data().colorOption,
      price: doc.data().price,
      status: doc.data().status,
      timestamp: doc.data().timestamp,
    }));
    // await this.initDataActiveDocs()
  }
  generateAnalyticsMarkup() {
    return `  
    <canvas id="totalRevenue"></canvas>
    <canvas id="maxPrintPage"></canvas>
    <canvas id="paperStock"></canvas>
    <canvas id="userSubmitToPrinted"></canvas>
    `;
  }
  // fetchMonthDisplayData(month, year) {
  //   // Helper function to format the date as MM-DD-YYYY
  //   const formatDate = (date) => {
  //     const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  //     const dd = String(date.getDate()).padStart(2, "0");
  //     const yyyy = date.getFullYear();
  //     return `${mm}-${dd}-${yyyy}`;
  //   };

  //   // Get the first and last day of the specified month
  //   const startOfMonth = new Date(year, month - 1, 1);
  //   const endOfMonth = new Date(year, month, 0);

  //   // Generate all days for the specified month
  //   let allDays = [];
  //   for (let d = startOfMonth; d <= endOfMonth; d.setDate(d.getDate() + 1)) {
  //     allDays.push(formatDate(new Date(d)));
  //   }

  //   // Return all days in reverse order (past to present)
  //   return allDays;
  // }
  fetchUserSubmitFormToPrinted() {
    const totalSubmission = this.printFormDocs
      .filter((doc) => doc.status === "Unpaid")
      .reduce((acc, doc) => {
        // Extract date from timestamp
        const date = this.formatTimeStamp(doc.timestamp);
        // Sum prices for each date
        acc[date] = (acc[date] || 0) + doc.price;
        return acc;
      }, {});
    const totalPrinted = this.printFormDocs
      .filter((doc) => doc.status === "paid")
      .reduce((acc, doc) => {
        // Extract date from timestamp
        const date = this.formatTimeStamp(doc.timestamp);
        // Sum prices for each date
        acc[date] = (acc[date] || 0) + doc.price;
        return acc;
      }, {});
    return [totalSubmission, totalPrinted];
  }
  fetchPerDayTotalRevenue(reqData) {
    const totalRevenuePerDay = this.printFormDocs
      .filter((doc) => doc.status === "paid")
      .reduce((acc, doc) => {
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
      sortedData[key] = totalRevenuePerDay[key];
    });
    // Update totalRevenuePerDay with sorted data
    // Step 4: Convert data object to arrays for Chart.js
    this.daysData = Object.keys(sortedData);
    return Object.values(sortedData);
  }
  fetchPerDayTotalRevenuePaperType(reqData) {
    const totalPricePerDayPaperType = this.printFormDocs
      .filter((doc) => doc.status === "paid" && doc.paperType === reqData)
      .reduce((acc, doc) => {
        // Extract date from timestamp
        const date = this.formatTimeStamp(doc.timestamp);
        // Sum prices for each date
        acc[date] = (acc[date] || 0) + doc.price;
        return acc;
      }, {});
    return totalPricePerDayPaperType;
  }
  async renderAnalytics() {
    document.body.children[1].innerHTML = this.generateAnalyticsMarkup();

    //NOTE: for page DATA
    const totalPerDayPrice = this.fetchPerDayTotalRevenue("price");
    const totalPerDayPageShort = this.fetchPerDayTotalRevenuePaperType("short");
    const totalPerDayPageLong = this.fetchPerDayTotalRevenuePaperType("long");
    const totalPerDayPageA4 = this.fetchPerDayTotalRevenuePaperType("a4");
    const printsRemainingBlack =
      this.printer.maxBWpage - this.printer.printedBlack;
    const printsRemainingColored =
      this.printer.maxColoredpage - this.printer.printedColored;
    //RENDER
    const ctxTotalRevenue = document
      .getElementById("totalRevenue")
      .getContext("2d");
    const ctxMaxPrint = document
      .getElementById("maxPrintPage")
      .getContext("2d");
    const ctxPaperStock = document
      .getElementById("paperStock")
      .getContext("2d");
    //CHART TOTAL REVENUE
    new Chart(ctxTotalRevenue, {
      type: "line",
      data: {
        labels: this.daysData,
        datasets: [
          {
            label: "Total Revenue",
            data: totalPerDayPrice,
            borderColor: "blue",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointBackgroundColor: "blue",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "blue",
          },
          {
            label: "Total Revenue Short",
            data: totalPerDayPageShort,
            borderColor: "green",
            backgroundColor: "transparent",
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
            backgroundColor: "transparent",
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
            backgroundColor: "transparent",
            borderWidth: 2,
            pointBackgroundColor: "red",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "red",
          },
        ],
      },
    });
    //CHART MAX PRINT
    new Chart(ctxMaxPrint, {
      type: "bar",
      data: {
        labels: ["Prints Remaining Black", "Prints Remaining Colored"],
        datasets: [
          {
            data: [printsRemainingBlack, printsRemainingColored],
            backgroundColor: ["Black", "rgba(255, 99, 132, 0.5)"],
            borderColor: ["Black", "rgba(255, 99, 132, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false, // Hide legend
          },
        },
      },
    });
    //CHART MAX PRINT
    new Chart(ctxPaperStock, {
      type: "bar",
      data: {
        labels: [
          "Short Paper Remaining",
          "Long Paper Remaining",
          "A4 Paper Remaining",
        ],
        datasets: [
          {
            data: [
              this.printer.stockShort,
              this.printer.stockLong,
              this.printer.stockA4,
            ],
            backgroundColor: [
              "orange",
              "rgba(255, 99, 132, 0.5)",
              "rgba(54, 162, 235, 0.5)",
            ],
            borderColor: [
              "orange",
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false, // Hide legend
          },
        },
      },
    });
  }

  //get all pages per day
  //get all files submit per day
  //display pie chart filesubmission to filePrinted
  renderHeader() {
    document.body.innerHTML = this._header;
    this._parentEl = document.querySelector(".main");
    this.addAdminHeaderListeners();
  }
  addAdminHeaderListeners() {
    super.addHeaderListeners();
    const analytics = document.querySelector(".analytics");
    const database = document.querySelector(".database");

    analytics.addEventListener("click", async () => {
      this.renderSpinner(document.body.children[1]);
      await this.renderAnalytics();
      console.log(`hello wasdorld!`);
    });
    database.addEventListener("click", async () => {
      this.renderSpinner(document.body.children[1]);
      await this.renderDB();
    });
  }
  generateDBMarkup(data) {
    const trows = data
      .map(
        (data) =>
          `<tr>
        <td class="center-text text-overflow">${data.filepincode}</td>
        <td class="center-text">${this.formatTimeStamp(data.timestamp)} </td>
        <td class="center-text">${data.status}</td>
        <td class="center-text">₱${data.price.toFixed(2)}</td>
        <td class="center-text capitalize">${data.paperType}</td>
        <td class="center-text">${data.page}</td>
        <td class="center-text capitalize">${data.colored}</td>
        <td class="center-text text-overflow">${data.fileUrl}</td>
        </tr>`
      )
      .join("");
    return `
    <div class="container table-container">
  <table id="data-table">
    <thead>
      <tr>
      <th class="center-text">File PIN Code</th>
      <th class="center-text">Timestamp</th>
      <th class="center-text">Status</th>
      <th class="center-text">Price</th>
      <th class="center-text">Paper Size</th>
      <th class="center-text">Pages</th>
      <th class="center-text">Print Color</th>
      <th class="center-text">File URL</th>
      </tr>
    </thead>
    <tbody>
      ${trows}
    </tbody>
  </table>
</div>
<!--<div id="pagination">
  <button id="prevPage">Previous</button>
  <span id="currentPage">1</span>
  <button id="nextPage">Next</button>
</div> -->`;
  }

  async renderDB() {
    document.body.children[1].innerHTML = this.generateDBMarkup(
      this.printFormDocs
    );
    // await this.renderDBListener();
  }
  //BUG:split renderdb admin controls so can loop db table
  // async renderDBListener() {
  //   // const deleteDoc = document.querySelector(".deleteDoc");
  //   // const searchUserDoc = document.querySelector(".searchUserDoc");
  //   // const userTopupForm = document.querySelector(".topup");
  //   // const statusText = document.querySelector(".statusText");
  //   // BUG: db tab refreshing when click
  //   // deleteDoc.addEventListener("click", async () => {
  //   //   const uidDoc = deleteDoc.value;
  //   //   try {
  //   //     const docRef = doc(db, "printForms", uidDoc);
  //   //     await deleteDoc(docRef);
  //   //     this.renderDB(); //BUG:
  //   //   } catch (e) {
  //   //     alert(e);
  //   //   }
  //   // });
  //   // searchUserDoc.addEventListener("click", async () => {
  //   //   const uidUser = searchUserDoc.value;
  //   //   try {
  //   //     const docRef = doc(db, "printForms", uidDoc);
  //   //     await deleteDoc(docRef);
  //   //   } catch (e) {
  //   //     alert(e);
  //   //   }
  //   // });
  //   // userTopupForm.addEventListener("submit", async (e) => {
  //   //   try {
  //   //     e.preventDefault();
  //   //     const uidDoc = userTopupForm.userTopup.value;
  //   //     const value = userTopupForm.topupValue.value;
  //   //     const user = await getUserProfile(uidDoc);
  //   //     console.log(user);
  //   //     const docRef = doc(db, "users", uidDoc);
  //   //     await updateDoc(docRef, {
  //   //       wallet: user.wallet + Number(value),
  //   //     });
  //   //     statusText.textContent = "Top-up Successful!";
  //   //   } catch (e) {
  //   //     alert(e);
  //   //   }
  //   // });
  // }
}
// addHeaderListeners() {
//   const upload = document.querySelector(".upload");
//   const analytics = document.querySelector(".analytics");
//   const database = document.querySelector(".database");
//   const history = document.querySelector(".history");
//   const logout = document.querySelector(".logout");
//   upload.addEventListener("click", async () => {
//     this.renderSpinner(document.body.children[1]);
//     this._userProfile = await getUserProfile(auth.currentUser.uid);
//     this.renderPrintForm(this._userProfile);
//   });
//   history.addEventListener("click", async () => {
//     this.renderSpinner(document.body.children[1]);
//     this._userProfile = await getUserProfile(auth.currentUser.uid);
//     await this.renderHistory(this._userProfile);
//   });
//   logout.addEventListener("click", async () => {
//     try {
//       userSignOut();
//     } catch (e) {
//       alert(e);
//     }
//   });
// }

export default adminPanel;

{
  /* <div class="admin__controls">
    <div class="admin__control">
      <div class="admin__control_name">
        <label for="userTopup">Top-up:</label>
      </div>
      <div class="admin__control_input">
        <form class="topup">
          <input
          type="text"
          name="userTopup"
          id="userTopup"
          placeholder="User ID"
          required
        />
        <input type="number" name="topupValue" required placeholder="peso">
        <button class="btn userTopup">Top-up</button>
        </form>
      </div>
      <div class="admin__control_btn">
      </div>
    </div>
  </div>
<div class="statusText">This is Error!</div>
     */
}
