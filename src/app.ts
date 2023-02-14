import express, { Application } from 'express';
import { startDataBase } from './database';
import { createNewDev, deleteDeveloper, editDeveloper, getAllDeveloperById, getAllDevelopers, getAllProjectsByDevId} from './logics/developers.logics';
import { chekDevEmail, chekDevID } from './middlewares/developers.middlewares';
import { createDevInfo, editDevIndo } from './logics/devInfo.logics';
import { checkDevInfoId } from './middlewares/devInfo.middlewares';
import { createNewProject, deleteTech, editProjectsById, getAllProjects, getProjectsById, insertNewTech } from './logics/projects.logics';
import { checkDevIdForNewProject, checkProjectId, checkRelationship} from './middlewares/projects.middlewares';


const app: Application = express();
app.use(express.json());

app.listen(3000, async () => {
  await startDataBase();
  console.log("Server is running!");
});

//table: developers
app.post('/developers', chekDevEmail, createNewDev);
app.get('/developers', getAllDevelopers);
app.get('/developers/:id', chekDevID, getAllDeveloperById);
app.get('/developers/:id/projects', chekDevID, getAllProjectsByDevId);
app.patch('/developers/:id', chekDevID, editDeveloper);
app.delete('/developers/:id', chekDevID, deleteDeveloper);


//table: developers_info
app.post('/developers/:id/infos', chekDevID, checkDevInfoId, createDevInfo);
app.patch('/developers/:id/infos', chekDevID, editDevIndo);

//talbe: projects
app.post('/projects', checkDevIdForNewProject, createNewProject);
app.post('/projects/:id/technologies', checkProjectId, insertNewTech );
app.get('/projects', getAllProjects );
app.get('/projects/:id', checkProjectId, getProjectsById );
app.patch('/projects/:id', checkProjectId, editProjectsById );
app.delete('/projects/:id/technologies/:name', checkProjectId, checkRelationship,  deleteTech);


