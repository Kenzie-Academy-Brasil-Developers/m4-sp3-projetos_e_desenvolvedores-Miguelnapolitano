import { QueryResult } from "pg";

interface iDeveloperRequest {
    name: string,
    email: string,
    developerInfoId?: number | null
};

interface iDeveloper extends iDeveloperRequest {
    id: number
};

type developerResult = QueryResult<iDeveloper>;

export { iDeveloperRequest ,iDeveloper, developerResult };