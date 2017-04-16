/* takes all the car scrap entry and build a list of cars */
WITH group_cars AS (
	SELECT 
		  MAX("id")        AS "idScrap"
		, "imgPHash"       
		, MAX("model")     AS "model"
		, MAX("spec")      AS "spec"

		, EXTRACT(YEAR FROM MAX("year")) AS "year"
		, MAX("mileage")   AS "mileage"
		, MIN("price")     AS "price"

		, MIN("dateAdded") AS "dateAdded"
		, MAX("dateSeen")  AS "lastDateSeen"

		, MAX("title")     AS "title"
	FROM "car_scrap"
	GROUP BY "imgPHash"
)
, full_car_scraps AS (
	SELECT  
		  group_cars.*
		, "car_scrap"."imgName"
		, "car_scrap"."fuel"
		, "car_scrap"."gearbox"
		, "car_scrap"."departement"
		, "car_scrap"."source"
	FROM group_cars
	INNER JOIN "car_scrap" ON "car_scrap"."id" = group_cars."idScrap"
)
, car_to_update AS (
	SELECT
		  "car_flat"."id"
		, GREATEST(full_car_scraps."model", "car_flat"."model" ) AS "model"
		, GREATEST(full_car_scraps."spec", "car_flat"."spec" )   AS "spec"

		, GREATEST(full_car_scraps."year", "car_flat"."year" )       AS "year"
		, GREATEST(full_car_scraps."mileage", "car_flat"."mileage" ) AS "mileage"
		, LEAST(full_car_scraps."price", "car_flat"."price" )     AS "price"

		, LEAST(full_car_scraps."dateAdded", "car_flat"."dateAdded" )       AS "dateAdded"
		, GREATEST(full_car_scraps."lastDateSeen", "car_flat"."lastDateSeen" ) AS "lastDateSeen"

		, GREATEST(full_car_scraps."title", "car_flat"."title" )             AS "title"
		, GREATEST(full_car_scraps."imgName", "car_flat"."imgName" )         AS "imgName"
		, GREATEST(full_car_scraps."fuel", "car_flat"."fuel" )               AS "fuel"
		, GREATEST(full_car_scraps."gearbox", "car_flat"."gearbox" )         AS "gearbox"
		, GREATEST(full_car_scraps."departement", "car_flat"."departement" ) AS "departement"
		, GREATEST(full_car_scraps."source", "car_flat"."source" )           AS "source"
	FROM full_car_scraps
	INNER JOIN "car_flat" ON  full_car_scraps."imgPHash" = "car_flat"."imgPHash"
	                      AND full_car_scraps."model"    = "car_flat"."model"
)
, car_to_insert AS (
	SELECT
		full_car_scraps.*
	FROM full_car_scraps
	LEFT JOIN "car_flat" ON  full_car_scraps."imgPHash" = "car_flat"."imgPHash"
	                      AND full_car_scraps."model"    = "car_flat"."model"
	WHERE "car_flat" IS NULL
)
, update_car AS (
	UPDATE "car_flat" SET 
		  "model" = car_to_update."model"
		, "spec" = car_to_update."spec"
		, "year" = car_to_update."year"
		, "mileage" = car_to_update."mileage"
		, "price" = car_to_update."price"
		, "dateAdded" = car_to_update."dateAdded"
		, "lastDateSeen" = car_to_update."lastDateSeen"
		, "title" = car_to_update."title"
		, "imgName" = car_to_update."imgName"
		, "fuel" = car_to_update."fuel"
		, "gearbox" = car_to_update."gearbox"
		, "departement" = car_to_update."departement"
		, "source" = car_to_update."source"
	FROM car_to_update
	WHERE "car_flat"."id" = car_to_update."id"
)
, insert_car AS (
	INSERT INTO "car_flat" ("imgPHash", "model", "spec", "year", "mileage", "price", "dateAdded", "lastDateSeen", "title", "imgName", "fuel", "gearbox", "departement", "source" ) 
	SELECT "imgPHash", "model", "spec", "year", "mileage", "price", "dateAdded", "lastDateSeen", "title", "imgName", "fuel", "gearbox", "departement", "source" 
	FROM car_to_insert
)
SELECT * FROM "car_flat"