import { Request, Response, NextFunction } from 'express';
import { QueryConfig } from 'pg';
import { client } from '../database';
import { developerResult } from '../interfaces/developers.interfaces';


const checkDevInfoId = async (req: Request, res:Response, next: NextFunction): Promise<Response | void> => {
    
    const devId: string = req.params.id;

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

    const queryResult: developerResult = await client.query(queryConfig);
    
    if (queryResult.rows[0].developerInfoId){

        return res.status(400).json('Developer infos already exists.')
        
    }

    return next()
}

export { checkDevInfoId }