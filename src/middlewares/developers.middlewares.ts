import { Request, Response, NextFunction, response } from 'express';
import { QueryConfig } from 'pg';
import { client } from '../database';
import { developerResult, iDeveloper, iDeveloperRequest } from '../interfaces/developers.interfaces';

const chekDevEmail = async (req: Request, res: Response, next: NextFunction): Promise<Response | void>  => {
    const email: string = req.body.email;

    const queryString: string = `
    SELECT
        *
    FROM
        developers
    WHERE
        email = $1
    `;

    const queryConfig: QueryConfig = {
        text: queryString,
        values: [email]
    }

    const queryResult: developerResult = await client.query(queryConfig)

    if(queryResult.rows[0]){
        return res.status(409).json('Email alredy exists.')
    }

    next()
}

const chekDevID = async (req: Request, res: Response, next: NextFunction): Promise<Response | void>  => {
    const devId: string = req.params.id;

    const queryString: string = `
    SELECT
        *
    FROM
        developers
    WHERE
        id = $1
    `;

    const queryConfig: QueryConfig = {
        text: queryString,
        values: [devId]
    }

    const queryResult: developerResult = await client.query(queryConfig)

    if(!queryResult.rows[0]){
        return res.status(409).json(`Developer ID: ${devId} do not exists.`)
    }

    next()
}

export { chekDevEmail, chekDevID }