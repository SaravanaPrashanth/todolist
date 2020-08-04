const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
const env = require('dotenv').config();
// const date = require(__dirname + "/date.js");
const app = express();

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))

//MongoDB Connection
// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect(process.env.API_URI, {useNewUrlParser: true, useUnifiedTopology: true});

//Schema
const itemsSchema = {
  name : String
};

//Model
const Item = mongoose.model("Item", itemsSchema);
// Static arrays
// var items = ["Buy Airpods", "Buy MacBook Pro", "Buy Lamborghini"];
// var workItems = [];

app.set("view engine", "ejs");

//Documents
const item1 = new Item({
  name : "MongoDB"                // Welcome to your ToDo List
});
const item2 = new Item({
  name : "EJS"                   // Hit the '+' button to add a new line
});
const item3 = new Item({
  name : "Express"               // Hit the checkbox to delete an item
});
const defaultItems = [item1, item2, item3];

//Another Schema
const listSchema = {
  name : String,
  items : [itemsSchema]
};

//Another model
const List = mongoose.model("List", listSchema);

//GET Root Route
app.get("/", function(req, res) {
      // let day = date.getDate();
      Item.find({}, function(err, foundItems){
        if(foundItems.length === 0){
          Item.insertMany(defaultItems, function(err){
            if(err){
              console.log(err);
            }else{
              console.log("Success");
            }
          });
          res.redirect("/");
        }else{
          res.render('list', {listTitle : "Today", newListItems : foundItems});
        }
      });
});

//Deleting items Route
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" +listName);
      }
    });
  }
});

// POST Root Route
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name : itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name : listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" +listName);
    });
  }
  // let item = req.body.newItem;
  //
  // if(req.body.list === "Work"){
  //   workItems.push(item);
  //   res.redirect("/work");
  // }else{
  //     items.push(item);
  //     res.redirect("/");
  // }
});

// Dynamic GET Parameter Route
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name : customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/" +customListName);
      }else{
        res.render("list", {listTitle : foundList.name, newListItems : foundList.items});
      }}
  });
});

// About Page
app.get("/about", function(req, res){
  res.render("about");
});

// app.post("/work", function(req, res){
//   let item = req.body.newItem;
//   workItems.push(item);
//   res.redirect("/work");
// });

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started listening successfully");
});
