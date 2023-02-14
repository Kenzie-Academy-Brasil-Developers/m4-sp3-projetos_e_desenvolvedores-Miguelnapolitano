CREATE TYPE os AS ENUM ('Windows', 'Linux', 'MacOS');

CREATE TABLE developers_info (
	"id" SERIAL PRIMARY KEY,
	"developerSince" DATE NOT NULL,
	"preferedOs" os NOT NULL
);

CREATE TABLE developers (
	"id" SERIAL PRIMARY KEY,
	"name" VARCHAR(50) NOT NULL,
	"email" VARCHAR(50) NOT NULL,
	"developerInfoId" INTEGER UNIQUE,
	FOREIGN KEY ("developerInfoId") REFERENCES developers_info("id") ON DELETE CASCADE
);

CREATE TABLE projects (
	"id" SERIAL PRIMARY KEY,
	"name" VARCHAR(50) NOT NULL,
	"description" TEXT NOT NULL,
	"estimatedTime" VARCHAR(20) NOT NULL,
	"repository" VARCHAR(120) NOT NULL,
	"startDate" DATE NOT NULL,
	"endDate" DATE,
	"developerId" INTEGER NOT NULL,
	FOREIGN KEY ("developerId") REFERENCES developers("id") ON DELETE CASCADE
);

CREATE TABLE technologies (
	"id" SERIAL PRIMARY KEY,
	"name" VARCHAR(30) NOT NULL
);

INSERT INTO technologies (name)
VALUES ('JavaScript'), ('Python'), ('React'), ('Express.js'), ('HTML'), ('CSS'), ('Django'), ('PostgreSQL'), ('MongoDB');

CREATE TABLE projects_technologies (
	"id" SERIAL PRIMARY KEY,
	"addedIN" DATE NOT NULL,
	"projectID" INTEGER NOT NULL,
	FOREIGN KEY ("projectID") REFERENCES projects(id),
	"technologyID" INTEGER NOT NULL ON DELETE CASCADE,
	FOREIGN KEY ("technologyID") REFERENCES technologies(id)
);