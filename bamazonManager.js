
var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require('cli-table');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,

    user: "root",

    password: "password",
    database: "bamazon_db"
});

connection.connect(function(err) {
    if (err) throw err;

    console.log("Connected as id: " + connection.threadId);
    promptAction();
});

function promptAction() {
    inquirer.prompt({
        name: "action",
        type: "list",
        message: "What would you like to do?",
        choices: [
            "View Products for Sale",
            "View Low Inventory",
            "Add to Inventory",
            "Add a New Product",
            "Quit"
        ]
    }).then(function(answer) {
        switch (answer.action) {
            case "View Products for Sale":
                displayProducts();
                break;

            case "View Low Inventory":
                viewLowInv();
                break;

            case "Add to Inventory":
                addInv();
                break;

            case "Add a New Product":
                addProduct();
                break;

            case "Quit":
                quit()
                break;
        }
    });
};

function makeTable(results) {
    var table = new Table ({
        head: ["Product ID", "Product", "Department", "Price", "Stock \nQuantity"],
        colWidths: [13, 35, 30, 10, 10]
    });

    for (var i = 0; i < results.length; i++) {
        var infoArray = [results[i].item_id, results[i].product_name,  results[i].department_name, results[i].price, results[i].stock_quantity]; 
        table.push(infoArray);
    };        

    console.log(table.toString());
};

function keepGoing() {
    inquirer.prompt({
        name: "continue",
        type: "confirm",
        message: "Return to main menue?"
    }).then(function(answer) {
        if (answer.continue == true) {
            promptAction();
        } else {
            console.log("\nNow exiting Bamazon Manager.\nHave a great day!");
            process.exit();
        }
    })
};

// This doesn't seem to work
// function toValidate(value) {
//     if(isNaN(value) === false) {
//         return true;
//     } else {
//         return false;
//     }
// };

function notValid() {
    console.log("Not a valid number. Please Try again.");
    process.exit();
};

function displayProducts() {
    connection.query("SELECT * FROM products", function(err, results) {
        if(err) throw err;

        console.log("\n          --------------------------\n");
        console.log("          Available Bamazon Products");
        console.log("\n          --------------------------\n");

        makeTable(results);
        keepGoing();
    });
};

function viewLowInv() {
    connection.query("SELECT * FROM products WHERE stock_quantity < 6", function(err, resultsTable) {
        if(err) throw err;

        console.log("\n          --------------------------\n");
        console.log("                Low Inventory");
        console.log("\n          --------------------------\n");

        makeTable(resultsTable);
        keepGoing();
    });
};

function addInv() {
    connection.query("SELECT * FROM products", function(err, resultsAdd) {
        if(err) throw err;

        makeTable(resultsAdd);

// How do I make it so there is a message or something if they enter an ID number that doesn't exsist?

        inquirer.prompt([
            {
                name: "addID",
                type: "input",
                message: "What is the ID of the item you would like to add to?",
                validate: function(value) {
                    if(isNaN(value) === false) {
                        return true;
                    } else {
                        console.log("\nNot a valid ID. Please try again.");
                        process.exit();
                        
                        // This leaves the user to exit the process with Ctrl C
                        //return false;

                        // This does some funny stuff...
                        // console.log("\nNot a valid ID. Please try again.");
                        // keepGoing();
                    }
                }
            }
        ]).then(function(answer) {
            for (var i = 0; i < resultsAdd.length; i++) {
                if(resultsAdd[i].item_id == answer.addID) {
                    var choice = answer.addID;
                    var id = i;

                    inquirer.prompt([{
                        name: "addQuant",
                        type: "input",
                        message: "How many would you like to add?",
                        validate: function(value) {
                            if(isNaN(value) === false) {
                                return true;
                            } else {
                                notValid();

                                // return false;
                                // console.log("Not a valid number. Please Try again.");
                                // keepGoing();
                            }
                        }
                    }]).then(function(answer) {

                        var num = answer.addQuant;
                        var updateQuantity = (parseInt(resultsAdd[id].stock_quantity) + parseInt(num));

                        var query = "SELECT * FROM products WHERE ?;"

                        connection.query(query, {item_id: choice}, function(err, resultsQuant) {
                            if(err) throw err;

                            var queryTwo = "UPDATE products SET ? WHERE ?";

                            connection.query(queryTwo, [{stock_quantity: updateQuantity},{item_id: choice}], function(err, resultsInvtAdd) {
                                if (err) throw err;
                                    
                                console.log("\nYou have successfully added " + num + " " + resultsAdd[id].product_name + "\n");

                                keepGoing();
                            })                            
                        })
                    })
                }
            }
        })
    });
};

function addProduct() {
    inquirer.prompt([
        {
            name: "product",
            type: "input",
            message: "What's the name of the product that you would like to add?"
        },
        {
            name: "department",
            type: "input",
            message: "What department will this product be listed under?"
        },
        {
            name: "price",
            type: "input",
            message: "What is the cost per unit for this product?",
            validate: function(value) {
                if(isNaN(value) === false) {
                    return true;
                } else {
                    notValid();
                    //return false;
                }
            }
        },
        {
            name: "quantity",
            type: "input",
            message: "How many units will you be adding to inventory?",
            validate: function(value) {
                if(isNaN(value) === false) {
                    return true;
                } else {
                    notValid();
                    //return false;
                }
            }
        }
    ]).then(function(answer) {
        var query = "INSERT INTO products SET ?";

        connection.query(query,
            {
                product_name: answer.product,
                department_name: answer.department,
                price: answer.price,
                stock_quantity: answer.quantity
            },
            function(err) {
                if (err) throw err;

                console.log(answer.quantity + " of " + answer.product + " were successfully added.")
                keepGoing();
            }
        );
    });
};

function quit() {
    console.log("\nNow exiting Bamazon Manager. Goodbye.");
    process.exit();
};