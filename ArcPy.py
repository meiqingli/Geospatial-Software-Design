#Meiqing Li, meiqing@design.upenn.edu
#CPLN670 Geospatical Software Design
#Professor Dana Tomlin
#December 20, 2017


#Validation of Normalized Difference Urban Index (NDUI) in California with Socio-Economic Data

"""
This script first joins the output csv tables containing the normalized urban difference index (NUDI) calculated in Google Earth Engine from the earlier part of this project. 
It then validates index by aggregating socio-economic and spatial data from ACS census and OSM
to the same geographic units of analysis (i.e. county, MSA) with the previous output from raster calculation. Finally it outputs a standardized table for more robust statistical analysis.

The tool consists of three parts:
1) Join NUDI tables to their corresponding Count/MSA shapefiles;
2) Calculate road length (or building area) of OSM features, spatially join OSM raod/building features to their correponding geographic unit of analysis, and summarize;
3) Join socio-economic tables to the output shapefiles from previous steps, and calculate Pearson Correlations.

It requires the following inputs:
1. NUDI tables by county and MSA from Google Earth Engine project;
2. County and MSA boundary shapefiles;
3. OSM road and building shapefiles;
4. Tables ACS 5-Year Census.

Data sources: 
Normalized Urban Different Index (NUDI) for each geographic unit of analysis is calculated based on day and night remote sensing imagery (see Google Earth Engine project).
County and MSA shapefiles are from US Census Bureau, Cartographic Boundary Shapefiles: https://www.census.gov/geo/maps-data/data/tiger-cart-boundary.html
OSM shapefiles of California are downloaded from: http://download.geofabrik.de/north-america.html
Other data preprocessing includes setting standardized projection of input shapefiles, final calculation of the Pearson Correlation based on output of summary statistics.
"""



#       ***The project consists of three parts. This is the first part of the script.***

"""
Following is the instruction for applying the tool to join NDUI table (input should be in dbf format) to the input shapefiles based on County/MSA name,
and export a new shapefile:

To create an ArcToolbox tool with which to execute this script, do the following.
1   In  ArcMap > Catalog > Toolboxes > My Toolboxes, either select an existing toolbox
    or right-click on My Toolboxes and use New > Toolbox to create (then rename) a new one.
2   Drag (or use ArcToolbox > Add Toolbox to add) this toolbox to ArcToolbox.
3   Right-click on the toolbox in ArcToolbox, and use Add > Script to open a dialog box.
4   In this Add Script dialog box, use Label to name the tool being created, and press Next.
5   In a new dialog box, browse to the .py file to be invoked by this tool, and press Next.
6   In the next dialog box, specify the following inputs (using dropdown menus wherever possible)
    before pressing OK or Finish.
        DISPLAY NAME        DATA TYPE       PROPERTY>DIRECTION>VALUE       
        Input Shapefile     Shapefile		Input
		NUDI Table			Data Table		Input
		Join Field 1		String			Input
		Join Field 2		String			Input
        Output Shapefile    Shapefile  		Output
		
7   The PROPERTIES > VALIDATION TAB should then be specified as follows.

import arcpy
class ToolValidator():
  
  def __init__(self):
    import arcpy
    self.params = arcpy.GetParameterInfo()
    return

  def initializeParameters(self):
    # SET DEFAULT TITLE
    self.params[1].value = "??"    #Self refers to the dialog box
    return
                                    
  def updateMessages(self):
    if self.params[1].value[-1] != "f":
      self.params[1].setWarningMessage("Please specify a dbf table.")
    return

8   To later revise any of this, right-click to the tool's name and select Properties.           
"""

# Import external modules
import sys, os, string, math, arcpy, traceback, numpy

# Allow output to overwrite any existing grid of the same name
arcpy.env.overwriteOutput = True

# If Spatial Analyst license is available, check it out
if arcpy.CheckExtension("spatial") == "Available":
    arcpy.CheckOutExtension("spatial")
    
    try:
        # Request user input of data type = Feature Layer and direction = Input
        InputShapefile      = arcpy.GetParameterAsText(0)
        JoinTable          	= arcpy.GetParameterAsText(1)
        InputField         	= arcpy.GetParameterAsText(2)
        JoinField        	= arcpy.GetParameterAsText(3)
        OutputShapefile     = arcpy.GetParameterAsText(4)
		
        # Replicate the input shapefile
        arcpy.Copy_management(InputShapefile, OutputShapefile)

        # Join user-specified NUDI table to corresponding shapefile
        arcpy.JoinField_management(in_data=OutputShapefile, in_field=InputField, join_table=JoinTable, join_field=JoinField)
				        
    except Exception as e:
        # If unsuccessful, end gracefully by indicating why
        arcpy.AddError('\n' + "Script failed because: \t\t" + e.message )
        # ... and where
        exceptionreport = sys.exc_info()[2]
        fullermessage   = traceback.format_tb(exceptionreport)[0]
        arcpy.AddError("at this location: \n\n" + fullermessage + "\n")
        
    # Check in Spatial Analyst extension license
    arcpy.CheckInExtension("spatial")      
else:
    print "Spatial Analyst license is " + arcpy.CheckExtension("spatial")



#       ***The project consists of three parts. This is the second part of the script.***

"""
Following is the instruction for applying the tool to calculate the length of OSM road line shapefile, or area of building polygon shapefile,
spatially join these features to the county and MSA shapefiles with NUDI joined from previous steps, and output a new shapefile with the summary
of road length and building area in each unit of analysis.

Input OSM shapefiles are required to be projected in the same state plane projection with the county/MSA shapefile. 
In this example, make sure input shapefiles are projected to 'NAD_1983_2011_StatePlane_California_III_FIPS_0403_Ft_US'.

To create an ArcToolbox tool with which to execute this script, do the following.
1   In  ArcMap > Catalog > Toolboxes > My Toolboxes, either select an existing toolbox
    or right-click on My Toolboxes and use New > Toolbox to create (then rename) a new one.
2   Drag (or use ArcToolbox > Add Toolbox to add) this toolbox to ArcToolbox.
3   Right-click on the toolbox in ArcToolbox, and use Add > Script to open a dialog box.
4   In this Add Script dialog box, use Label to name the tool being created, and press Next.
5   In a new dialog box, browse to the .py file to be invoked by this tool, and press Next.
6   In the next dialog box, specify the following inputs (using dropdown menus wherever possible)
    before pressing OK or Finish.
        DISPLAY NAME        DATA TYPE       PROPERTY>DIRECTION>VALUE       
        Road / Building		Shapefile		Input
        County / MSA		Shapefile		Input
        Output    		    Shapefile  		Output
		
7   To later revise any of this, right-click to the tool's name and select Properties.           
"""

# Import external modules
import sys, os, string, math, arcpy, traceback, numpy

# Allow output to overwrite any existing grid of the same name
arcpy.env.overwriteOutput = True

# If Spatial Analyst license is available, check it out
if arcpy.CheckExtension("spatial") == "Available":
    arcpy.CheckOutExtension("spatial")
    
    try:
        # Request user input of data type = Feature Layer and direction = Input
        Road_Building		= arcpy.GetParameterAsText(0)
        County_MSA         	= arcpy.GetParameterAsText(1)
        Output     		    = arcpy.GetParameterAsText(2)
		
        # Define intermediate Shapefile to store temporary outputs
        IntermediateShapefile = Output[:-4] + "_temp" + ".shp"
	
        # Replicate the input shapefile
        arcpy.Copy_management(Road_Building, IntermediateShapefile)	
	
        # Calculate length or area of each input feature (road is polyline while building is polygon)
        desc = arcpy.Describe(IntermediateShapefile)
        if desc.shapeType == "Polyline":
            arcpy.AddField_management(IntermediateShapefile, "FEET", "DOUBLE", 20, 5)
            arcpy.CalculateField_management(IntermediateShapefile,"FEET","!shape.length@feet!","PYTHON_9.3")
        else:
            arcpy.AddField_management(IntermediateShapefile, "SQFT", "DOUBLE", 20, 5)
            arcpy.CalculateField_management(IntermediateShapefile,"SQFT","!shape.area@squarefeet!","PYTHON_9.3")	
		
        
        # Spatial join and summarize road polyline or building polygon features to each unit of analysis
        targetFeatures  = County_MSA 
        joinFeatures    = IntermediateShapefile # The road/building features with calculated length or area
        outputFeatures  = Output  
  
        # create a list of fields to sum  
        fieldNamesToSum = ['FEET', 'SQFT']  
  
        # create the field mapping object  
        fieldMappings = arcpy.FieldMappings()  
  
        # populate the field mapping object with the fields from both feature classes  
        fieldMappings.addTable(targetFeatures)  
        fieldMappings.addTable(joinFeatures)  
  
        # loop through the field names to sum  
        for fieldName in fieldNamesToSum:  
  
            # get the field map index of this field and get the field map  
            fieldIndex = fieldMappings.findFieldMapIndex(fieldName)      
            fieldMap = fieldMappings.getFieldMap(fieldIndex)  
  
            # update the field map with the new merge rule (by default the merge rule is 'First')  
            fieldMap.mergeRule = 'Sum'  
  
            # replace with the updated field map  
            fieldMappings.replaceFieldMap(fieldIndex, fieldMap)  
  
        arcpy.SpatialJoin_analysis(targetFeatures, joinFeatures, outputFeatures, "JOIN_ONE_TO_ONE", "KEEP_ALL", fieldMappings, "INTERSECT", "", "")
    
        # Since each shapefile-generating method (unlike grid-generating methods) immediately writes its output to disk,
        # final results need not be explicitly saved, but intermediate results must be explicitly deleted.
        arcpy.Delete_management(IntermediateShapefile)
				        
    except Exception as e:
        # If unsuccessful, end gracefully by indicating why
        arcpy.AddError('\n' + "Script failed because: \t\t" + e.message )
        # ... and where
        exceptionreport = sys.exc_info()[2]
        fullermessage   = traceback.format_tb(exceptionreport)[0]
        arcpy.AddError("at this location: \n\n" + fullermessage + "\n")
        
    # Check in Spatial Analyst extension license
    arcpy.CheckInExtension("spatial")      
else:
    print "Spatial Analyst license is " + arcpy.CheckExtension("spatial")

    
    
#       ***The project consists of three parts. This is the third part of the script.***

"""
Following is the instruction for applying the tool to join socio-economic data from census (input should be in dbf format) to the input shapefiles based on GEOID,
and export a new shapefile. It then does a series of calculation based on field values to get the Pearson Correlation
between NTL urban index (NUDI) and population and road density:

To create an ArcToolbox tool with which to execute this script, do the following.
1   In  ArcMap > Catalog > Toolboxes > My Toolboxes, either select an existing toolbox
    or right-click on My Toolboxes and use New > Toolbox to create (then rename) a new one.
2   Drag (or use ArcToolbox > Add Toolbox to add) this toolbox to ArcToolbox.
3   Right-click on the toolbox in ArcToolbox, and use Add > Script to open a dialog box.
4   In this Add Script dialog box, use Label to name the tool being created, and press Next.
5   In a new dialog box, browse to the .py file to be invoked by this tool, and press Next.
6   In the next dialog box, specify the following inputs (using dropdown menus wherever possible)
    before pressing OK or Finish.
        DISPLAY NAME        DATA TYPE       PROPERTY>DIRECTION>VALUE       
        Input Shapefile     Shapefile		Input
		Join Table			Data Table		Input
		Join Field 1		String			Input
		Join Field 2		String			Input
        Output Shapefile    Shapefile  		Output
		Output Table		Table			Output

7   To later revise any of this, right-click to the tool's name and select Properties.           
"""

# Import external modules
import sys, os, string, math, arcpy, traceback, numpy

# Allow output to overwrite any existing grid of the same name
arcpy.env.overwriteOutput = True

# If Spatial Analyst license is available, check it out
if arcpy.CheckExtension("spatial") == "Available":
    arcpy.CheckOutExtension("spatial")
    
    try:
        # Request user input of data type = Feature Layer and direction = Input
        InputShapefile      = arcpy.GetParameterAsText(0)
        JoinTable          	= arcpy.GetParameterAsText(1)
        InputField         	= arcpy.GetParameterAsText(2)
        JoinField        	= arcpy.GetParameterAsText(3)
        OutputShapefile     = arcpy.GetParameterAsText(4)
		OutputTable		    = arcpy.GetParameterAsText(5)
		
		# Replicate the input shapefile
		arcpy.Copy_management(InputShapefile, OutputShapefile)
	
		# First delete the irrelevant fields from previous output
		# Drop certain fields from the attribute table of the input shapefile
		arcpy.DeleteField_management(in_table=OutputShapefile, drop_field="osm_id;code;fclass;name_1;ref;oneway;maxspeed;layer;bridge;tunnel")

		# Join user-specified table to the shapefile
		arcpy.JoinField_management(in_data=OutputShapefile, in_field=InputField, join_table=JoinTable, join_field=JoinField)
		# Here I joined the population of each county by GEOID.
	
		# Calculate population and road density in each county
		# Request user input of data type = String and direction = Input
		Field1 = "Area" # In hectares
		arcpy.AddMessage("The name of the field to be added is " + Field1 + "\n")
	
		Field2 = "Pop_den"
		arcpy.AddMessage("The name of the field to be added is " + Field2 + "\n")
	
		Field3 = "Road_den"
		arcpy.AddMessage("The name of the field to be added is " + Field3 + "\n")

		# Add new fields to the output shapefile
		arcpy.AddField_management(OutputShapefile, Field1, "DOUBLE", 20, 5)
		arcpy.AddField_management(OutputShapefile, Field2, "DOUBLE", 20, 5)
		arcpy.AddField_management(OutputShapefile, Field3, "DOUBLE", 20, 5)

		# Create an enumeration of updatable records from the shapefile's attribute table
		enumerationOfRecords = arcpy.UpdateCursor(OutputShapefile)
	
		# Loop through enumeration of records, calculating each geographic unit's total area (in hectares) and population density (ppl/hectare)
		for nextRecord in enumerationOfRecords:
			# Retrieve attribute values (land areas and water areas) from the next record's Shape field
			landArea   = nextRecord.getValue("ALAND") # the original values are in square meters
			waterArea  = nextRecord.getValue("AWATER")# the original values are in square meters
			Population = nextRecord.getValue("B01001e1")
			Road	   = nextRecord.getValue("FEET")

			# Calculate, record, and report the shape's total area (in hectares) and population density (ppl/hectare)
			TotalArea   = (landArea + waterArea) / 10000
			PopDen      = Population / TotalArea
			RoadDen		= Road / TotalArea
			nextRecord.setValue(Field1,TotalArea)
			nextRecord.setValue(Field2,PopDen)
			nextRecord.setValue(Field3,RoadDen)
			enumerationOfRecords.updateRow(nextRecord)
    
		# Delete row and update cursor objects to avoid locking attribute table
		del nextRecord
		del enumerationOfRecords
	
		# Calculate average NTL/NUDI across the years
		# Calculate Pearson Correlation between NTL and population and road density
		Field4 = "NTL" # average across the years
		arcpy.AddMessage("The name of the field to be added is " + Field4 + "\n")
	
		Field5 = "NTL_popden"
		arcpy.AddMessage("The name of the field to be added is " + Field5 + "\n")
	
		Field6 = "NTL_roadde"
		arcpy.AddMessage("The name of the field to be added is " + Field6 + "\n")

		# Add new fields to the output shapefile
		arcpy.AddField_management(OutputShapefile, Field4, "DOUBLE", 20, 5)
		arcpy.AddField_management(OutputShapefile, Field5, "DOUBLE", 20, 5)
		arcpy.AddField_management(OutputShapefile, Field6, "DOUBLE", 20, 5)

		# Create an enumeration of updatable records from the shapefile's attribute table
		enumerationOfRecords = arcpy.UpdateCursor(OutputShapefile)
	
		for nextRecord in enumerationOfRecords:
			field2   = nextRecord.getValue("Field2")
			field3   = nextRecord.getValue("Field3")
			field4   = nextRecord.getValue("Field4")
			field5   = nextRecord.getValue("Field5")
			field6   = nextRecord.getValue("Field6")
			field7   = nextRecord.getValue("Field7")
			field8   = nextRecord.getValue("Field8")
			field9   = nextRecord.getValue("Field9")
			field10   = nextRecord.getValue("Field10")
			field11   = nextRecord.getValue("Field11")
			field12   = nextRecord.getValue("Field12")
			field13   = nextRecord.getValue("Field13")
			field14   = nextRecord.getValue("Field14")
			field15   = nextRecord.getValue("Field15")
			popden	  = nextRecord.getValue("Pop_den")
			roadden   = nextRecord.getValue("Road_den")
		
			# Calculate average NTL across the year
			NTL   = (field2+field3+field4+field5+field6+field7+field8+field9+field10+field11+field12+field13+field14+field15) / 14
			NTL_popden = NTL * popden
			NTL_roadde = NTL * roadden	
			nextRecord.setValue(Field4, NTL)
			nextRecord.setValue(Field5, NTL_popden)
			nextRecord.setValue(Field6, NTL_roadde)
			enumerationOfRecords.updateRow(nextRecord)
    
		# Delete row and update cursor objects to avoid locking attribute table
		del nextRecord
		del enumerationOfRecords
	
		# Summary statistics
		# I want to calculate the correlation between NTL and population density, as well as NTL and road density, using Pearson's correlation.
		arcpy.Statistics_analysis(in_table=Output, out_table=OutputTable, statistics_fields="Pop_den MEAN;Pop_den STD;Road_den MEAN;Road_den STD;NTL MEAN;NTL STD;NTL_popden MEAN;NTL_roadde MEAN")	
		        
    except Exception as e:
        # If unsuccessful, end gracefully by indicating why
        arcpy.AddError('\n' + "Script failed because: \t\t" + e.message )
        # ... and where
        exceptionreport = sys.exc_info()[2]
        fullermessage   = traceback.format_tb(exceptionreport)[0]
        arcpy.AddError("at this location: \n\n" + fullermessage + "\n")
        
    # Check in Spatial Analyst extension license
    arcpy.CheckInExtension("spatial")      
else:
    print "Spatial Analyst license is " + arcpy.CheckExtension("spatial") 
