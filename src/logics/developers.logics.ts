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
            di."developerSince" AS "developerInfoDeveloperSince",
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
            di."developerSince" AS "developerInfoDeveloperSince",
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

export { createNewDev, getAllDevelopers, getAllDeveloperById }