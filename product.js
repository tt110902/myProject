const express = require('express');
const product_router = express.Router();
const handlebars = require('handlebars');
const fs = require('fs');
const hbs = require('hbs');
const path = require('path');
const multer = require('multer');
const app = express();
const uri = "mongodb+srv://tt110902:Truong109@myprojectvippro.wavtard.mongodb.net/?retryWrites=true&w=majority";
const mongo = require('mongodb');
const {
    MongoClient
} = require('mongodb');

var bodyParser = require("body-parser");
const category_router = require('./category');
app.use(bodyParser.urlencoded({
    extended: false
}));
// product_router.set('view engine', 'hbs');
// product_router.use(express.static(__dirname + '/public'));
const storage = multer.diskStorage({
    destination: function (req, file, cb) { // kiem tra xxem file co dc cham nhan hay ko
        cb(null, './public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, req.body.name + '-' + Date.now() + path.extname(file.originalname));
    }
})


handlebars.registerHelper('selected', function(option, value){
    if (option == value) {
        return ' selected';
    } else {
        return ''
    }
});


product_router.get('/delete', async function (req, res) {
    let client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    let db = client.db('myProject');
    let collection = db.collection('product');
    let id = req.query.id;
    let img = req.query.img;
    var o_id = new mongo.ObjectID(id);
    var condition = {
        '_id': o_id
    };
    var is_remove = await collection.removeOne(condition);
    fs.unlinkSync(__dirname + '/public/uploads/' + img);


    res.redirect('/products/index');
})

product_router.post('/doSearch', async (req, res) => {
    let client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    let db = client.db('myProject');
    let collection = db.collection('product');

    let name = new RegExp(req.body.search);

    var condition = {
        'name': name
    };
    var products = await collection.find(condition).toArray();

    const template = handlebars.compile(fs.readFileSync('views/product/index.hbs', 'utf-8'));
    const result = template({
        product3: products
    }, {
        allowProtoMethodsByDefault: false,
        allowProtoPropertiesByDefault: false

    })

    res.render('partials/main.hbs', {
        content: result
    })

})

// index
product_router.get('/index', async (req, res) => {
    let client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    let db = client.db('myProject');

    let collection = db.collection('product');
    const option = {};
    const query = {};

    var products = await collection.find({}).toArray();

    const template = handlebars.compile(fs.readFileSync('views/product/index.hbs', 'utf-8'));
    const result = template({
        product3: products
    }, {
        allowProtoMethodsByDefault: false,
        allowProtoPropertiesByDefault: false

    })

    res.render('partials/main.hbs', {
        content: result
    })
})

//end index


//view
product_router.get('/view', async (req, res) => {
    var id = req.query.id;
    const client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    const db = client.db('myProject');

    const collection = db.collection('product');

    var o_id = new mongo.ObjectID(id);

    var condition = {
        '_id': o_id
    };
    var product = await collection.findOne(condition);

    var category = await db.collection('categories').findOne({'_id' : mongo.ObjectID(product.category_id)});
    // console.log(category);
    

    const template = handlebars.compile(fs.readFileSync('views/product/view.hbs', 'utf-8'));
    const result = template({
        product : product,
        category : category,
        supplier : supplier
    })

    res.render('partials/main.hbs', {
        content: result
    })

})

//end view

//add 

product_router.get('/addProduct', async (req, res) => {
    const client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    const db = client.db('myProject');

    let categories1 = await db.collection('categories').find({}).toArray();
  
    const template = handlebars.compile(fs.readFileSync('views/product/create.hbs', 'utf-8'));
    const result = template({
        categories: categories1
    })
    res.render('partials/main.hbs', {
        content: result
    })
})
var upload = multer({
    storage: storage
});

product_router.post('/addProductF', upload.single("img"), async (req, res) => {
    let img = req.file.filename;
    let name = req.body.name;
    let category_id = req.body.category;
    let supplier = req.body.supplier;
    let price = req.body.price;
    let description = req.body.description;

    let client = await MongoClient.connect(uri);
    let db = client.db('myProject');

    const collection = db.collection('product');

    const doc = {
        'name': name,
        'img': img,
        'description': description,
        'price': price,
        'category_id' : category_id,
        'supplier' : supplier
    };

    const is_insert = collection.insertOne(doc);
    res.redirect('/products/index');
})

// end add

//Update
product_router.get('/update', async function (req, res) {
    let id = req.query.id;

    const client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    const db = client.db('myProject');
    const collection = db.collection('product');

    var o_id = new mongo.ObjectID(id);
    var condition = {
        '_id': o_id
    };
    var product = await collection.findOne(condition);
    var categories = await db.collection('categories').find({}).toArray();

    const template = handlebars.compile(fs.readFileSync('views/product/update.hbs', 'utf-8'));
    const result = template({
        product: product,
        categories: categories
    })

    res.render('partials/main.hbs', {
        content: result
    })
})

product_router.post('/updateProduct', upload.single("img"), async (req, res) => {

    let img = '';
    let old = req.body.old_img;
    console.log(old);
    if (!req.file) {
        img = old;
    } else {
        img = req.file.filename;
        if (fs.existsSync(__dirname + '/public/uploads/' + old)) {
            fs.unlinkSync(__dirname + '/public/uploads/' + old);
        }
    }

    let name = req.body.name;
    let id = new mongo.ObjectID(req.body.id);
    let description = req.body.description;
    let price = req.body.price;
    let category_id = req.body.category;
    let supplier = req.body.supplier;

    const client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    const db = client.db('myProject');
    const collection = db.collection('product');

    try {
        var is_update = collection.updateOne({
            '_id': id
        }, {
            $set: {
                name: name,
                img: img,
                description: description,
                price: price,
                category_id: category_id,
                supplier: supplier

            }
        })
    } catch (error) {
        console.log(error);
    }

    res.redirect('/products/index');
})


//end updates

module.exports = product_router;
