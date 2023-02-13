import { Request, Response, NextFunction } from 'express';
import { QueryConfig } from 'pg';
import { client } from '../database';
import { iTechnologyRequest, projectResult, technologyResult } from '../interfaces/projects.interfaces';


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

export { checkDevIdForNewProject, checkProjectId }