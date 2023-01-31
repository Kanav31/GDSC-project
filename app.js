//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://admin-kanav:<password>@cluster0.ik0qzqp.mongodb.net/?retryWrites=true&w=majority");

const todolistSchema = new mongoose.Schema({
  name:String
});

const Item = new mongoose.model("Item", todolistSchema);

const task1 = new Item({
  name:"Welcome to your TodoList"
});

const task2 = new Item({
  name:"Hit the + button to add a new Item"
});

const task3 = new Item({
  name:"<-- Hit this to delete an item"
});

const defaultTask = [task1, task2, task3];

const ListSchema = {
  name: String,
  items: [todolistSchema]
};

const List = mongoose.model("List", ListSchema);

app.get("/", function(req, res) {

// const day = date.getDate();
Item.find({}, function(err, foundItems){
    // console.log(foundItems);     foundItems is an empty array then add the defualtTask
    if(foundItems.length === 0){
      Item.insertMany(defaultTask, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully Added to your DB");
        }
      });
      res.redirect("/");
    }else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

});

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // creating new item document
  const item = new Item({
    name:itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);     //items is array used in line 40
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox ;
  const listName = req.body.listName

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted the check ed Item");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, function(err, foundList){
      if(!err){
        if(!foundList){
          //create new list
          const list = new List({
            name:customListName,
            items: defaultTask
          });

         list.save();
         res.redirect("/"+ customListName);
       }else{
         //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
       }
      }
  });

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
