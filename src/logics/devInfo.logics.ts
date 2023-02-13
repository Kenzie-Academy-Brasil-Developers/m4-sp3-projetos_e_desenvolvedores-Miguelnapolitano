import { Request, Response } from "express";
import { QueryConfig } from "pg";
import format from "pg-format";
import { client } from "../database";
import { iInfoRequest, infoResult } from "../interfaces/devInfo.interfaces";

const validadeRequest = (payload: any): iInfoRequest => {
    const requestData: iInfoRequest = payload;

    enum preferredOSEnum {'Windows', 'Linux', 'MacOS'}

    const requestKeys: Array<string> = Object.keys(requestData);

    const requiredKeys: Array<string> = ["developerSince", "preferredOS"];
    
    const requestContainsAllRequiredKeys: boolean = requiredKeys.every((key: string) => requestKeys.includes(key));

    if (!requestContainsAllRequiredKeys) {
        throw new Error('Missing required keys: developerSince,preferredOS.')
    }

    const requestContainsOnlyRequiredKeys: boolean = requestKeys.every((key: string) => requiredKeys.includes(key))
    
    if (!requestContainsOnlyRequiredKeys){
        if (requestData.preferredOS in preferredOSEnum){
            const newDev = {
             developerSince: requestData.developerSince, 
             preferredOS: requestData.preferredOS
            } 
            return newDev
        }
        throw new Error('message: Invalid OS option. Options: [ Windows, Linux, MacOS ]')
    }
    
    if(!(requestData.preferredOS in preferredOSEnum)){
        throw new Error('message: Invalid OS option. Options: [ Windows, Linux, MacOS ]')
    }

    return requestData
}

const createDevInfo = async (req: Request, res:Response): Promise<Response> => {
    try{
        const requestData: Object = validadeRequest(req.body);

        const queryString: string = format(`
         INSERT INTO 
                developers_info (%I)
         VALUES
                (%L)
        RETURNING *
        `, 
        Object.keys(requestData),
        Object.values(requestData)
        )

        const queryResult: infoResult = await client.query(queryString);

        const devIfoId: number = queryResult.rows[0].id;
        
        const devId: string = req.params.id;

        const queryStringInfoIdToDevelopers: string = `
            UPDATE developers
            SET "developerInfoId" = ($1)
            WHERE id = $2
            RETURNING *          
        `

        const queryConfig: QueryConfig = {
            text: queryStringInfoIdToDevelopers,
            values: [devIfoId, devId]
        }
        
        await client.query(queryConfig);

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
}}

export { createDevInfo}