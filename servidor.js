const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = 3000;

const corsOptions = {
    origin: "http://localhost:4200",
    optionsSuccessStatus: 204,
    methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));
app.use(express.json());

const url = "mongodb+srv://StevenGarzon:Caicedo19@cluster0.xwkf6rb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "Productos";

// Function to connect to MongoDB
async function connectToMongoDB() {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    try {
        await client.connect();
        console.log("conectado a mongo");
        return client.db(dbName);
    } catch (err) {
        console.error("Error a conectar a mongo", err);
        throw err;
    }
}

app.get("/ropa", async (req, res) => {
    const pag = parseInt(req.query.pag) || 0;
    const endpag = parseInt(req.query.endpag) || 10;

    try {
        const db = await connectToMongoDB();
        const collection = db.collection("items");

        const totalItems = await collection.countDocuments();
        const items = await collection.find().skip(pag * endpag).limit(endpag).toArray();

        res.status(200).json({
            items,
            total: totalItems,
            pag,
            endpag,
            totalPages: Math.ceil(totalItems / endpag),
        });
    } catch (err) {
        console.error("Error al obtener los items", err);
        res.status(500).send("Error en la base de datos");
    }
});

app.post("/ropa", async (req, res) => {
    const { title, image, description, price, rating } = req.body;

    try {
        const db = await connectToMongoDB();
        const collection = db.collection("items");

        const resultado = await collection.insertOne({ title, image, description, price, rating });
        const Itemnew = resultado.ops[0];

        res.status(201).json(Itemnew);
    } catch (err) {
        console.error("Error adding item", err);
        res.status(500).send("Internal Server Error");
    }
});


app.put("/ropa/:id", async (req, res) => {
    const id = req.params.id;
    const { title, image, description, price, rating } = req.body;

    try {
        const db = await connectToMongoDB();
        const collection = db.collection("items");

        const resultado = await collection.findOneAndUpdate(
            { _id: ObjectId(id) },
            { $set: { title, image, description, price, rating } },
            { returnOriginal: false }
        );

        const ActualizarItem = resultado.value;

        if (!ActualizarItem) {
            res.status(404).send("No se encuentra el producto");
            return;
        }

        res.status(200).json(ActualizarItem);
    } catch (err) {
        console.error("Error al actualizar el producto", err);
        res.status(500).send("Error en la base de datos");
    }
});


app.delete("/ropa/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const db = await connectToMongoDB();
        const collection = db.collection("items");

        const resultado = await collection.deleteOne({ _id: ObjectId(id) });

        if (resultado.deletedCount === 0) {
            res.status(404).send("No se encuentra el producto");
            return;
        }

        res.status(204).send();
    } catch (err) {
        console.error("Error a borrar el producto", err);
        res.status(500).send("Error en la base de datos");
    }
});

app.listen(port, () => {
    console.log(`Escuchando en el puerto http://localhost:${port}`);
});
