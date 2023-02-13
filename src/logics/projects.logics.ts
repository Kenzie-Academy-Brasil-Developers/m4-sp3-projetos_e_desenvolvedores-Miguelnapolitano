import { Request, Response } from 'express';
import { QueryConfig, QueryResult } from 'pg';
import format from 'pg-format';
import { client } from '../database';
import { iInsertTechnologyRequest, insertTechnologyResult, iProjectsRequest, iTechnologyRequest, projectResult, technologyResult } from '../interfaces/projects.interfaces'

const validadeRequestNewProject = (payload: any): iProjectsRequest => {
    const requestData: iProjectsRequest = payload;

    const requestKeys: Array<string> = Object.keys(requestData);

    const requiredKeys: Array<string> = ["name", "description", "estimatedTime", "repository", "startDate", "developerId"];
    
    const requestContainsAllRequiredKeys: boolean = requiredKeys.every((key: string) => requestKeys.includes(key));

    if (!requestContainsAllRequiredKeys) {
        throw new Error('Missing required keys: name, description, estimatedTime, repository, startDate, developerId.')
    }

    const requestContainsOnlyRequiredKeys: boolean = requestKeys.every((key: string) => requiredKeys.includes(key) || key == "endDate")
    
    if (!requestContainsOnlyRequiredKeys){
        if (requestKeys.includes("endDate")){
            const newProject = {
                name: requestData.name,
                description: requestData.description,
                estimatedTime: requestData.estimatedTime,
                repository: requestData.repository,
                startDate: requestData.startDate,
                endDate: requestData.endDate,
                developerId: requestData.developerId,
            } 
            return newProject
        }else{
            const newProject = {
                name: requestData.name,
                description: requestData.description,
                estimatedTime: requestData.estimatedTime,
                repository: requestData.repository,
                startDate: requestData.startDate,
                developerId: requestData.developerId,
               } 
            return newProject
        }
    }
    return requestData
}


const createNewProject = async (req: Request, res:Response): Promise<Response> => {
    try{
        const requestData = validadeRequestNewProject(req.body);

        const queryString: string = format(`
            INSERT INTO
                projects (%I)
            VALUES
                (%L)
            RETURNING *
        `, 
        Object.keys(requestData),
        Object.values(requestData))

        const queryResult: projectResult = await client.query(queryString);
        
        return res.status(201).json(queryResult.rows[0])

    }catch(error){
        if(error instanceof Error){
            return res.status(400).json({message: error.message})
        }
        return res.status(500).json({message: "Internal server error"})
    }
}

const validadeRequestNewTech = (payload: any): iTechnologyRequest => {
    const requestData: iTechnologyRequest = payload;

    const requestKeys: Array<string> = Object.keys(requestData);
    
    const requestContainsAllRequiredKeys: boolean = requestKeys.includes("name");

    if (!requestContainsAllRequiredKeys) {
        throw new Error('Missing required key: name')
    }

    enum nameTechsEnum { 'JavaScript', 'Python', 'React', 'Express.js', 'HTML', 'CSS', 'Django', 'PostgreSQL', 'MongoDB'}

    if (!(requestData.name in nameTechsEnum)){
        throw new Error('The only supported technologies are: JavaScript, Python, React, Express.js, HTML, CSS, Django, PostgreSQL, MongoDB')
    }

    const requestContainsOnlyRequiredKeys: boolean = requestKeys.every((key: string) => key == "name")
    
    if (!requestContainsOnlyRequiredKeys){
        const newTech = {
            name: requestData.name
        }
        return newTech           
    }   

    return requestData
}

const checkTechIsAlredyInsert = async (name: string, projectId: string, res: Response): Promise<Response | boolean> => {
    
    const queryStringForTechId: string =`
    SELECT 
        *
    FROM
        projects_technologies
    WHERE
        "projectId" = $1
    `
    const queryConfigForTechId: QueryConfig = {
        text: queryStringForTechId,
        values: [projectId]
    }

    const queryResultForTechId: projectResult = await client.query(queryConfigForTechId);

    const queryStringForTechName: string = `
        SELECT 
            *
        FROM
            technologies
        WHERE
            name = $1
        `

    const queryConfigForTechName: QueryConfig = {
        text: queryStringForTechName,
        values: [name]
    }

    const queryResultForTechName: projectResult = await client.query(queryConfigForTechName);

    const techId = queryResultForTechName.rows[0].id;
    const TechsInProject = queryResultForTechId.rows

    const projectHadTech: boolean = TechsInProject.some((tech: any) => tech.technologyId == techId)

    if(projectHadTech){
        return res.status(409).json(`The technology ${name} alredy exist in project ID: ${projectId}`)
    }

    return false
}

// const pagination  = async (req: Request, res:Response): Promise<Response> => {

//     //Fazer a paginação da inserção de tecnologia.

// }

const insertNewTech = async (req: Request, res:Response): Promise<Response> => {
    try{
        const requestData = validadeRequestNewTech(req.body)
        const techExistInProject = checkTechIsAlredyInsert(req.body.name, req.params.id, res)
        
        const queryStringTech: string = `
            SELECT 
                *
            FROM
                technologies
            WHERE
                name = $1
        `

        const queryConfigTech: QueryConfig = {
            text: queryStringTech,
            values: [requestData.name]
        }

        const queryResultTech: technologyResult = await client.query(queryConfigTech)

        const newInsert: iInsertTechnologyRequest = {
            addedIn: new Date().toLocaleDateString(),
            projectId: Number(req.params.id),
            technologyId: Number(queryResultTech.rows[0].id)
        }

        const queryStringInsert: string = format(`
            INSERT INTO 
                projects_technologies (%I)
            VALUES
                (%L)
            RETURNING *`,
            Object.keys(newInsert),
            Object.values(newInsert)
            )
           
        const queryResultInsert: insertTechnologyResult = await client.query(queryStringInsert);



        // const date = queryResultInsert.rows[0].addedIn.toString()
        // let dataObj = new Date(date);
        // let dataFormatada = dataObj.getFullYear() + "/" + (dataObj.getMonth() + 1) + "/" + dataObj.getDate();

        return res.status(201).json(queryResultInsert.rows[0])
    }catch(error){
        if (error instanceof Error){
            return res.status(400).json({message: error.message})
        }
        return res.status(500).json('Internal server error')
    }
}
export { createNewProject, insertNewTech }