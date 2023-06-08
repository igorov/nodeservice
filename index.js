import express from 'express'
import mongoose from 'mongoose'

const Cliente = mongoose.model('Cliente', new mongoose.Schema({
    nombres: String,
    apellidos: String,
    email: String
}))

const app = express();
app.use(express.json());

const urlMongo = "mongodb://mongo:mongo@localhost:27017/clientes?authSource=admin";
//const urlMongo = process.env.MONGO_URI;

mongoose.connect(urlMongo);

app.get('/', async (_req, res) => {    
    const clientes = await Cliente.find();
    console.log('listando clientes, cantidad:', clientes.length)
    return res.send(clientes)
})
app.get('/crear', async (_req, res) => {
    console.log('creando...')
    await Cliente.create({ nombres: 'Anakin', apellidos: 'Skaywalker', email: 'darth.vader@imperio.com' })
    return res.send('ok')
})

app.post('/', async (_req, res) => {
    const createdResource = await Cliente.create(_req.body)

    res.status(201).json({ mensaje: 'Recurso creado correctamente', resource: createdResource });
})
app.delete('/:id', async (_req, res) => {
    const id = _req.params.id;
    try {
        await Cliente.findByIdAndRemove(id);
        console.log('Recurso eliminado:', id)
        res.status(200).json({ mensaje: 'Recurso eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el recurso', error });
    }
})
app.put('/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    try {
        const updatedResource = await Cliente.findByIdAndUpdate(id, updatedData, { new: true });
        console.log('Recurso editado:', id)
        res.status(200).json({ mensaje: 'Recurso actualizado correctamente', resource: updatedResource });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el recurso', error });
    }
});

const port = process.env.PORT | 8080
app.listen(port, () => console.log('listening ... puerto:',port))