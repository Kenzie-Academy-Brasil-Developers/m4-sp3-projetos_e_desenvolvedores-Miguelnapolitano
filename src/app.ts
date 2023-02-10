import express, { Application } from 'express';
import { startDataBase } from './database';
import { createNewDev, getAllDeveloperById, getAllDevelopers } from './logics/developers.logic'
import { chekDevEmail, chekDevID } from './middlewares/developers.middlewares'


const app: Application = express();
app.use(express.json());

app.listen(3000, async () => {
  await startDataBase();
  console.log("Server is running!");
});

//table: developers
app.post('/developers', chekDevEmail, createNewDev);
app.get('/developers', getAllDevelopers);
app.get('/developers/:id', chekDevID, getAllDeveloperById)
