import { QueryResult } from 'pg';

interface iDeveloperRequest {
    name: string,
    email: string,
    developerInfoId?: number | null
};

interface iDeveloper extends iDeveloperRequest {
    id: number
};

type developerResult = QueryResult<iDeveloper>;

interface iDeveloperRequestPatch {
    name?: string | null,
    email?: string | null,
    developerInfoId?: number | null
};

export { iDeveloperRequest ,iDeveloper, developerResult, iDeveloperRequestPatch };