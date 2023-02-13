import express, { Application } from 'express';
import { startDataBase } from './database';
import { createNewDev, editDeveloper, getAllDeveloperById, getAllDevelopers, getAllProjectsByDevId} from './logics/developers.logics'
import { chekDevEmail, chekDevID } from './middlewares/developers.middlewares'
import { createDevInfo } from './logics/devInfo.logics'
import { checkDevInfoId } from './middlewares/devInfo.middlewares'
import { createNewProject, getAllProjects, getProjectsById, insertNewTech } from './logics/projects.logics'
import { checkDevIdForNewProject, checkProjectId} from './middlewares/projects.middlewares'


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
app.get('/developers/:id/projects', chekDevID, getAllProjectsByDevId)
app.patch('/developers/:id', chekDevID, editDeveloper)


//table: developers_info
app.post('/developers/:id/infos', chekDevID, checkDevInfoId, createDevInfo);

//talbe: projects
app.post('/projects', checkDevIdForNewProject, createNewProject);
app.post('/projects/:id/technologies', checkProjectId, insertNewTech );
app.get('/projects', getAllProjects );
app.get('/projects/:id', checkProjectId, getProjectsById );


