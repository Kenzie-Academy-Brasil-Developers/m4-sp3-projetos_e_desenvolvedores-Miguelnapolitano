import { Request, Response, NextFunction } from 'express';
import { QueryConfig } from 'pg';
import { client } from '../database';
import { insertTechnologyResult, projectResult, technologyResult} from '../interfaces/projects.interfaces';


const checkDevIdForNewProject = async (req: Request, res:Response, next: NextFunction): Promise<Response | void> => {
    
    const devId: string = req.body.developerId;

    const queryString: string = `
        SELECT
             * 
        FROM
            developers
        WHERE
            id = $1
    `

    const queryConfig: QueryConfig = {
        text: queryString,
        values: [devId]
    }

    const queryResult: projectResult = await client.query(queryConfig);
    
    if (!queryResult.rows[0]){
        return res.status(404).json('Developer not found.')        
    }

    return next()
}

const checkProjectId = async (req: Request, res:Response, next: NextFunction): Promise<Response | void> => {

    const projectId: string = req.params.id;

    const queryString: string =`
        SELECT 
            *
        FROM
            projects
        WHERE
            id = $1
    `
    const queryConfig: QueryConfig = {
        text: queryString,
        values: [projectId]
    }

    const queryResult: projectResult = await client.query(queryConfig);

    if (!queryResult.rows[0]){
        return res.status(404).json(`Project ID: ${projectId} does not exists`)
    }

    next()
}

const checkRelationship = async (req: Request, res:Response, next: NextFunction): Promise<Response | void> => {
    const queryString: string = `
    SELECT 
        *
    FROM technologies
    WHERE name = $1
    `

    const queryConfig: QueryConfig = {
        text: queryString,
        values: [req.params.name]
    }

    const queryResult: technologyResult = await client.query(queryConfig)

    if(!queryResult.rows[0]){
       return res.status(404).json(`Technology name: ${req.params.name} does not exist.`)
    }
    const techId: number = Number(queryResult.rows[0].id);

    const queryStringForCheck: string = `
    SELECT 
        *
    FROM projects_technologies
    WHERE "technologyId" = $1 AND "projectId" = $2;    
    `

    const queryConfigForCheck: QueryConfig = {
        text: queryStringForCheck,
        values: [techId, req.params.id]
    }

    const queryResultForCheck: insertTechnologyResult = await client.query(queryConfigForCheck);

    if(!queryResultForCheck.rows[0]){
        return res.status(404).json(`Technology ${req.params.name} not found in Project ID: ${req.params.id}.`)
    }

    next();
}

export { checkDevIdForNewProject, checkProjectId, checkRelationship }