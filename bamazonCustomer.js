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
    displayProducts();
});

function displayProducts() {
    connection.query("SELECT * FROM products", function(err, results) {
        if(err) throw err;

        console.log("\n          --------------------------\n");
        console.log("          Available Bamazon Products");
        console.log("\n          --------------------------\n");

        var table = new Table ({
            head: ["Product ID", "Product", "Department", "Price", "Stock \nQuantity"],
            colWidths: [13, 35, 30, 10, 10]
        });

        for (var i = 0; i < results.length; i++) {
            var infoArray = [results[i].item_id, results[i].product_name,  results[i].department_name, results[i].price, results[i].stock_quantity]; 

            table.push(infoArray);
        };        

        console.log(table.toString());

        shoppingCart(results);

    });
};

function shoppingCart(results) {
    inquirer.prompt({
        name: "choiceId",
        type: "input",
        message: "Select a product to order by entering the Item ID. [Quit with Q]",
    }).then(function(answer) {

        // Allows the user to exit out any time
        if(answer.choiceId.toLowerCase() == "q") {
            console.log("\nThank you for visiting Bamazon.\nGoodbye!");
            process.exit();
        }

        // Check to make sure choice is valid
        // Then prompts user for quantity
        for (var i = 0; i < results.length; i++) {
            //loop through all of the product ids 
            //if answer == product id in the loop
                //then ask them how many they would like to buy
            //else tell them that's an invalid selection, and ask for a valid product id
            if(results[i].item_id == answer.choiceId) {
                var product = results[i].product_name;
                var choice = answer.choiceId;
                var id = i;

                console.log("\nYou selected " + product + "\n");

                inquirer.prompt([{
                    name: "quantity",
                    type: "input",
                    message: "How many would you like to buy? [Quit with Q]",
                    validate: function(value) {
                        if(isNaN(value)==false) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }]).then(function(answer) {
                    var num = answer.quantity;
                    var diff = (results[id].stock_quantity - num);

                    // Adds comma to total
                    var formatNumber = function(num) {
                        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
                    };

                    // Total cost, make sure only 2 decimal places
                    var totalCost = parseFloat(results[id].price * num).toFixed(2);

                    if(diff >= 0) {
                        connection.query("UPDATE products SET stock_quantity = '" + diff + "' WHERE item_id='" + choice + "'", function(err, resultsTwo) {
                            if(err) throw err;

                            makeTable(results);

                            function message(){
                                console.log("\nYou have successfully purchased " + num + " of " + product);
                                console.log("The total of your purchase is: $" + formatNumber(totalCost) + "\n");
                            };

                            // To show message after the table
                            setTimeout(message, 250);
                            setTimeout(orderMore, 300);
                            
                        })
                    } else {
                        console.log("\nInsufficiant quantity of " + product + ". Please try again.\n");
                        shoppingCart(results);
                    }
                })
            } 
            // else {
            //     console.log("Choice is: " + choice);
            //     console.log("That is not a vaild Product Id.\nPlease try again.");
            //     shoppingCart(results);
            // }  
        }  
    })
}

// Show the user a list of the products
// Prompt the user for which product they want to buy
    //they enter the product id for what they want to buy
// Second prompt askes how many units they would like to buy
    //they enter a number they would like to buy
        //I take the answers and call a query for the order
        //Need to compare the number available and the nubmer ordered
        //if the number ordered is less than or equal to the number available, then
            //update the quantity available
            //create a variable to store the total
// module.exports = displayProducts;

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

function orderMore() {
    inquirer.prompt({
        name: "continue",
        type: "confirm",
        message: "Would you like to order another product?"
    }).then(function(answer) {
        if (answer.continue == true) {
            displayProducts();
        } else {
            console.log("Thank you for shopping with Bamazon.\nHave a great day!");
            process.exit();
        }
    })
}
