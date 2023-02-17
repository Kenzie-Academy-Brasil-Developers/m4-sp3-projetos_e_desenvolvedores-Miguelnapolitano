import { Request, Response } from "express";
import { QueryConfig } from "pg";
import format from "pg-format";
import { client } from "../database";
import { developerResult } from "../interfaces/developers.interfaces";
import { iInfoRequest, iInfoRequestPatch, infoResult } from "../interfaces/devInfo.interfaces";

const validadeRequest = (payload: any): iInfoRequest => {
    const requestData: iInfoRequest = payload;

    const requestKeys: Array<string> = Object.keys(requestData);

    const requiredKeys: Array<string> = ["developerSince", "preferredOS"];
    
    const requestContainsAllRequiredKeys: boolean = requiredKeys.every((key: string) => requestKeys.includes(key));

    if (!requestContainsAllRequiredKeys) {
        throw new Error('Missing required keys: developerSince,preferredOS.')
    }

    const requestContainsOnlyRequiredKeys: boolean = requestKeys.every((key: string) => requiredKeys.includes(key))
    
    if (!requestContainsOnlyRequiredKeys){
            const newDev = {
             developerSince: requestData.developerSince, 
             preferredOS: requestData.preferredOS
            } 
            return newDev
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

    }catch(error: unknown){
        if(error instanceof Error){

        if(error.message.includes('invalid input value for enum os')){
            return res.status(400).json({message: 'Invalid OS option.', Options: [ 'Windows', 'Linux', 'MacOS' ]})
        }else{
            return res.status(400).json({message: error.message})
        }        
    }
    return res.status(500).json({
        message: 'Internal server error'
    })
}}

const validadeRequestToEditInfo = async (payload: any): Promise<iInfoRequestPatch> => {
    const requestData = payload;

    const requestKeys: Array<string> = Object.keys(requestData);

    if(!(requestKeys.some((key: string) => key == "preferredOS" || key == "developerSince"))){
        throw new Error('At least one of keys "preferredOS" or "developerSince" must be send.')
    }else if(requestKeys.some((key: string) => key == "preferredOS") && (requestKeys.some((key: string) => key == "developerSince"))){
        
        if(!(requestData.preferredOS == "Linux" || requestData.preferredOS == "Windows" || requestData.preferredOS =="MacOS")){
            throw new Error
        }
        const newPatch = {
            preferredOS: requestData.preferredOS,
            developerSince: requestData.developerSince
        }
        return newPatch
    }else if (requestKeys.some((key: string) => key == "preferredOS")){
        if(!(requestData.preferredOS == "Linux" || requestData.preferredOS == "Windows" || requestData.preferredOS =="MacOS")){
            throw new Error('The only suported options for "preferredOS" are: "Linux", "Windows" or "MacOS".')
        }
        const newPatch = {
            preferredOS: requestData.preferredOS
        }
        return newPatch
    }else if (requestKeys.some((key: string) => key == "developerSince")){
        const newPatch = {
            developerSince: requestData.developerSince
        }
        return newPatch
    }
    
    return payload
}

const editDevIndo = async (req: Request, res:Response): Promise<Response> => {
    try{
        const requestData = await validadeRequestToEditInfo(req.body);

        const queryStringForInfoId: string = `
            SELECT
                *
            FROM
                developers
            WHERE
                id = $1
        `

        const queryConfigForInfoId: QueryConfig = {
            text: queryStringForInfoId,
            values:[req.params.id]
        }
        
        const queryResultForInfoId: developerResult = await client.query(queryConfigForInfoId);

        const developerInfoId: number = Number(queryResultForInfoId.rows[0].developerInfoId);

        const queryStringToPatchInfo: string = format(`
            UPDATE
                developers_info
            SET (%I) = ROW (%L)
            WHERE
                id = (%L)
            RETURNING *
        `, Object.keys(requestData),
            Object.values(requestData),
            developerInfoId);
        
        const queryResultToPatchInfo = await client.query(queryStringToPatchInfo);

        return res.status(200).json(queryResultToPatchInfo.rows[0])

    }catch(error){
        if(error instanceof Error){
            return res.status(400).json({message: error.message,
            options: ["Windows", "Linux", "MacOS"]})
        }
        return res.status(500).json('Internal server error')
    }
}

export { createDevInfo, editDevIndo}