import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
//prettier-ignore
import {getFirestore,collection,getDocs,addDoc,deleteDoc,doc,onSnapshot,query,where,orderBy,serverTimestamp,Timestamp,
getDoc,updateDoc,setDoc,runTransaction} from "firebase/firestore";
//prettier-ignore
import {getAuth,createUserWithEmailAndPassword,signOut,signInWithEmailAndPassword, SignInMethod, signInWithPopup,GoogleAuthProvider,getAdditionalUserInfo, signInWithRedirect, getRedirectResult} from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyClDV5K8rNhF8u-QWJwzv3iWXvYDsR2xto",
  authDomain: "puprinter-efcd0.firebaseapp.com",
  databaseURL: "https://puprinter-efcd0-default-rtdb.firebaseio.com",
  projectId: "puprinter-efcd0",
  storageBucket: "puprinter-efcd0.appspot.com",
  messagingSenderId: "648059109438",
  appId: "1:648059109438:web:d1d10e27442c0ecad1916f",
};
//init firebase
const app = initializeApp(firebaseConfig);
//init auth
const auth = getAuth();
//init firestore
const db = getFirestore(app);
//init storage
const storage = getStorage(app);
//init googleSignin
const provider = new GoogleAuthProvider();
//login account
async function signIn() {
  try {
    // await signInWithEmailAndPassword(auth, email, password);
    await signInWithRedirect(auth, provider);
  } catch (e) {
    throw e.message;
  }
}
async function handleRedirectAuth() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const userinfo = getAdditionalUserInfo(result);
      if (userinfo.isNewUser)
        if (userinfo.isNewUser) await newUserDB(result.user);
    }
  } catch (e) {
    throw e;
  }
}

//register account
// async function signup(email, password, secretpin) {
//   try {
//     const credential = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     const userdata = credential.user;
//     await newUserDB(userdata, password, secretpin);
//   } catch (e) {
//     throw e;
//   }
// }
// sign out account

//adds and checks to users db for duplicate
async function newUserDB(user) {
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAdmin: false,
        wallet: 0,
        history: "[]",
        AccountCreationDate: serverTimestamp(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, "analytics", "printForms-1"),
      {
        paperType: "short",
        page: 2,
        colored: "original",
        price: 5,
        status: "Paid",
        timestamp: timestampUpload,
        printedTimestamp: serverTimestamp(), //new
      },
      { merge: true }
    );
  } catch (e) {
    throw e;
  }
}

//returns bool checks user has Admin privilege
async function isAdmin() {
  return getUserProfile(auth.currentUser.uid).isAdmin;
}
//get firebase user profile of currently logged in
async function getUserProfile(uid) {
  try {
    if (!uid) return null;
    const docRef = doc(db, "users", uid);
    const getdoc = await getDoc(docRef);
    return getdoc.data();
  } catch (e) {
    throw e;
  }
}
async function getUserDocs(uid) {
  const q = query(
    collection(db, "printForms"),
    where("userID", "==", uid),
    orderBy("timestamp", "desc")
  );
  return await getDocs(q);
}
async function getPrinterConfig(uid) {
  try {
    const docRef = doc(db, "PrintConfig", uid);
    const getdoc = await getDoc(docRef);
    return getdoc.data();
  } catch (e) {
    throw e;
  }
}
async function getAllAnalyticsForms() {
  try {
    const q = query(collection(db, "analytics"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    // Set the "capital" field of the city 'DC'

    const printFormDocs = snapshot.docs.map((doc) => ({
      filepincode: doc.id,
      fileUrl: doc.data().fileURL,
      paperType: doc.data().paperType,
      page: doc.data().page,
      colored: doc.data().colorOption,
      price: doc.data().price,
      status: doc.data().status,
      timestamp: doc.data().timestamp,
    }));
    return printFormDocs;
  } catch (e) {
    throw e;
  }
}
async function updatePropertyInAllDocs() {
  try {
    // const allPrintforms = await getAllPrintForms();
    const q = query(collection(db, "printForms"), orderBy("timestamp", "desc"));

    const snapshot = await getDocs(q);
    for (const docz of snapshot.docs) {
      console.log(docz.id);
      const docRef = doc(db, "printForms", docz.id);

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(docRef);
        if (!sfDoc.exists()) {
          throw "Document does not exist!";
        }
        transaction.update(docRef, { status: "Paid" });
      });
      console.log("Transaction successfully committed!");
    }
  } catch (e) {
    throw e;
  }
}

//cheat code data
async function addDataAnalytics() {
  for (const docu of myData) {
    await setDoc(doc(db, "analytics", docu.id), {
      paperType: docu.paperType,
      page: docu.page,
      colorOption: docu.colorOption,
      price: docu.price,
      timestamp: docu.timestamp,
      printedTimestamp: docu.printedTimestamp, //new
    });
    console.log("UPDATED DATA IN ANALYTICS!");
  }
}
// const myData = [
//   {
//     id: "order-1",
//     paperType: "short",
//     page: 2,
//     colored: "original",
//     price: 5,
//     status: "Paid",
//     timestamp: new Date("2024-06-01T15:00:00"),
//     printedTimestamp: new Date("2024-06-01"), //new
//   },
//   {
//     id: "order-2",
//     paperType: "short",
//     page: 2,
//     colored: "original",
//     price: 5,
//     status: "Paid",
//     timestamp: new Date("2024-06-01"),
//     printedTimestamp: new Date("2024-06-01"), //new
//   },
//   {
//     id: "order-3",
//     paperType: "short",
//     page: 2,
//     colored: "original",
//     price: 5,
//     status: "Paid",
//     timestamp: new Date("2024-06-01"),
//     printedTimestamp: new Date("2024-06-01"), //new
//   },
// ];
const myData = [];

function loop100times() {
  // Create 100 additional orders with random variations
  for (let i = 1; i <= 126; i++) {
    const initialTimestamp = getRandomTimestamp();
    const order = {
      id: `order-${i}`,
      paperType: ["short", "long", "a4"][Math.floor(Math.random() * 3)], // Randomly choose paperType
      page: Math.floor(Math.random() * 7) + 1, // Randomly choose page between 1 and 5
      colorOption: ["original", "photo", "docs", "grayscale"][
        Math.floor(Math.random() * 4)
      ], // Randomly choose colored
      paperType: ["short", "long", "a4"][Math.floor(Math.random() * 3)], // Randomly choose paper
      // Randomly generate timestamp between June 1st, 10:00 AM and June 5th, 5:00 PM
      timestamp: initialTimestamp,
      // Randomly generate printedTimestamp between 3 and 7 minutes after the timestamp
      printedTimestamp: getPrintedTimestamp(initialTimestamp),
    };
    order.price = 5 + 2 * order.page; // Calculate price based on page count
    myData.push(order);
  }
  console.log(myData);
  return myData;
}
function getRandomTimestamp() {
  // Generate a random date between June 1st and June 5th, 2024
  const days = [1, 3, 4, 5, 6];
  const randomDay = days[Math.floor(Math.random() * days.length)];
  const randomDate = new Date(`2024-06-0${randomDay}T00:00:00Z`);

  // Convert to seconds since Unix epoch
  const seconds = Math.floor(randomDate.getTime() / 1000);
  // Nanoseconds part is 0 since we are not including milliseconds
  const nanoseconds = 0;

  return { seconds, nanoseconds };
}
function getPrintedTimestamp(timestamp) {
  // Add 3-5 minutes and random seconds to the original timestamp
  const randomMinutes = Math.floor(Math.random() * 3) + 2; // Random minutes between 3 and 5
  const randomSeconds = Math.floor(Math.random() * 60); // Random seconds between 0 and 59

  // Calculate the new timestamp
  const printedSeconds = timestamp.seconds + randomMinutes * 60 + randomSeconds;

  return { seconds: printedSeconds, nanoseconds: 0 };
}
async function getAllPrintForms() {
  try {
    const q = query(collection(db, "printForms"), orderBy("timestamp", "desc"));

    const snapshot = await getDocs(q);
    // Set the "capital" field of the city 'DC'

    const printFormDocs = snapshot.docs.map((doc) => ({
      filepincode: doc.id,
      fileUrl: doc.data().fileURL,
      paperType: doc.data().paperType,
      page: doc.data().page,
      colored: doc.data().colorOption,
      price: doc.data().price,
      status: doc.data().status,
      timestamp: doc.data().timestamp,
    }));
    return printFormDocs;
  } catch (e) {
    throw e;
  }
}
async function getAllIssueForms() {
  try {
    const snapshot = await getDocs(collection(db, "issues"));
    console.log(snapshot.docs);
    const issueDocs = snapshot.docs.map((doc) => ({
      timestamp: doc.data().date,
      category: doc.data().category,
      issue: doc.data().issue,
    }));
    console.log(`IN ISSUEDOCS`);
    console.log(issueDocs);
    return issueDocs;
  } catch (e) {
    throw e;
  }
}
export {
  getAllIssueForms,
  getAllAnalyticsForms,
  loop100times,
  addDataAnalytics,
  updatePropertyInAllDocs,
  app,
  query,
  orderBy,
  serverTimestamp,
  storage,
  doc,
  getDoc,
  getDocs,
  getUserProfile,
  getUserDocs,
  getAllPrintForms,
  getPrinterConfig,
  ref,
  addDoc,
  collection,
  db,
  getDownloadURL,
  uploadBytes,
  auth,
  signIn,
  signup,
  isAdmin,
  runTransaction,
  handleRedirectAuth,
  signOut,
  onSnapshot,
  where,
};
