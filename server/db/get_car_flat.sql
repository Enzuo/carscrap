WITH max_last_seen AS (
	SELECT 
		MAX("lastDateSeen") AS "lastDateSeen"
	FROM "car_flat"
	WHERE "model" = $1
)
SELECT 
	"car_flat".*  
,	max_last_seen."lastDateSeen" <> "car_flat"."lastDateSeen" AS "isSold"

FROM "car_flat"
INNER JOIN max_last_seen ON 1=1
WHERE "model" = $1