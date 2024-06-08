import logo from "../img/Pay-U-Print-logo.png";
import Panel from "./Panel";
//prettier-ignore
import { auth, db, getUserProfile, signOut, collection, onSnapshot, orderBy, query, where, } from "./firebaseConfig";
class userPanel extends Panel {
  _userProfile;
  _header = `<header class="header panel_user">
  <img
    class="header__login_logo"
    src="${logo}"
    alt="Pay-U-Print Logo"
  />
  <nav class="nav">
    <ul class="nav__list">
      <li><button class="nav__btn upload">Upload</button></li>
      <li><button class="nav__btn history">History</button></li>
      <li><button class="nav__btn logout">Logout</button></li>
    </ul>
  </nav>
</header><main class="main"></main>`;
  constructor(uid, isAdmin) {
    super();
    if (!isAdmin) this.renderHeader();
    this.uid = uid;
    this.initUserData();
  }
  async initUserData() {
    try {
      //NOTE: if i put this._userProfile = await getUserProfile(auth.currentUser.uid); here, it will not get the updated data(wallet,history)
      this._userProfile = await getUserProfile(this.uid);
      this.getLiveUserProfile();
      this.getLiveActiveDocs();
      this.render();
    } catch (e) {
      alert(e);
    }
  }
  getLiveUserProfile() {
    const q = query(collection(db, "users"), where("uid", "==", this.uid));
    onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        this._userProfile = {
          AccountCreationDate: doc.data().AccountCreationDate,
          displayName: doc.data().displayName,
          email: doc.data().email,
          history: doc.data().history,
          isAdmin: doc.data().isAdmin,
          uid: doc.data().uid,
          wallet: doc.data().wallet,
        };
      });
      this.walletBalance.innerHTML = `₱${this._userProfile.wallet.toFixed(2)}`;
      this._pastDocs = JSON.parse(this._userProfile.history);
    });
  }
  getLiveActiveDocs() {
    const q = query(
      collection(db, "printForms"),
      where("userID", "==", this.uid),
      orderBy("timestamp", "desc")
    );
    onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({
          filename: doc.data().filename,
          filepincode: doc.id,
          price: doc.data().price,
          paperType: doc.data().paperType,
          colorOption: doc.data().colorOption,
          timestamp: doc.data().timestamp,
          status: doc.data().status,
        });
      });
      this._activeDocs = docs; // update active docs array
    });
  }
  generateWalletMarkup() {
    return `
    <div class="container print__section">
    <div class="section print__section_wallet">
      <div class="printForm__text">Hello, ${
        this._userProfile.displayName
      }!</div>
      <div class="wallet">
        <p class="wallet__text">Available Balance:</p>
        <div class="wallet__balance">₱${this._userProfile.wallet.toFixed(
          2
        )}</div>
      </div>
    </div>
    `;
  }
  generateUserHistoryMarkup(allDocs) {
    //NOTE: merge history of admin and user, set flags to get which docdata is displayed
    const trows = allDocs
      .map(
        (doc) =>
          `<tr>
          <td class="text-overflow">${doc.filename}</td>
          <td class="center-text">${doc.filepincode}</td>
          <td class="center-text capitalize">₱${doc.price.toFixed(2)}</td>
          <td class="center-text capitalize">${doc.paperType}</td>
          <td class="center-text capitalize">${doc.colorOption}</td>
          <td class="center-text">${this.formatTimeStamp(doc.timestamp)}</td>
          <td class="center-text">${doc.status}</td>
          </tr>`
      )
      .join("");
    return `<div class="container table-container">
    <table id="data-table">
      <thead>
        <tr>
        <th>Filename</th>
        <th class="center-text">File Pincode</th>
        <th class="center-text">Price</th>
        <th class="center-text">Paper Type</th>
        <th class="center-text">Color Option</th>
        <th class="center-text">Date Uploaded</th>
        <th class="center-text">Status</th>
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
  renderWallet() {
    this._parentEl.insertAdjacentHTML(
      "afterbegin",
      this.generateWalletMarkup()
    );
    this.walletBalance = document.querySelector(".wallet__balance");
  }
  renderHistory() {
    this._pastDocs = JSON.parse(this._userProfile.history);
    // NOTE: it works because it is still under new userPanel()
    const allDocs = [...this._activeDocs, ...this._pastDocs];
    this._clear(this._parentEl);
    this._parentEl.insertAdjacentHTML(
      "beforeend",
      this.generateUserHistoryMarkup(allDocs)
    );
  }
  render() {
    this.renderWallet();
    this.renderPrintForm();
  }
  renderHeader() {
    document.body.innerHTML = this._header;
    this._parentEl = document.querySelector(".main");
    this.addHeaderListeners();
  }
  addHeaderListeners() {
    const upload = document.querySelector(".upload");
    const history = document.querySelector(".history");
    const logout = document.querySelector(".logout");
    upload.addEventListener("click", () => {
      this._clear(this._parentEl);
      this.renderWallet();
      this.renderPrintForm();
    });
    history.addEventListener("click", () => {
      this.renderSpinner(document.body.children[1]);
      this.renderHistory();
    });
    logout.addEventListener("click", async () => {
      try {
        signOut(auth);
      } catch (e) {
        alert(e);
      }
    });
  }
}
export default userPanel;
//BUG: for next update idea
// async getLiveUserProfile(uid) {
//   const queryUserDocHistory = query(
//     collection(db, "users"),
//     where("uid", "==", uid)
//   );
//   onSnapshot(queryUserDocHistory, (querySnapshot) => {
//     this._userProfile;
//     querySnapshot.forEach((doc) => {
//       this._userProfile = {
//         history: doc.data().history,
//         isAdmin: doc.data().isAdmin,
//         password: doc.data().password,
//         secretpin: doc.data().secretpin,
//         uid: doc.data().uid,
//         users: doc.data().users,
//         wallet: doc.data().wallet,
//       };
//     });
//   });
// }
// BUG: REMOVED, getting snapshot of history when uploading printform because of .wallet update
// getDataLive(uid) {
//   const queryUserDocActive = query(
//     collection(db, "printForms"),
//     where("userID", "==", uid),
//     orderBy("timestamp", "desc")
//   );
//   const queryUserDocHistory = query(
//     collection(db, "users"),
//     where("uid", "==", uid)
//   );
//   this._unSubscribeActive = onSnapshot(
//     queryUserDocActive,
//     (querySnapshot) => {
//       const docs = [];
//       querySnapshot.forEach((doc) => {
//         docs.push({
//           filename: doc.data().filename,
//           filepincode: doc.data().filePinCode,
//           papersize: doc.data().paperSize,
//           timestamp: doc.data().timestamp,
//           status: doc.data().status,
//         });
//       });
//       this._activeDocs = docs; // update active docs array
//       this._allDocs = [...this._activeDocs];
//       console.log(`active:`);
//       asd(this._allDocs);
//     }
//   );
//   this._unSubscribeHistory = onSnapshot(
//     queryUserDocHistory,
//     (querySnapshot) => {
//       this._pastDocs = [];
//       querySnapshot.forEach((doc) => {
//         this._pastDocs = [...JSON.parse(doc.data().history)];
//       });
//       this._allDocs = [...this._activeDocs, ...this._pastDocs]; // update user's past docs array
//       console.log(`active + user history:`);
//       asd(this._allDocs);
//     }
//   );
//   function asd(asd) {
//     console.log(asd);
//   }
// }
// toggleSubscribe(subscribe) {
//   subscribe();
// }
