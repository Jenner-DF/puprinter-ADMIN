import { PDFDocument } from "pdf-lib";
//prettier-ignore
import { storage,addDoc,doc,getDoc,getDocs,serverTimestamp, ref,collection, db, auth, getDownloadURL,uploadBytes, getUserProfile,runTransaction, getPrinterConfig} from "./firebaseConfig";
import { updateDoc } from "firebase/firestore";

//BAGTZtEwg7TQdKcwIs44 - printconfig uid
//NOTE: JUSTCORS IS IN URL WHEN DEPLOYING LIVE!
//NOTE:Cannot bypass CORS, need to use gsutil and create CORS config file

export default class PrintForm {
  constructor(fileBytes, colorOption, paperType, paymentOption, price, page) {
    // this.printerUID = "printer1";
    this.userID = auth?.currentUser?.uid ? auth.currentUser.uid : null;
    this.fileBytes = fileBytes;
    this.colorOption = colorOption;
    this.paperType = paperType;
    this.paymentOption = paymentOption;
    this.price = price;
    this.page = page;
    console.log(
      this.userID,
      this.colorOption,
      this.fileBytes,
      this.paperType,
      this.price,
      this.page
    );
  }
  static async createInstance(
    file,
    colorOption,
    paperType,
    paymentOption,
    price,
    page
  ) {
    const instance = new PrintForm(
      file,
      colorOption,
      paperType,
      paymentOption,
      price,
      page
    );
    await instance._exportPrintFormToDB();
    return instance.pincode;
  }

  async _exportPrintFormToDB() {
    try {
      this._userData = await getUserProfile(this.userID);
      //prettier-ignore
      this.pincode = await this._generateFilePinCode(),
      this.fileurl = await this._generateFileUrl();
      await runTransaction(db, async (transaction) => {
        transaction.set(this._docRef, {
          userID: this.userID,
          filename: "PUPrinter",
          fileURL: this.fileurl,
          paperType: this.paperType,
          page: this.page,
          price: this.price,
          colorOption: this.colorOption,
          paymentOption: this.paymentOption,
          status:
            this.paymentOption === "machine" ? "Unpaid" : "Ready for Printing",
          timestamp: serverTimestamp(),
        });
      });
      this.paymentOption === "machine" ? null : await this.updateUserWallet();
      // this is not a transaction, can error if if 2 files uploading at same time
      // await addDoc(this._docRef, {
      //   userID: auth.currentUser.uid,
      //   filename: this.file.name,
      //   fileURL: this.fileurl,
      //   paperType: this.paperType,
      //   userSecretPinCode: this._userData.secretpin,
      //   price: this.price,
      //   colorOption: this.colorOption,
      //   filePinCode: this.pincode,
      //   status: "Ready for Printing",
      //   timestamp: serverTimestamp(),
      // });
    } catch (e) {
      throw e;
    }
  }
  async updateUserWallet() {
    const newWalletBal = this._userData.wallet - this.price;
    await updateDoc(doc(db, "users", this._userData.uid), {
      wallet: newWalletBal,
    });
  }
  async _generateFileUrl() {
    const storageRef = ref(storage, this.pincode); //path
    const fileRef = ref(storageRef, "PUPrinter"); //name of file inside the folder
    // 'file' comes from the Blob(no filename) or File API
    try {
      const snapshot = await uploadBytes(fileRef, this.fileBytes, {
        contentType: "application/pdf",
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (e) {
      alert(e);
    }
  }
  async _generateFilePinCode() {
    let attempt = 0;
    let success = false;
    while (!success && attempt < 10) {
      attempt++; // Limit attempts to prevent infinite loops
      const newPIN = Math.floor(1000 + Math.random() * 9000).toString(); // Generate PIN only 1000-9999 (9000pins)
      let pincode;
      try {
        pincode = await runTransaction(db, async (transaction) => {
          const docRef = doc(db, "printForms", newPIN);
          const newdoc = await transaction.get(docRef);
          if (!newdoc.exists()) {
            this._docRef = docRef; // The PIN is unique, proceed to use it
            success = true;
            return String(newPIN);
          }
        });
      } catch (e) {
        throw e;
      }
      if (success) return pincode;
    }
    if (!success) {
      throw new Error("Failed to assign a unique PIN after several attempts.");
    }
  }
}
