const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const { redirect } = require("express/lib/response")
const _ = require("lodash")
const date = require(__dirname+"/date.js")

const app = express()

mongoose.connect("mongodb+srv://admin-suraj:test123@cluster0.zhpacar.mongodb.net/todolistDB")

const itemsSchema = {
    name: String
}
const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
    name: "Welcome to your todolist"
})
const item2 = new Item({
    name: "Hit the + button to add new item"
})
const item3 = new Item({
    name: "<- check this to delete item"
})

const defaultItem = [item1, item2, item3]

const ListSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", ListSchema)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

app.set('view engine', 'ejs')

app.get("/", function (req, res) {
    const day = date.getDate()
    Item.find(function(err,result){
        if(err){
            console.log(err)
        }else{
            if(result.length === 0){
                Item.insertMany(defaultItem, function(err){
                    if(err){
                        console.log(err)
                    }
                    else{
                        console.log("Successfully added default items!! ")
                    }
                })
                res.redirect("/")
            }
            else{
                res.render("list", { listTitle: day, newItemLists: result })
            }
        }
    })
})

app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName)

    List.findOne({name: customListName}, function(err,result){
        if(!err){
            if(!result){
                const list = new List({
                    name: customListName,
                    items: defaultItem
                })
                list.save()
                res.redirect("/" + customListName)
            }else{
                res.render("list",  { listTitle: customListName, newItemLists: result.items })
            }
        }
    })
})

app.post("/", function (req, res) {

    const itemName = req.body.newItem
    const listName = req.body.list
    const item = new Item({
        name: itemName
    })
    List.findOne({name: listName}, function(err, foundList){
        if(!err){
            if(!foundList){
                item.save()
                res.redirect("/")
            }else {
                foundList.items.push(item)
                foundList.save()
                res.redirect("/" + listName)
            }
        }
    })
    
})

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox
    const listName = req.body.listName
    const day = date.getDate()
    if(listName === day)
    {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("Successfully deleted checked item.")
            }
        })
        res.redirect("/")
    } else{
        List.findOneAndUpdate({name: listName},{ $pull : {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName)
            }
        })
    }
})

app.get("/about", function (req, res){
    res.render("about")
})

let port = process.env.PORT

if(port== null || port==""){
    port = 3000;
}
app.listen(port, function () {
    console.log("Server started successfully!")
})