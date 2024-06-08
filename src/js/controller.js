import {
  auth,
  getUserDetails,
  getUserProfile,
  isAdmin,
  userSignOut,
  collection,
  getDocs,
  db,
  query,
  orderBy,
  runTransaction,
  doc,
  app,
  handleRedirectAuth,
} from "./firebaseConfig";
import userPanel from "./userPanel";
import loginPanel from "./login";
import {
  browserSessionPersistence,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import icons from "../img/icons.svg";
import adminPanel from "./adminPanel";

// NOTE: APP;
const spinner = ` <div class="spinner">
<svg>
  <use href="${icons}#icon-loader"></use>
</svg>
</div>`;
//NOTE: APP;
try {
  onAuthStateChanged(auth, async (user) => {
    await handleRedirectAuth();
    document.body.insertAdjacentHTML("afterbegin", "");
    document.body.insertAdjacentHTML("afterbegin", spinner);
    document.body.innerHTML = "";
    document.body.innerHTML = spinner;
    if (user) {
      console.log(user);
      const admin = await getUserProfile(user.uid);
      console.log(admin.isAdmin);
      admin.isAdmin
        ? new adminPanel(user.uid, admin.isAdmin)
        : loginPanel.render();
    } else {
      loginPanel.render();
    }
  });
} catch (e) {
  alert(e);
  console.log(e);
}

//NOTE: APP;
// new userPanel(user.uid, admin.isAdmin);
