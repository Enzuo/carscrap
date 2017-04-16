--DROP TABLE IF EXISTS "car_scrap";
/* Store scraped car ads */
CREATE TABLE IF NOT EXISTS "car_scrap" (
	  "id"   SERIAL 

	, "imgPHash" uuid
	, "model" VARCHAR(80)
	, "spec"  VARCHAR(80)

	, "year" DATE
	, "mileage" INTEGER
	, "price" INTEGER

	, "dateAdded" DATE
	, "dateSeen" DATE DEFAULT CURRENT_DATE

	, "title" VARCHAR(255)
	, "imgName" TEXT
	, "fuel" VARCHAR(50)
	, "gearbox" VARCHAR(50)
	, "departement" VARCHAR(5)
	, "location" VARCHAR(255)
	, "source" VARCHAR(255)
	, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, PRIMARY KEY ("id")
);

/* Store computed result of all scraped cars ads */
DROP TABLE IF EXISTS "car_flat";
CREATE TABLE IF NOT EXISTS "car_flat" (
	  "id" SERIAL

	, "imgPHash" uuid    
	, "model" VARCHAR(80)
	, "spec" VARCHAR(80)

	, "year" INTEGER
	, "mileage" INTEGER
	, "price" INTEGER

	, "dateAdded" DATE
	, "lastDateSeen" DATE

	, "title" VARCHAR(255)
	, "imgName" VARCHAR(255)
	, "fuel" VARCHAR(50)
	, "gearbox" VARCHAR(50)
	, "departement" VARCHAR(5)
	, "source" VARCHAR(255)

	, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

	, PRIMARY KEY ("id")
);

CREATE OR REPLACE FUNCTION "updateDateUpdated"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."updatedAt" IS NULL THEN
    NEW."updatedAt" = now(); 
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "car_flat_updateDateUpdated" BEFORE UPDATE
  ON "car_flat"
  FOR EACH ROW
  EXECUTE PROCEDURE "updateDateUpdated"()
;