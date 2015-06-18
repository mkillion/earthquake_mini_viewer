<cfset i = 30>

<cfloop index="j" from="1" to="840">
	<cfquery name="qCalc" datasource="gis_webinfo">
		insert into earthquakes_30_day_period values(sysdate - #i#, sysdate - #j#, (select count(*) from earthquakes where state = 'KS' and the_date >= sysdate - #i# and the_date < sysdate - #j#))
	</cfquery>

	<cfset i = i + 1>
</cfloop>