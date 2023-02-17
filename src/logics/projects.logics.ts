import { Request, Response, text } from 'express';
import { QueryConfig, QueryResult } from 'pg';
import format from 'pg-format';
import { client } from '../database';
import { iInsertTechnology, iInsertTechnologyRequest, insertTechnologyResult, iPagination, iProjectsRequest, iProjectsRequestPatch, iTechnologyRequest, paginationResult, projectResult, technologyResult } from '../interfaces/projects.interfaces'

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
        throw new Error('Technology not supported')
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
        return true
    }

    return false
}

const createPagination = async (techAdded: iInsertTechnology): Promise<iPagination | any> => {

    const queryString: string = `
    SELECT 
        te.id AS "technologyId",
        te.name AS "technologyName",
        pr.id AS "projectId", 
        pr.name AS "projectName",
        pr.description AS "projectDescription" ,
        pr."estimatedTime" AS "projectEstimatedTime",
        pr.repository  AS "projectRepository",
        pr."startDate" AS "projectStartDate",
        pr."endDate" AS "projectEndDate"
    FROM projects_technologies pt
    JOIN projects_technologies ON pt.id = $1
    JOIN projects pr ON pr.id = $2
    JOIN technologies te ON te.id = $3;
    `

    const queryConfig: QueryConfig = {
        text: queryString,
        values: [techAdded.id, techAdded.projectId, techAdded.technologyId]
    }

    const queryResult: paginationResult = await client.query(queryConfig)

    return queryResult.rows[0]
    // const date = queryResultInsert.rows[0].addedIn.toString()
    // let dataObj = new Date(date);
    // let dataFormatada = dataObj.getFullYear() + "/" + (dataObj.getMonth() + 1) + "/" + dataObj.getDate();

}

const insertNewTech = async (req: Request, res:Response): Promise<Response> => {
    try{
        const requestData = validadeRequestNewTech(req.body);
        const techExistInProject = await checkTechIsAlredyInsert(req.body.name, req.params.id, res)
        
        if(!techExistInProject){

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

            const pagination: iPagination = await createPagination(queryResultInsert.rows[0])
    
            return res.status(201).json(pagination)
        }else{
            return res.status(404).json(`The technology ${requestData.name} alredy exist in project ID: ${req.params.id}`)
        }

    }catch(error){
        if (error instanceof Error){
            if (error.message.includes('Technology not supported')){
                return res.status(400).json({message: 'Technology not supported.',
                options: [
                    'JavaScript',
                    'Python',
                    'React',
                    'Express.js',
                    'HTML',
                    'CSS',
                    'Django',
                    'PostgreSQL',
                    'MongoDB'
                ]
            })
            }
            return res.status(400).json({message: error.message})
        }
        return res.status(500).json('Internal server error')
    }
}

const getAllProjects = async (req: Request, res:Response): Promise<Response> => {

    const queryString: string = `
    SELECT 
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
        technologies te ON te.id = pt."technologyId";
    `
    const queryResult = await client.query(queryString)

    return res.status(200).json(queryResult.rows)
}

const getProjectsById = async (req: Request, res:Response): Promise<Response> => { 

    const queryString: string = `
    SELECT 
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
    WHERE
        pr.id = $1;
    `

    const queryConfig: QueryConfig = {
        text: queryString,
        values:[Number(req.params.id)]
    }

    const queryResult = await client.query(queryConfig)

    return res.status(200).json(queryResult.rows)
}

const validadeRequestProjectPatch = (payload: any): iProjectsRequestPatch => {
    
    const requestKeys: Array<string> = Object.keys(payload)

    const requiredKeys: Array<string> = ["name", "description", "estimatedTime", "repository", "startDate", "endDate", "developerId"]

    const requestContainsRequiredKeys: boolean = requiredKeys.some((key: string) => requestKeys.includes(key))

    if(!requestContainsRequiredKeys){
        throw new Error('At least one of those keys must be send: "name","description","estimatedTime","repository","startDate","endDate" or "developerId".')
    }

    const allowedKeysInRequest: Array<string> = requestKeys.filter((key: string) => requiredKeys.includes(key))
    
    const projectPatch: any = {}

    allowedKeysInRequest.forEach((key: string) => { 
        projectPatch[key] = payload[key]
     })

    return projectPatch
}

const editProjectsById = async (req: Request, res:Response): Promise<Response> => {
    try{
        const requestData: iProjectsRequestPatch = validadeRequestProjectPatch(req.body)

        const queryString: string = format (`
             UPDATE
                 projects
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

             const queryResult: projectResult = await client.query(queryConfig);

        return res.status(200).json(queryResult.rows[0]);

    }catch(error){
        if(error instanceof Error){
            return res.status(400).json({message: error.message});
        }
        return res.status(500).json('Internal server error.');
    }
}


const deleteTech = async (req: Request, res:Response): Promise<Response> => {


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

    const queryResult: technologyResult = await client.query(queryConfig);

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

    const relId: number = Number(queryResultForCheck.rows[0].id);
    
    const queryStringForDelete: string = `
        DELETE FROM projects_technologies WHERE id = $1
    `
    const queryConfigForDelete: QueryConfig = {
        text: queryStringForDelete,
        values: [relId]
    }

    await client.query(queryConfigForDelete);

    return res.status(204).json()
}

const deleteProject = async (req: Request, res:Response): Promise<Response> => {

    const queryString: string = `
     DELETE FROM projects WHERE id = $1
    `;

    const queryConfig: QueryConfig = {
        text: queryString,
        values:[req.params.id]
    };

    await client.query(queryConfig)

    return res.status(204).json()
}

export { createNewProject, insertNewTech, getAllProjects, getProjectsById, editProjectsById, deleteTech, deleteProject}