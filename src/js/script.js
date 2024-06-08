import { initializeApp } from "firebase/app";

// import firebaseConfig from "./firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
//prettier-ignore
import {getFirestore,collection,getDocs,addDoc,deleteDoc,doc,onSnapshot,query,where,orderBy,serverTimestamp,Timestamp,
getDoc,updateDoc,setDoc} from "firebase/firestore";
//prettier-ignore
import {getAuth,createUserWithEmailAndPassword,signOut,signInWithEmailAndPassword} from "firebase/auth";
import { PDFDocument, rgb } from "pdf-lib";
import PrintForm from "./printForms";
const firebaseConfig = {
  apiKey: "AIzaSyClDV5K8rNhF8u-QWJwzv3iWXvYDsR2xto",
  authDomain: "puprinter-efcd0.firebaseapp.com",
  databaseURL: "https://puprinter-efcd0-default-rtdb.firebaseio.com",
  projectId: "puprinter-efcd0",
  storageBucket: "puprinter-efcd0.appspot.com",
  messagingSenderId: "648059109438",
  appId: "1:648059109438:web:d1d10e27442c0ecad1916f",
};
async function modifyPdf() {
  try {
    const url =
      "https://justcors.com/tl_24aa1c1/https://firebasestorage.googleapis.com/v0/b/puprinter-efcd0.appspot.com/o/EeTd03lsyYOwvBCtb7K5LFeBcIA3%2FtestFile.pdf?alt=media&token=76b1171f-3a0b-4340-ae62-98c6eb0e8967";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    console.log(pdfDoc.addPage);
    const pages = pdfDoc.getPages();
    console.log(pages);
    const pdfBytes = await pdfDoc.save();
    const pdfFile = new File([pdfBytes], "TESTfileName-Modified", {
      type: "application/pdf",
    });
    //<--some function -->

    //upload to firestorage NOTE:make single function
    const storageRef = ref(storage, "eto Modified"); //path
    const fileRef = ref(storageRef, pdfFile.name);
    const snapshot = await uploadBytes(fileRef, pdfFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(downloadURL);
    console.log("uploaded modified file to DB!");
  } catch (e) {
    console.log(e);
  }
}
// modifyPdf();
function pdfToGreyscale(pdfDoc) {
  const numPages = pdfDoc.getPageCount();
  pdfDoc.getContent();
  pdfDoc.getPages().forEach();
}
const setGreyscaleColor = (page) => {
  page.setFillColor(0, 0, 0);
  page.setStrokeColor(0, 0, 0);
};

const app = initializeApp(firebaseConfig);
//init auth
const auth = getAuth();
//init firestore
const db = getFirestore(app);
//init storage
const storage = getStorage(app);
//logout
const logoutBtn = document.querySelector(".logout");
logoutBtn.addEventListener("click", () => {
  signOut(auth);
  console.log(auth.currentUser);
});

//adds and checks to users db for duplicate,
async function updateUserDB(user) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      users: user.email,
      wallet: 0,
    },
    { merge: true }
  );
}
//sign up
const signupForm = document.querySelector(".signup");
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = signupForm.email.value;
  const password = signupForm.password.value;
  signup(email, password);
  console.log();
});
async function signup(email, password) {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userdata = credential.user;
    updateUserDB(userdata);
    signupForm.reset();
    console.log(userdata);
  } catch (e) {
    alert(e);
  }
}
//login
const loginForm = document.querySelector(".login");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = loginForm.email.value;
  const password = loginForm.password.value;
  signIn(email, password);
});

async function signIn(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userdata = credential.user;
    loginForm.reset();
    console.log(userdata);
  } catch (e) {
    alert(e);
  }
}
//printForm
const printForm = document.querySelector(".add");
printForm.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("pakyu!");
  //adds to printforms db
  addPrintForm();
});
async function addPrintForm() {
  try {
    if (!isLogin()) throw new Error("LOG IN FIRST!");
    const fileurl = await generateFileURL();
    const pincode = await generatePinCode();
    const docRef = await addDoc(collection(db, "printForms"), {
      userID: auth.currentUser.uid,
      fileURL: fileurl,
      price: printForm.price.value, //default to 3
      colored: getColor(),
      pinCode: pincode,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    alert(e);
  }
}
//get color radiobutton
const getColor = () => {
  return document.querySelector("input[name=colored]:checked").value ===
    "colored"
    ? true
    : false;
};
//generate 4-pin code
const generatePinCode = async () => {
  const snapshot = await getDocs(collection(db, "printForms"));
  const pincode = String(snapshot.size + 1).padStart(4, "0");
  return pincode;
};
//generate fileURL and store in firestorage
const myfile = document.querySelector(".file");
const generateFileURL = async () => {
  const file = myfile.files[0];
  console.log(myfile.files);
  console.log(file);
  const storageRef = ref(storage, String(auth.currentUser.uid)); //path
  const fileRef = ref(storageRef, file.name);

  // 'file' comes from the Blob(no filename) or File API
  try {
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("uploaded file to DB!");
    //NOTE: return file name and downloadURL
    return downloadURL;
  } catch (e) {
    alert(e);
  }
};
//check if login
const isLogin = () => {
  return auth.currentUser;
};
const login = document.querySelector(".auth");
login.addEventListener("click", () => {
  console.log(auth.currentUser);
});
//display printForms data
const openDB = document.querySelector(".openDB");
const printFormss = document.querySelector(".printForms");
openDB.addEventListener("click", () => {
  getprintformsdata();
});
async function getprintformsdata() {
  const snapshot = await getDocs(collection(db, "printForms"));

  const markup = snapshot.docs
    .map(
      (doc) =>
        `    <div>
    <h3>Document ID: ${doc.id}</h3>
    <p>user ID: ${doc.data().userID}</p>
    <p>colored:${doc.data().colored}}</p>
    <p>file url: ${doc.data().fileURL}</p>
    <p>pin code: ${doc.data().pinCode}</p>
    <p>price: ${doc.data().price}</p>
    <p>date created: ${new Date(doc.data().timestamp.seconds * 1000)}</p>
  </div>`
    )
    .join("");
  printFormss.innerHTML = "";
  printFormss.insertAdjacentHTML("afterbegin", markup);
}
//delete document from printForms collection
const delPrintForm = document.querySelector(".delete");
delPrintForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const docRef = doc(db, "printForms", delPrintForm.id.value);
  console.log(delPrintForm.id.value);
  deleteDoc(docRef)
    .then(() => {
      delPrintForm.reset();
      alert("Successfully deleted form!");
    })
    .catch(() => {
      alert("Failed to delete, Please try again.");
    });
});
//read local File
//BUG: cant read local files
async function readLocalFile(url) {
  const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
  const bytes = new Uint8Array(existingPdfBytes);
  console.log(bytes);
  const pdfDoc = await PDFDocument.load(bytes);
  console.log(pdfDoc);
}
// readLocalFile("fern.pdf");
// test
const sfile = document.querySelector(".myfile");
sfile.addEventListener("change", (e) => {
  const file = sfile.files[0];
  sss(file);
});
async function sss(file) {
  try {
    const toBit = await file.arrayBuffer();
    console.log(toBit);
    const pdfDoc = await PDFDocument.load(toBit);
    // console.log(pdfDoc.addPage);
    const pages = pdfDoc.getPages();
    console.log(`before copying page`);
    console.log(pages);
    const newdoc = await PDFDocument.create();
    // FUNCTION MODIFY PDF
    // copypage(pdfDoc, toBit);
    //adding 3 page sample
    const [existingPage] = await newdoc.copyPages(pdfDoc, [0]);
    newdoc.insertPage(0, existingPage);
    newdoc.addPage(existingPage);
    newdoc.addPage(existingPage);
    const pdfBytes = await newdoc.save();
    const pdfFile = new File([pdfBytes], "xfileName-Modified", {
      type: "application/pdf",
    });

    //upload to firestorage NOTE:make single function
    const storageRef = ref(storage, "eto Modifiedaa"); //path
    const fileRef = ref(storageRef, pdfFile.name);
    const snapshot = await uploadBytes(fileRef, pdfFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(downloadURL);
    console.log("uploaded modified file to DB!");
  } catch (e) {
    alert(e);
  }
}
function addpage(pdfdoc, filebit) {
  const text = "This iasdasds text in aasdan embasdedded font!";
  const textSize = 44;
  const fpage = pdfdoc.getPage(0);
  const { width, height } = fpage.getSize();

  console.log(width, height);
  const newpage = pdfdoc.addPage([width, height]);

  // Draw the string of text on the page
  // newpage.drawPage(filebit, {
  //   x: 0,
  //   y: 0,
  //   width: width,
  //   height: height,
  //   colorRgb: rgb(0.299, 0.587, 0.114), // Set the color to greyscale
  // });
}
async function copypage(pdfdoc, filebit) {
  // const pdfDoc = await PDFDocument.create();
  const copiedPages = await pdfdoc.copyPages(pdfdoc, [0]);
  const [firstPage] = copiedPages;
  pdfdoc.insertPage(0, firstPage);
}
