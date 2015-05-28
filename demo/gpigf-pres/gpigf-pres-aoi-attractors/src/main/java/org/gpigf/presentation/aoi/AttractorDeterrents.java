package org.gpigf.presentation.aoi;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.PrecisionModel;
import com.vividsolutions.jts.geom.util.LineStringExtracter;
import com.vividsolutions.jts.io.WKTReader;
import com.vividsolutions.jts.operation.distance.DistanceOp;
import com.vividsolutions.jts.operation.polygonize.Polygonizer;

public class AttractorDeterrents extends StaticMethodsProcessFactory<AttractorDeterrents> {

  public AttractorDeterrents() {
    super(Text.text("Polygon Tools"), "gpigf", AttractorDeterrents.class);
  }

  static Geometry polygonize(Geometry geometry) {
      List lines = LineStringExtracter.getLines(geometry);
      Polygonizer polygonizer = new Polygonizer();
      polygonizer.add(lines);
      Collection polys = polygonizer.getPolygons();
      Polygon[] polyArray = GeometryFactory.toPolygonArray(polys);
      return geometry.getFactory().createGeometryCollection(polyArray);
  }

  @DescribeProcess(title = "addAttractor", description = "Adds an attractor to the map")
  @DescribeResult(description = "Geometry collection created by creating a linestring to the attractor")
  public static GeometryCollection addAttractor(
      @DescribeParameter(name = "polygon", description = "Polygon to be unioned2") GeometryCollection poly,
      @DescribeParameter(name = "points", description = "Second geometry to union") GeometryCollection points,
      @DescribeParameter(name = "buffer", description = "Buffer size of attractor line") int buffer) {
      
	  List<Geometry> geometries = new ArrayList<Geometry>();
	  
	  for(int j = 0; j < poly.getNumGeometries(); j++) {
	  
		  Geometry polygon = poly.getGeometryN(j);
		  Coordinate[] var = new Coordinate[2];
		  var[0] = polygon.getCentroid().getCoordinate();
		  
		  List<Geometry> pointIntersections = new ArrayList<Geometry>();
		  
		  for (int i = 0; i < points.getNumGeometries(); i++) {
			  Geometry point = points.getGeometryN(i);
			  var[1] = point.getCentroid().getCoordinate();
			  
			  LineString l = new LineString(var,new PrecisionModel(),0);  
			  pointIntersections.add(l.intersection(polygon).buffer(buffer, 5));
		  }
		  
		  pointIntersections.add(polygon);
		  geometries.add(toGeometryCollection(poly, pointIntersections).union());
	  }
	  
	  return toGeometryCollection(poly, geometries);
  }
  
  @DescribeProcess(title = "addDeterrant", description = "Adds a deterrant to the map")
  @DescribeResult(description = "Geometry collection created by splitting the input polygon")
  public static Geometry addDeterrant(
	      @DescribeParameter(name = "polygon", description = "Polygon to be unioned2") GeometryCollection poly,
	      @DescribeParameter(name = "points", description = "Second geometry to union") GeometryCollection points,
	      @DescribeParameter(name = "buffer", description = "Buffer size of deterrant line") int buffer,
	      @DescribeParameter(name = "minLength", description = "maximum length of deterrant effect") double minLength) {
	  
	  List<Geometry> geometries = new ArrayList<Geometry>();
	  
	  for(int j = 0; j < poly.getNumGeometries(); j++) {
	  
		  Geometry polygon = poly.getGeometryN(j);
		  
		  List<Geometry> pointIntersections = new ArrayList<Geometry>();
		  
		  for (int i = 0; i < points.getNumGeometries(); i++) {
			  Geometry point = points.getGeometryN(i);
			  Coordinate[] var = new Coordinate[2];
			  
			  var[0] = DistanceOp.closestPoints(polygon, point)[0];
			  var[1] = point.getCoordinate();
			  
			  LineString l = new LineString(var,new PrecisionModel(),0);
			  
			  if (l.getLength() <= minLength) {
				  pointIntersections.add(l.difference(polygon).buffer(buffer, 5));
			  }
		  }
		  
		  Geometry g = toGeometryCollection(poly, pointIntersections).union();		  
		  
		  geometries.add(polygon.difference(g));
	  }
	  
	  return toGeometryCollection(poly, geometries);
  }
  
  @DescribeProcess(title = "growshape", description = "grows shape towards an attractor")
  @DescribeResult(description = "geometry collection created by splitting the input polygon")
  public static Geometry growShape(
		  @DescribeParameter(name = "shape", description = "shape to be grown") Geometry shape){
	  return shape.buffer(shape.getLength()/6, 5);
  }
  
  private static GeometryCollection toGeometryCollection(Geometry geometry, List<Geometry> geometryList) {
	return geometry.getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(geometryList));
}
}
