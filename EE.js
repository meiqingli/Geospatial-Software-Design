/**
 * Meiqing Li, meiqing@design.upenn.edu
 * CPLN670 Geospatical Software Design
 * Professor Dana Tomlin
 * December 20, 2017
 * 
 * Estimation of Urban Intensity in California Through Day and Night Remote Sensing Imagery
 * link to code: https://code.earthengine.google.com/4713547bc3a71d6fbec07023eab4fa89
 *
 * This script explores and processes day and night remote sensing imageries from multiple sources (i.e. DMSP-OLS,
 * Landsat-7, and MODIS), and develops a method to calculate urban intensity of different aggregated geographic unit of analysis.
 * It generates an urban index for each area, and export the outputs in csv format, which are ready for analysis
 * combining social and economic data in the same geographic units.
 * Taking California as study area, the script also identifies and visualizes urban and vegetation distribution
 * within the state.
 *
 * In addition to identifying approperiate statellite imageries, data prepocessing includes
 * converting shapefile to the following Google fusion tables :
 * US states: 1nEYqvsp5Rz-Bcb65ciRK7oFJ8SHbghh3HxueptKv
 * CA counties: 1v0rngDKfy2cuBsedRlvtwjmc_BAK44XpPXUtSDVx
 * CA MSAs: 1hh6__GDkTvOrxPS0oUPZwswiAjWazFiamr6x8FxG
**/
 
//customize basemap
Map.setOptions('SATELLITE');

//color palette of NDVI
var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301'];

//collect the US state features
var USstate = ee.FeatureCollection('ft:1nEYqvsp5Rz-Bcb65ciRK7oFJ8SHbghh3HxueptKv'); //US States
var CAstate = USstate.filterMetadata('NAME','equals','California'); //California State
//center to the study area
Map.centerObject(CAstate, 6);
//import CA county features
var CACounty = ee.FeatureCollection('ft:1v0rngDKfy2cuBsedRlvtwjmc_BAK44XpPXUtSDVx'); //CA Counties
//import CA MSA features
var CAMSA = ee.FeatureCollection('ft:1hh6__GDkTvOrxPS0oUPZwswiAjWazFiamr6x8FxG'); //CA MSAs

//paint the state, county and MSA outlines

// Create an empty image into which to paint the features, cast to byte.
var empty = ee.Image().byte();

var outlines = empty.paint({
  featureCollection: CAstate,
  color: 1,
  width: 4
});
Map.addLayer(outlines, {palette: 'FFFFFF'}, 'California');

var empty = ee.Image().byte();
var outlines = empty.paint({
  featureCollection: CACounty,
  color: 1,
  width: 2
});
Map.addLayer(outlines, {palette: '111111'}, 'Counties');

var empty = ee.Image().byte();
var outlines = empty.paint({
  featureCollection: CAMSA,
  color: 1,
  width: 2
});
Map.addLayer(outlines, {palette: 'FFFFFF'}, 'MSAs');

//import DMSP-OLS imagery
//check DMSP-OLS image collection
var NTL = ee.ImageCollection('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS'); //all night Lighting
print('Night Lighting Images', NTL);
//extract NTL image from 2013 (latest)
var NTL = ee.Image('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F182013'); //night Lighting in 2013
print('Night Lighting Image 2013', NTL);
//extract stable light band
var NTL = ee.Image('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F182013').expression('b(1)'); //select stable lights
print('Stable Light Band 2013', NTL);
//since the original band value has a range of 0 to 255, need to resample it to NTL's record range from 0 to 63
var NTL = NTL.clamp(0,63);
print(NTL,'NTL');
//clip images to study area (California)
var NTL_CA = NTL.clip(CAstate);

//add NTL image of California to the map
Map.addLayer(NTL_CA, {min: 0, max: 1, palette: ['000044','ffff00','ffffff'], opacity: 0.5},'Stable Light');

//classify light intensity by NTL values
//create masks
var c1 = NTL_CA.eq(0);
var c2 = NTL_CA.gt(0);
var c3 = NTL_CA.gt(20);
var c4 = NTL_CA.gt(30);
var c5 = NTL_CA.gt(40);
var c6 = NTL_CA.gt(50);

//visualize NTL classification
var CA_c1 = ee.Image(1);
var CA_c1 = CA_c1.mask(c1);
Map.addLayer(CA_c1, {min: 0, max: 1,palette: '#c9c7c7'},'c1');

var CA_c2 = ee.Image(1);
var CA_c2 = CA_c2.mask(c2);
Map.addLayer(CA_c2, {min: 0, max: 1,palette: '#0000FF'},'c2');

var CA_c3 = ee.Image(1);
var CA_c3 = CA_c3.mask(c3);
Map.addLayer(CA_c3, {min: 0, max: 1,palette: '#9aedca'},'c3');

var CA_c4 = ee.Image(1);
var CA_c4 = CA_c4.mask(c4);
Map.addLayer(CA_c4, {min: 0, max: 1,palette: '#00ff00'},'c4');

var CA_c5 = ee.Image(1);
var CA_c5 = CA_c5.mask(c5);
Map.addLayer(CA_c5, {min: 0, max: 1,palette: '#ffd670'},'c5');

var CA_c6 = ee.Image(1);
var CA_c6 = CA_c6.mask(c6);
Map.addLayer(CA_c6, {min: 0, max: 1,palette: '#ff0000'},'c6');


//classify urban, suburban and rural zones by NTL values
//create zonal masks
var rural = NTL_CA.gt(0);
var suburban = NTL_CA.gt(15);
var urban = NTL_CA.gt(62);

//visualize zonal classification
var CA_rural = ee.Image(1);
var CA_rural = CA_rural.mask(rural);
Map.addLayer(CA_rural, {min: 0, max: 1,palette: '#0000FF'},'Rural');

var CA_suburban = ee.Image(1);
var CA_suburban = CA_suburban.mask(suburban);
Map.addLayer(CA_suburban, {min: 0, max: 1,palette: '#00FF00'},'Suburban');

var CA_urban = ee.Image(1);
var CA_urban = CA_urban.mask(urban);
Map.addLayer(CA_urban, {min: 0, max: 1,palette: '#FF0000'},'Urban');


//normalize NTL values for urban index calculation
var NTL_CA = NTL.expression('b(0)/63');
print(NTL_CA,'NTL_CA');


//import Landsat-7 imagery

//check Landsat-7 NDVI composite image collection
var LandsatNDVI = ee.ImageCollection('LANDSAT/LE7_L1T_ANNUAL_NDVI'); //all Landsat-7 NDVI composite
print('LANDSAT/LE7_L1T_ANNUAL_NDVI', LandsatNDVI);
//extract 2013 Landsat-7 NVDI annual composite
var LandsatNDVI = ee.Image('LANDSAT/LE7_L1T_ANNUAL_NDVI/2013'); //Landsat-7 NDVI composite in 2013
print('LANDSAT/LE7_L1T_ANNUAL_NDVI', LandsatNDVI);
//clip images to study area (California)
var LandsatNDVI_CA = LandsatNDVI.clip(CAstate);
//add Landsat-7 NDVI image from 2013 to the map
Map.addLayer(LandsatNDVI_CA, {min: 0, max: 1, palette: palette}, 'Landsat-7 NDVI (2013)');

//There has been a ETM+ scan line corrector (SLC) failure since May 2003.
//extract an image before 2003 and compare
var LandsatNDVI1 = ee.Image('LANDSAT/LE7_L1T_ANNUAL_NDVI/2002'); //Landsat-7 NDVI composite in 2002
//clip images to study area (California)
var LandsatNDVI1_CA = LandsatNDVI1.clip(CAstate);
//add Landsat-7 NDVI image from 2002 to the map
Map.addLayer(LandsatNDVI1_CA, {min: 0, max: 1, palette: palette}, 'Landsat-7 NDVI (2002)');

//calibrate Landsat-7 TOA Reflectance imagery and compare
//import Landsat-7 TOA Reflectance image collection; take the average of annual values
var LandsatTOA = ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate('2013-01-01','2013-12-31').mean();
print(LandsatTOA, 'LANDSAT/LE7_L1T_TOA');

//generate a bad pixel mask by examining the product of Bands 1-5 and Band 7
//if the product equals 0, the pixel should be eliminated
var mask = LandsatTOA.expression(
    'Blue * Green * Red * NIR * SWI1 * SWI2', {
      'Blue': LandsatTOA.select('B1'),
      'Green': LandsatTOA.select('B2'),
      'Red': LandsatTOA.select('B3'),
      'NIR': LandsatTOA.select('B4'),
      'SWI1': LandsatTOA.select('B5'),
      'SWI2': LandsatTOA.select('B7'),
});
print(mask, 'mask');
var mask_CA = mask.clip(CAstate);
Map.addLayer(mask_CA, {min: 1, max: 0, palette: '111111'}, 'mask');

//apply mask to the LandsatTOA image
var LandsatTOA = LandsatTOA.mask(mask);
print(LandsatTOA, 'Landsat TOA (calibrated)');
//calculate NDVI of the calibrated LandsatTOA image
var LandsatNDVI2 = LandsatTOA.normalizedDifference(['B4', 'B3']);
print(LandsatNDVI2, 'Landsat NDVI (calibrated)');
//clip images to study area (California)
var LandsatNDVI2_CA = LandsatNDVI2.clip(CAstate);
//add Landsat-7 TOA image from 2013 to the map
Map.addLayer(LandsatNDVI2_CA, {min: 0, max: 1, palette: palette}, 'Landsat-7 TOA (calibrated)');
/**
 * Here since the whole area is masked, no data from Landsat-7 is applicable in this case.
**/

//import MODIS imagery
//check MODIS image collection
var MODISNDVI = ee.ImageCollection('MODIS/MCD43A4_NDVI'); //all MODIS combined 16-day NDVI
print('MODIS NDVI', MODISNDVI);
//create a new image based on the mean of NDVI of images from 2013
var MODISNDVI = MODISNDVI.filterDate('2013-01-01','2013-12-31').mean(); //take the average of annual values
print('MODIS NDVI 2013', MODISNDVI);
//clip images to study area (California)
var MODISNDVI_CA = MODISNDVI.clip(CAstate);
//add MODIS NDVI image to the map
Map.addLayer(MODISNDVI_CA, {min: 0, max: 1, palette: palette}, 'MODIS NDVI');


//aggreagte NTL and NDVI values into units of analysis

//get the mean of NTL values in each CA counties
var CACounty_NTL = NTL_CA.reduceRegions({
  collection: CACounty,
  reducer: ee.Reducer.mean(),
  scale: 1000,
});
// Print the first feature, to illustrate the result.
print(ee.Feature(CACounty_NTL.first()),'County NTL');

//get the mean of NDVI values in each CA counties
var CACounty_NDVI = MODISNDVI_CA.reduceRegions({
  collection: CACounty,
  reducer: ee.Reducer.mean(),
  scale: 1000,
});
// Print the first feature, to illustrate the result.
print(ee.Feature(CACounty_NDVI.first()),'County NDVI');

//join NTL and NDVI features of CA counties
//define an inner join.
var innerJoin = ee.Join.inner();

//specify an equals filter
var filter1 = ee.Filter.equals({
  leftField: 'COUNTYFP',
  rightField: 'COUNTYFP'
});

//apply the join
var innerJoined1 = innerJoin.apply(CACounty_NTL, CACounty_NDVI, filter1);
//display the join result
print('Inner join output:', innerJoined1);

//calculate Normalized Difference Urban Index (NDUI)
//apply a function to all objects in a feature collection
var field = function NDUI(feature) {
var thePrimaryFeature   = ee.Feature(feature.get('primary')); 
var thePrimaryMean      = ee.Number(thePrimaryFeature.get('mean'));
var theSecondaryFeature = ee.Feature(feature.get('secondary')); 
var theSecondaryMean    = ee.Number(theSecondaryFeature.get('mean')); 
var theNumerator        = thePrimaryMean.subtract(theSecondaryMean);
var theDenominator      = thePrimaryMean.add(theSecondaryMean);
var CANDUI              = theNumerator.divide(theDenominator);
return feature.set({'NDUI': CANDUI});};

var innerJoined1 = ee.FeatureCollection(innerJoined1.map(field));
print('California Counties NDUI', innerJoined1.getInfo());

//visualize the results in histogram by counties
var TheCHART    = Chart.feature.histogram( innerJoined1, 'NDUI', 50 );
var TheCHART    = TheCHART.setSeriesNames( ['NDUI'] );
var TheCHART    = TheCHART.setOptions( { title:  'NDUI by County in 2013',
                                         colors: ['#ffd670'],
                                         hAxis:  {title:'NDUI'},
                                         vAxis:  {title:'Number of Counties'}});
print(TheCHART);


//add reducer output to MSA features in the collection
var CAMSA_NTL = NTL_CA.reduceRegions({
  collection: CAMSA,
  reducer: ee.Reducer.mean(),
  scale: 1000,
});
print(ee.FeatureCollection(CAMSA_NTL),'MSA NTL');

var CAMSA_NDVI = MODISNDVI_CA.reduceRegions({
  collection: CAMSA,
  reducer: ee.Reducer.mean(),
  scale: 1000,
});
print(ee.FeatureCollection(CAMSA_NDVI),'MSA NDVI');

//join NTL and NDVI features of CA MSAs
//specify an equals filter
var filter2 = ee.Filter.equals({
  leftField: 'CBSAFP',
  rightField: 'CBSAFP'
});

//apply the join
var innerJoined2 = innerJoin.apply(CAMSA_NTL, CAMSA_NDVI, filter2);
//display the join result
print('Inner join output:', innerJoined2);

var innerJoined2 = ee.FeatureCollection(innerJoined2.map(field));
print('California MSAs NDUI', innerJoined2.getInfo());

//visualize the results in histogram by counties
var TheCHART    = Chart.feature.histogram( innerJoined2, 'NDUI', 30 );
var TheCHART    = TheCHART.setSeriesNames( ['NDUI'] );
var TheCHART    = TheCHART.setOptions( { title:  'NDUI by MSA in 2013',
                                         colors: ['#b2e8f7'],
                                         hAxis:  {title:'NDUI'},
                                         vAxis:  {title:'Number of MSAs'}});
print(TheCHART);

//export the FeatureCollection to CSV files
Export.table.toDrive({
  collection: innerJoined1,
  description:'County_NDUI',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: innerJoined2,
  description: 'MSA_NDUI',
  fileFormat: 'CSV'
});



/**
 * Following is a cleaned up script for exporting time series data.
 * User-defined inputs are highlighted. 
**/

//Time Series Output

//collect the US state features
var USstate = ee.FeatureCollection('ft:1nEYqvsp5Rz-Bcb65ciRK7oFJ8SHbghh3HxueptKv'); //US States
var CAstate = USstate.filterMetadata('NAME','equals','California'); //California State

//import CA county features
var CACounty = ee.FeatureCollection('ft:1v0rngDKfy2cuBsedRlvtwjmc_BAK44XpPXUtSDVx'); //CA Counties

//import CA MSA features
var CAMSA = ee.FeatureCollection('ft:1hh6__GDkTvOrxPS0oUPZwswiAjWazFiamr6x8FxG'); //CA MSAs

//import DMSP-OLS imagery, extract stable light band
var NTL = ee.Image('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F182012').expression('b(1)'); //select stable lights;
//since the original band value has a range of 0 to 255, need to resample it to NTL's record range from 0 to 63
var NTL = NTL.clamp(0,63);
//normalize NTL values
var NTL = NTL.expression('b(0)/63');

//import MODIS imagery
//create a new image based on the mean of NDVI of images from specific year
var MODISNDVI = ee.ImageCollection('MODIS/MCD43A4_NDVI').filterDate('2012-01-01','2012-12-31').mean(); //take the average of annual values

//clip images to study area (California)
var NTL_CA = NTL.clip(CAstate);
var MODISNDVI_CA = MODISNDVI.clip(CAstate);

//aggreagte NTL and NDVI values into units of analysis

//get the mean of NTL values in each CA counties
var CACounty_NTL = NTL_CA.reduceRegions({
  collection: CACounty,
  reducer: ee.Reducer.mean(),
  scale: 1000,
});

//get the mean of NDVI values in each CA counties
var CACounty_NDVI = MODISNDVI_CA.reduceRegions({
  collection: CACounty,
  reducer: ee.Reducer.mean(),
  scale: 1000,
});

//join NTL and NDVI features of CA counties
//define an inner join.
var innerJoin = ee.Join.inner();

//specify an equals filter
var filter1 = ee.Filter.equals({
  leftField: 'COUNTYFP',
  rightField: 'COUNTYFP'
});

//apply the join
var innerJoined1 = innerJoin.apply(CACounty_NTL, CACounty_NDVI, filter1);
//display the join result

//calculate Normalized Difference Urban Index (NDUI)
var field = function NDUI(feature) {
var thePrimaryFeature = ee.Feature(feature.get('primary')); 
var thePrimaryMean    = ee.Number(thePrimaryFeature.get('mean'));
var theSecondaryFeature = ee.Feature(feature.get('secondary')); 
var theSecondaryMean    = ee.Number(theSecondaryFeature.get('mean')); 
var theNumerator      = thePrimaryMean.subtract(theSecondaryMean);
var theDenominator   = thePrimaryMean.add(theSecondaryMean);
var CANDUI               = theNumerator.divide(theDenominator);
return feature.set({'NDUI': CANDUI});};

var innerJoined1 = ee.FeatureCollection(innerJoined1.map(field));

//add reducer output to MSA features in the collection
var CAMSA_NTL = NTL_CA.reduceRegions({
  collection: CAMSA,
  reducer: ee.Reducer.mean(),
  scale: 1000,
});

var CAMSA_NDVI = MODISNDVI_CA.reduceRegions({
  collection: CAMSA,
  reducer: ee.Reducer.mean(),
  scale: 1000,
});

//join NTL and NDVI features of CA MSAs
//specify an equals filter
var filter2 = ee.Filter.equals({
  leftField: 'CBSAFP',
  rightField: 'CBSAFP'
});

//apply the join
var innerJoined2 = innerJoin.apply(CAMSA_NTL, CAMSA_NDVI, filter2);
//display the join result

var innerJoined2 = ee.FeatureCollection(innerJoined2.map(field));

//export the FeatureCollection to a CSV file
Export.table.toDrive({
  collection: innerJoined1,
  description:'County_NDUI_2012',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: innerJoined2,
  description: 'MSA_NDUI_2012',
  fileFormat: 'CSV'
});
