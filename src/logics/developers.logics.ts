import { Request, Response } from 'express';
import { QueryConfig } from 'pg';
import format from 'pg-format';
import { client } from '../database';
import { developerResult, iDeveloperRequest } from '../interfaces/developers.interfaces';

const validadeRequest = (payload: any): iDeveloperRequest => {
    const requestData: iDeveloperRequest = payload;

    const requestKeys: Array<string> = Object.keys(requestData);

    const requiredKeys: Array<string> = ["name", "email"];
    
    const requestContainsAllRequiredKeys: boolean = requiredKeys.every((key: string) => requestKeys.includes(key));

    if (!requestContainsAllRequiredKeys) {
        throw new Error('Requireds Keys are "name" and "email".')
    }

    const requestContainsOnlyRequiredKeys: boolean = requestKeys.every((key: string) => requiredKeys.includes(key) || key == "developerInfoId");
    
    if (!requestContainsOnlyRequiredKeys){
        if(requestKeys.includes("developerInfoId")){
            if(Number(requestData.developerInfoId) == 0){
                const newDev: iDeveloperRequest = {
                    name: requestData.name,
                    email: requestData.email,
                    developerInfoId: null    
                }
                return newDev 
            }
            const newDev: iDeveloperRequest = {
                name: requestData.name,
                email: requestData.email,
                developerInfoId: Number(requestData.developerInfoId)    
            }

            return newDev
        }else{
            const newDev: iDeveloperRequest = {
                name: requestData.name,
                email: requestData.email,
            }

            return newDev
        }        
    }

    return requestData
}

const createNewDev = async (req: Request, res: Response): Promise<Response> => {
    try {
        const newDev: iDeveloperRequest = validadeRequest(req.body);

        const queryString: string = format(`
            INSERT INTO
                developers (%I)
            VALUES
                (%L)
            RETURNING *
        `,
        Object.keys(newDev),
        Object.values(newDev)
        );

        const queryResult: developerResult = await client.query(queryString);

        return res.status(201).json(queryResult.rows[0])

    }catch(error){
        if(error instanceof Error){
            return res.status(400).json({
              message: error.message,
            });
    }
    return res.status(500).json({
        message: 'Internal server error'
    })
}
}

const getAllDevelopers = async (req: Request, res:Response): Promise<Response> => {
    
    const queryString: string = `
        SELECT
            dev.id AS "developerID",
            dev.name AS "developerName",
            dev.email AS "developerEmail",
            di.id AS "developerInfoId",
            to_char(di."developerSince", 'YYYY/MM/DD') AS "developerInfoDeveloperSince",
            di."preferredOS" AS "developerInfopreferredOS"
        FROM 
            developers dev
        LEFT JOIN
            developers_info di ON dev."developerInfoId" = di.id;
    `
    const queryResult: developerResult = await client.query(queryString);
    
    return res.status(200).json(queryResult.rows)
}

const getAllDeveloperById = async (req: Request, res:Response): Promise<Response> => {
    
    const devId = req.params.id
    

    const queryString: string = `
        SELECT
            dev.id AS "developerID",
            dev.name AS "developerName",
            dev.email AS "developerEmail",
            di.id AS "developerInfoId",
            to_char(di."developerSince", 'YYYY/MM/DD') AS "developerInfoDeveloperSince",
            di."preferredOS" AS "developerInfopreferredOS"
        FROM 
            developers dev
        LEFT JOIN
            developers_info di ON dev."developerInfoId" = di.id
        WHERE
            dev.id = $1;
    `

    const queryConfig: QueryConfig = {
        text: queryString,
        values: [devId]
    }

    const queryResult: developerResult = await client.query(queryConfig);
    
    return res.status(200).json(queryResult.rows)
}

const getAllProjectsByDevId = async (req: Request, res:Response): Promise<Response> => { 
    // "developerID": 1,
    // "developerName": "Fabio",
    // "developerEmail": "fabio.jr@kenzie.com.br",
    // "developerInfoID": 2,
    // "developerInfoDeveloperSince": "2013-01-01T02:00:00.000Z",
    // "developerInfoPreferredOS": "Linux",
    // "projectID": 1,
    // "projectName": "Projeto 1",
    // "projectDescription": "Projeto fullstack",
    // "projectEstimatedTime": "2 dias",
    // "projectRepository": "url.com.br",
    // "projectStartDate": "2023-02-13T03:00:00.000Z",
    // "projectEndDate": null,
    // "technologyId": 1,
    // "technologyName": "JavaScript"
    const queryString: string = `
    SELECT 
        dev.id AS "developerID",
        dev.name AS "developerName",
        dev.email AS "developerEmail",
        dev.email AS "developerEmail",
        dev."developerInfoId" AS "developerInfoID",
        to_char(di."developerSince", 'YYYY/MM/DD') AS "developerInfoSince",
        di."preferredOS" AS "developerInfoPreferredOS",
        pr.id AS "projectID",
        pr.name AS "projectName",
        pr.description AS "projectDescription",
        pr."estimatedTime" AS "projectEstimatedTime",
        pr.repository AS "projectRepository",
        to_char(pr."startDate", 'YYYY/MM/DD') AS "projectStartDate",
        to_char(pr."endDate", 'YYYY/MM/DD') AS "projectEndDate",
        pr."developerId" AS "projectDeveloperID",
        pr."developerId" AS "projectDeveloperID",
        te.id AS "technologyID",
        te.name AS "technologyName"
    FROM
        projects pr
    LEFT JOIN
        projects_technologies pt ON pt."projectId" = pr.id
    LEFT JOIN
        technologies te ON te.id = pt."technologyId"
    LEFT JOIN
        developers dev ON dev.id = pr."developerId"
    LEFT JOIN
        developers_info di ON di.id = dev."developerInfoId"
    WHERE
        pr."developerId" = $1;
    `

    const queryConfig: QueryConfig = {
        text: queryString,
        values:[Number(req.params.id)]
    }

    const queryResult = await client.query(queryConfig)

    return res.status(200).json(queryResult.rows)
}

export { createNewDev, getAllDevelopers, getAllDeveloperById, getAllProjectsByDevId }