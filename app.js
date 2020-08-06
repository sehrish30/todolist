//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");
const {
  stubString
} = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:test123@cluster0.xbrbz.mongodb.net/TodoList?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list todoList!"
});

const item2 = new Item({
  name: "Hit the + button to add a nw item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const ListSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", ListSchema);

// Item.deleteMany(defaultItems.item1, (err) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Successfully saved default items to DB");
//   }
// })


app.get("/", function (req, res) {

  // const day = date.getDate();

  Item.find({}, (err, foundItems) => {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }

  })



});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

// app.get("/work", function (req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.post("/dynamic", (req, res) => {
  let customListName = req.body.listName;
  console.log(customListName);
  res.redirect("/" + customListName);
})

app.get("/:customListName", (req, res) => {
  let customListName = req.params.customListName;
  customListName = _.capitalize(customListName);

  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(); //this will make a collection
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  })
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      } else {
        console.log("Error caused");
      }
    })
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: { //pull means delete
        items: {
          _id: checkedItemId
        }
      }
    }, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }

})

app.listen(3000, function () {
  console.log("Server started on port 3000");
});