/* takes all the car scrap entry and build a list of cars */
WITH group_cars AS (
	SELECT 
		  MAX("id")        AS "id"
		, "imgPHash"       
		, MIN("dateAdded") AS "dateAdded"
		, MAX("dateSeen")  AS "lastDateSeen"
		, MAX("model")     AS "model"
		, MAX("title")     AS "title"
		, EXTRACT(YEAR FROM MAX("year")) AS "year"
		, MAX("mileage")   AS "mileage"
		, MIN("price")     AS "price"
	FROM "car_ads"
	GROUP BY "imgPHash"
)
SELECT  
	  group_cars.*
	, "car_ads"."departement"
	, "car_ads"."fuel"
	, "car_ads"."source"
	, "car_ads"."gearbox"
	, "car_ads"."imgName"
FROM group_cars
INNER JOIN "car_ads" ON "car_ads"."id" = group_cars."id"

/* TODO insert or update */