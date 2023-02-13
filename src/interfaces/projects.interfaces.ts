import { QueryResult } from 'pg';

interface iProjectsRequest {
    name: string,
    description: string,
    estimatedTime: string,
    repository: string,
    startDate: string,
    endDate?: string | undefined,
    developerId: number
};

interface iProject extends iProjectsRequest {
    id: number
};

type projectResult = QueryResult<iProject>;

interface iTechnologyRequest {
    name: 'JavaScript' | 'Python' | 'React' | 'Express.js' | 'HTML' | 'CSS' | 'Django' | 'PostgreSQL' | 'MongoDB'
}

interface iTechnology extends iTechnologyRequest{
    id: number
}

type technologyResult = QueryResult<iTechnology>

interface iInsertTechnologyRequest {
    addedIn: string,
    projectId: number,
    technologyId: number
}

interface iInsertTechnology extends iInsertTechnologyRequest {
    id: number
}

type insertTechnologyResult = QueryResult<iInsertTechnology>

export { iProjectsRequest, projectResult,iTechnologyRequest, technologyResult, iInsertTechnologyRequest, insertTechnologyResult, iInsertTechnology };