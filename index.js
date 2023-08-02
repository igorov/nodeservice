import express from 'express'
import { PubSub } from '@google-cloud/pubsub';

//const avro = require('avro-js');
//import * as avro from 'avro-js';
//const { avro } = pkgAv;

import fs from 'fs'
//import pkgGA from 'google-auth';
//const { GoogleAuth } = pkgGA;

import pkg from 'pg';
const { Client } = pkg;

const hostDB = process.env.DB_HOST;
const userDB = process.env.DB_USER;
const passDB = process.env.DB_PASS;
const nameDB = process.env.DB_NAME;
const topicPubSub = process.env.TOPIC_PUBSUB;

const client = new Client({
    user: userDB,
    host: hostDB,
    database: nameDB,
    password: passDB,
    port: 5432, // Puerto por defecto para PostgreSQL
});


const clientPubSub = new PubSub();
//const topic = clientPubSub.topic(topicPubSub);

const app = express();
app.use(express.json());

console.log(`Conexión: ${hostDB}`);

client.connect()
    .then(() => console.log('Conexión exitosa a la base de datos'))
    .catch(err => console.error('Error al conectar a la base de datos', err));


app.get('/liveness', async (_req, res) => {
    res.status(200).json({ status: 'OK' });
})

app.get('/clientes', async (_req, res) => {
    try {
        const result = await client.query('SELECT * FROM cliente');
        console.log(`listando clientes, cantidad: ${result.rowCount}`)
        return res.send(result.rows)
    } catch (error) {
        log.error(`Error en la consulta ${error}`)
        res.status(500).send('Error interno del servidor');
    }

})

app.get('/clientes/:id', async (_req, res) => {
    const id = _req.params.id;
    try {
        const query = 'SELECT * FROM cliente WHERE id = $1';
        const values = [id];
        const result = await client.query(query, values);
        console.log(`Cliente obtenido con id ${id}`)
        return res.send(result.rows[0])
    } catch (error) {
        console.error(`Error en la consulta ${error}`)
        res.status(500).send('Error interno del servidor');
    }

})

app.post('/clientes', async (_req, res) => {
    const { nombres, apellidos, email } = _req.body;
    let idCreado;
    try {
        const query = 'INSERT INTO cliente(nombres, apellidos, email) VALUES ($1, $2, $3) RETURNING id'; // Consulta SQL con parámetros
        const values = [nombres, apellidos, email]; // Valores a insertar en la consulta

        const result = await client.query(query, values)
        idCreado = result.rows[0].id;
        console.log(`Recurso creado con ID=${idCreado}`);
    } catch (error) {
        console.error(`Error en la insercion del registro: ${error}`)
        res.status(500).send('Error interno del servidor');
    }

    try {
        // Topic
        const message = {
            id: idCreado
        }
        const idCreadoStr = idCreado.toString(); // Convertir a cadena de texto
        const dataBuffer = Buffer.from(idCreadoStr);
        console.log("Mensaje id", message.id);

        const messageId = await clientPubSub
            .topic(topicPubSub)
            .publishMessage({ data: dataBuffer });

        console.log(`Mensaje enviado, messageId=${messageId}`);

        
    } catch (error) {
        console.error(`Error en el envío del mensaje: ${error}`)
    } finally {
        res.status(201).json({ status: 'OK', message: `Recurso creado correctamente: ID=${idCreado}` });
    }
})

app.delete('/clientes/:id', async (_req, res) => {
    const id = _req.params.id;
    try {
        const query = 'DELETE FROM cliente WHERE id = $1'; // Consulta SQL con parámetros
        const values = [id];

        await client.query(query, values)
        console.log(`Recurso ${id} eliminado`);
        res.status(200).json({ status: 'OK', message: 'Recurso eliminado correctamente' });
    } catch (error) {
        console.log(`Error en la consulta ${error}`)
        res.status(500).send('Error interno del servidor');
    }
})
app.put('/clientes/:id', async (req, res) => {
    const id = req.params.id;
    const { nombres, apellidos, email } = req.body;

    try {
        const query = 'UPDATE cliente SET nombres=$1, apellidos=$2, email=$3 WHERE id=$4'; // Consulta SQL con parámetros
        const values = [nombres, apellidos, email, id]; // Valores a insertar en la consulta

        await client.query(query, values)
        console.log(`Recurso ${id} modificado`);
        res.status(200).json({ status: 'OK', message: 'Recurso modificado correctamente' });
    } catch (error) {
        log.error(`Error en la consulta ${error}`)
        res.status(500).send('Error interno del servidor');
    }
});

const port = process.env.PORT | 8080
app.listen(port, () => console.log('listening ... puerto:', port))