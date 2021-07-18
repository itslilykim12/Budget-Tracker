const { ServerResponse } = require("http");

//create variable to hold db connection 
let db;
//establish a connection to IndexedDB database called "budget" and set it to version 1 
const request = indexedDB.open('budget-tracker', 1);

//this event will emit if the database version changes 
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    //create an object store(table) called funds, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('funds', {autoIncrement: true});
};

//upon successful
request.onsuccess = function(event) {
    db = event.target.result;

    if(navigator.onLine) {
        uploadTransaction();
    }
};
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

//function to be executed when attempting to submit transaction, when there's no internet connection 
function saveRecord(record) {
    //open funds with database with read and write permissions
    const transaction = db.transaction(['funds'], 'readwrite');
    //access object store for funds 
    const transactionObjectStore = transaction.objectStore('funds');
    //add record to store with the add method
    transactionObjectStore.add(record);

    alert('Funds added successfully!');
}

function uploadTransaction() {
    //open transaction on your db 
    const transaction = db.transaction(['funds'], 'readwrite');
    //access to objectstore
    const transactionObjectStore = transaction.objectStore('funds');
    //get all records from store 
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {Accept: 'application/json, test/plain, */*',
                        'Content-Type': 'application/json'
                        },
            })
            .then((response) => response.json())
            .then((serverResponse) => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['funds'], 'readwrite');
                //access the funds object store
                const transactionObjectStore = transaction.objectStore('funds');
                //clear all items in store
                transactionObjectStore.clear();

                alert("All saved transactions have been submitted!")
            })
            .catch((err) => {
                console.log(err);
            });
        }
    };
}
//listen for app coming back online 
window.addEventListener('online', uploadTransaction);
