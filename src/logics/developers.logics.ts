import { request, Request, Response } from 'express';
import { QueryConfig } from 'pg';
import format from 'pg-format';
import { client } from '../database';
import { developerResult, iDeveloperRequest, iDeveloperRequestPatch } from '../interfaces/developers.interfaces';

const validadeRequest = (payload: any): iDeveloperRequest => {
    const requestData: iDeveloperRequest = payload;

    const requestKeys: Array<string> = Object.keys(requestData);

    const requiredKeys: Array<string> = ["name", "email"];
    
    const requestContainsAllRequiredKeys: boolean = requiredKeys.every((key: string) => requestKeys.includes(key));

    if (!requestContainsAllRequiredKeys) {
        if(!(requestKeys.includes('name')) && !(requestKeys.includes('email'))){
            throw new Error('name and email')
        }else if(requestKeys.includes('name')){
            throw new Error('email.')
        }else if(requestKeys.includes('email')){
            throw new Error('name.')
        }}

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
            if (error.message.includes('name and email')){
                return res.status(400).json({message: 'Missing required keys: name and email'})
            }else if(error.message.includes('email')){
                return res.status(400).json({message: error.message})
            }else if(error.message.includes('name')){
                return res.status(400).json({message: error.message})
            }
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
    
    return res.status(200).json(queryResult.rows[0])
}

const getAllProjectsByDevId = async (req: Request, res:Response): Promise<Response> => { 

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

const validatePatchRequest = async (payload: any): Promise<Response | iDeveloperRequestPatch | undefined> => { 
    const requestData: iDeveloperRequest = payload;

    const requestKeys: Array<string> = Object.keys(requestData);

    const requiredKeys: Array<string> = ["name", "email"];
    
    const requestContainsRequiredKeys: boolean = requiredKeys.some((key: string) => requestKeys.includes(key));

    if (!requestContainsRequiredKeys) {
        throw new Error('missing required keys')
    }

    const requestContainsOnlyRequiredKeys: boolean = requestKeys.every((key: string) => requiredKeys.includes(key)); 

    if(requestKeys.includes("email")){        
        
        const queryString: string =`
            SELECT * FROM developers WHERE email = $1;
        `        
        const queryConfig: QueryConfig = {
            text: queryString,
            values: [requestData.email]
        }

        const queryResult: developerResult = await client.query(queryConfig);

        if (queryResult.rows[0]){
            throw new Error('Email alredy exist.')
        }   
                  
        if (!requestContainsOnlyRequiredKeys){        
            if (requestKeys.includes("name")){
                    const patchDev = {
                        name: requestData.name,
                        email: requestData.email,
                    }            
                    return patchDev
            }else{
                const patchDev = {
                    email: requestData.email
                }
                return patchDev
            }
        }
    }else {
        const patchDev = {
            name: requestData.name
        }
        return patchDev
    }
    return requestData
}

const editDeveloper = async (req: Request, res:Response): Promise<Response | undefined> => {
    try{
        const requestData = await validatePatchRequest(req.body);        
         
        if( requestData != undefined){

             const queryString: string = format (`
             UPDATE
                 developers
             SET (%I) = ROW(%L)
             WHERE
                 id = $1
             RETURNING *;
             `,
             Object.keys(requestData),
             Object.values(requestData)
             )
     
             const queryConfig: QueryConfig = {
                 text: queryString,
                 values: [req.params.id]
             }
     
             const queryResult: developerResult = await client.query(queryConfig)
     
             return res.status(200).json(queryResult.rows[0])
         }

    }catch(error){
        if(error instanceof Error){
            if(error.message.includes('missing required keys')){
                return res.status(400).json({message: 'At least one of those keys must be send.', keys: ['name', 'email']})
            }
            return res.status(400).json({
              message: error.message,
            });
    }
    return res.status(500).json({
        message: 'Internal server error'
    })
}}

const deleteDeveloper = async (req: Request, res:Response): Promise<Response> => {

    try{
        const queryString: string = `
            SELECT * FROM developers WHERE id = $1
        ` 
        const queryConfig: QueryConfig = {
            text: queryString,
            values: [req.params.id]
        }
    
        const queryResult: developerResult = await client.query(queryConfig);
    
        const devInfoId: number = Number(queryResult.rows[0].developerInfoId)
    
        const queryStringForDelete: string = `
            DELETE FROM developers_info WHERE id = $1
        `
    
        const queryConfigForDelete: QueryConfig = {
            text: queryStringForDelete,
            values: [devInfoId]
        }
    
        client.query(queryConfigForDelete)
    
        return res.status(204).json()

    }catch(error){
        if(error instanceof Error){
            return res.status(400).json({message: error.message})
        }
        return res.status(500).json('Internal server error.')
    }


}

export { createNewDev, getAllDevelopers, getAllDeveloperById, getAllProjectsByDevId, editDeveloper, deleteDeveloper }