import { QueryResult } from 'pg';

interface iInfoRequest {
    developerSince: string,
    preferredOS: 'Windows' | 'Linux' | 'MacOS';
};

interface iInfo extends iInfoRequest {
    id: number
};

type infoResult = QueryResult<iInfo>;

export { iInfoRequest ,iInfo, infoResult };