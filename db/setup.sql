--DROP TABLE IF EXISTS "car_ads";
CREATE TABLE IF NOT EXISTS "car_ads" (
	  "id"   SERIAL 

	, "imgPHash" uuid
	, "title" VARCHAR(255)
	, "model" VARCHAR(255)
	, "year" DATE

	, "mileage" INTEGER
	, "imgName" TEXT
	, "fuel" VARCHAR(50)
	, "gearbox" VARCHAR(50)

	, "dateAdded" DATE
	, "dateSeen" DATE DEFAULT CURRENT_DATE
	, "location" VARCHAR(255)
	, "departement" VARCHAR(5)
	, "source" VARCHAR(255)
	, "price" INTEGER
	, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, PRIMARY KEY ("id")
);